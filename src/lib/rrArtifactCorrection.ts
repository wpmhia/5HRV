import { naturalCubicSpline } from "@/lib/cubicSpline";

export type TechnicalQuality = "good" | "acceptable" | "poor";
export type RecordingQuality = TechnicalQuality;

export type CorrectionResult = {
  nn: number[];
  totalIntervals: number;
  correctedIntervals: number;
  artifactPercentage: number;
  /** Technical artefact burden: artefact percentage and signal loss only. */
  quality: TechnicalQuality;
  /** Number of RR sequences that required structural reconstruction. This is not an ECG ectopy count. */
  structuralCorrections: number;
  /** @deprecated Use structuralCorrections; RR-only data cannot establish ectopy. */
  ectopicBeats: number;
  /** Technical suitability gate; it must not be interpreted as an ECG ectopy result. */
  rhythmSuitable: boolean;
  /** Number of long intervals that could not be confidently classified as missed detections. */
  ambiguousIntervals: number;
  /** Whether the recording can be used for HRV analysis at all. */
  usable: boolean;
  reason?: string;
};

const MIN_RR_MS = 250;
const MAX_RR_MS = 2000;
const MISSED_BEAT_RATIO = 1.5;
const EXTRA_BEAT_RATIO = 0.5;
const ABNORMAL_RATIO = 0.25;
const SIGNAL_LOSS_RUN = 30;
const SIGNAL_LOSS_GAP_MS = 4000;
const GOOD_ARTIFACT_PERCENT = 3;
const POOR_ARTIFACT_PERCENT = 5;
const DANFUND_MAX_ECTOPIC_BEATS = 20;

function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function localMedian(rr: number[], i: number): number {
  const window: number[] = [];
  for (let j = i - 2; j <= i + 2; j++) {
    if (j === i || j < 0 || j >= rr.length) continue;
    const v = rr[j];
    if (Number.isFinite(v)) window.push(v);
  }
  if (window.length < 2) return NaN;
  return median(window);
}

function maxConsecutiveRun(artifact: boolean[]): number {
  let max = 0;
  let current = 0;
  for (const flagged of artifact) {
    current = flagged ? current + 1 : 0;
    if (current > max) max = current;
  }
  return max;
}

export function detectArtifacts(rr: number[]): boolean[] {
  const n = rr.length;
  const artifact = new Array<boolean>(n).fill(false);
  for (let i = 0; i < n; i++) {
    const v = rr[i];
    const med = localMedian(rr, i);
    if (!Number.isFinite(med)) continue;
    const ratio = v / med;
    if (
      !Number.isFinite(v) ||
      v < MIN_RR_MS ||
      v > MAX_RR_MS ||
      ratio > 1 + ABNORMAL_RATIO ||
      ratio < 1 - ABNORMAL_RATIO
    ) {
      artifact[i] = true;
    }
  }
  return artifact;
}

function correctBeatStructure(rr: number[]): {
  nn: number[];
  corrections: number;
  ambiguous: number;
} {
  const n = rr.length;
  const nn: number[] = [];
  let corrections = 0;
  let ambiguous = 0;
  let i = 0;
  while (i < n) {
    const med = localMedian(rr, i);
    if (!Number.isFinite(med)) {
      nn.push(rr[i]);
      i++;
      continue;
    }
    const ratio = rr[i] / med;
    if (ratio < EXTRA_BEAT_RATIO && i + 1 < n) {
      nn.push(rr[i] + rr[i + 1]);
      corrections++;
      i += 2;
    } else if (ratio > MISSED_BEAT_RATIO) {
      const beatCount = rr[i] / med;
      const parts = Math.max(2, Math.round(beatCount));
      const each = rr[i] / parts;
      // Splitting a long interval into artificial equal beats assumes a missed
      // sensor detection. With RR-only data this cannot be distinguished from a
      // genuine pause or rhythm abnormality. Only repair when the interval is
      // close to an integer number of beats AND the reconstructed beats match
      // the local rhythm; otherwise flag as ambiguous so the recording can be
      // rejected instead of manufacturing NN intervals.
      if (
        Math.abs(beatCount - parts) > 0.2 ||
        Math.abs(each - med) / med > ABNORMAL_RATIO
      ) {
        ambiguous++;
        nn.push(rr[i]);
      } else {
        for (let k = 0; k < parts; k++) nn.push(each);
        corrections += parts - 1;
      }
      i++;
    } else {
      nn.push(rr[i]);
      i++;
    }
  }
  return { nn, corrections, ambiguous };
}

function interpolateAbnormal(
  nn: number[],
  flagged: boolean[],
): { corrected: number[]; corrections: number } {
  const corrected = nn.slice();
  const flaggedIndices: number[] = [];
  for (let i = 0; i < nn.length; i++) {
    if (flagged[i]) flaggedIndices.push(i);
  }
  if (flaggedIndices.length === 0) {
    return { corrected, corrections: 0 };
  }

  const splined = new Set<number>();
  const knownIndices: number[] = [];
  const knownValues: number[] = [];
  for (let i = 0; i < nn.length; i++) {
    if (!flagged[i]) {
      knownIndices.push(i);
      knownValues.push(nn[i]);
    }
  }

  if (knownIndices.length >= 2) {
    const firstKnown = knownIndices[0];
    const lastKnown = knownIndices[knownIndices.length - 1];
    const interior: number[] = [];
    for (const idx of flaggedIndices) {
      if (idx > firstKnown && idx < lastKnown) interior.push(idx);
    }
    if (interior.length > 0) {
      const values = naturalCubicSpline(knownIndices, knownValues, interior);
      for (let k = 0; k < interior.length; k++) {
        corrected[interior[k]] = values[k];
        splined.add(interior[k]);
      }
    }
  }

  let corrections = 0;
  for (const idx of flaggedIndices) {
    corrections++;
    if (splined.has(idx)) continue;
    let left = idx - 1;
    while (left >= 0 && flagged[left]) left--;
    let right = idx + 1;
    while (right < nn.length && flagged[right]) right++;
    if (left >= 0 && right < nn.length) {
      corrected[idx] = (nn[left] + nn[right]) / 2;
    } else if (left >= 0) {
      corrected[idx] = nn[left];
    } else if (right < nn.length) {
      corrected[idx] = nn[right];
    } else {
      corrected[idx] = nn[idx];
    }
  }
  return { corrected, corrections };
}

export function correctRrIntervals(rr: number[]): CorrectionResult {
  if (rr.length === 0) {
    return {
      nn: [],
      totalIntervals: 0,
      correctedIntervals: 0,
      artifactPercentage: 0,
      quality: "good",
      structuralCorrections: 0,
      ectopicBeats: 0,
      rhythmSuitable: true,
      ambiguousIntervals: 0,
      usable: true,
    };
  }

  let rawMaxGap = 0;
  for (const v of rr) {
    if (Number.isFinite(v) && v > rawMaxGap) rawMaxGap = v;
  }
  if (rawMaxGap > SIGNAL_LOSS_GAP_MS) {
    return {
      nn: [],
      totalIntervals: rr.length,
      correctedIntervals: 0,
      artifactPercentage: 0,
      quality: "poor",
      structuralCorrections: 0,
      ectopicBeats: 0,
      rhythmSuitable: true,
      ambiguousIntervals: 0,
      usable: false,
      reason: "Substantial signal loss detected.",
    };
  }

  const { nn: structural, corrections: structuralCorrections, ambiguous: ambiguousIntervals } =
    correctBeatStructure(rr);
  const flagged = detectArtifacts(structural);
  const maxRun = maxConsecutiveRun(flagged);
  let maxGap = 0;
  for (const v of structural) {
    if (v > maxGap) maxGap = v;
  }
  const { corrected: nn, corrections: abnormalCorrections } = interpolateAbnormal(structural, flagged);

  const totalIntervals = nn.length;
  const correctedIntervals = structuralCorrections + abnormalCorrections;
  const artifactPercentage = totalIntervals > 0 ? (correctedIntervals / totalIntervals) * 100 : 0;

  const rhythmSuitable = structuralCorrections <= DANFUND_MAX_ECTOPIC_BEATS;

  let quality: TechnicalQuality = "good";
  let reason: string | undefined;
  if (
    artifactPercentage > POOR_ARTIFACT_PERCENT ||
    maxRun > SIGNAL_LOSS_RUN ||
    maxGap > SIGNAL_LOSS_GAP_MS
  ) {
    quality = "poor";
    reason = maxRun > SIGNAL_LOSS_RUN || maxGap > SIGNAL_LOSS_GAP_MS
      ? "Substantial signal loss detected."
      : "Excessive detected artefacts.";
  } else if (artifactPercentage > GOOD_ARTIFACT_PERCENT) {
    quality = "acceptable";
  }

  const usable = quality !== "poor" && rhythmSuitable && ambiguousIntervals === 0;

  if (!usable && !reason) {
    if (ambiguousIntervals > 0) {
      reason =
        "Ambiguous RR intervals detected that cannot be reliably classified as technical artefacts. Repeat the measurement.";
    } else if (!rhythmSuitable) {
      reason = `Excessive structural RR corrections (${structuralCorrections}) detected; the recording is not suitable for five-minute HRV reference interpretation.`;
    }
  }

  return {
    nn,
    totalIntervals,
    correctedIntervals,
    artifactPercentage,
    quality,
    structuralCorrections,
    ectopicBeats: structuralCorrections,
    rhythmSuitable,
    ambiguousIntervals,
    usable,
    reason,
  };
}
