import { naturalCubicSpline } from "@/lib/cubicSpline";

export type RecordingQuality = "good" | "acceptable" | "poor";

export type CorrectionResult = {
  nn: number[];
  totalIntervals: number;
  correctedIntervals: number;
  artifactPercentage: number;
  quality: RecordingQuality;
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

function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function localMedian(rr: number[], i: number): number {
  const window: number[] = [];
  for (let j = i - 2; j <= i + 2; j++) {
    if (j >= 0 && j < rr.length) window.push(rr[j]);
  }
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
    const ratio = med > 0 ? v / med : 1;
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

function correctBeatStructure(rr: number[]): { nn: number[]; corrections: number } {
  const n = rr.length;
  const nn: number[] = [];
  let corrections = 0;
  let i = 0;
  while (i < n) {
    if (i === 0) {
      nn.push(rr[0]);
      i++;
      continue;
    }
    const med = localMedian(rr, i);
    const ratio = med > 0 ? rr[i] / med : 1;
    if (ratio < EXTRA_BEAT_RATIO && i + 1 < n) {
      nn.push(rr[i] + rr[i + 1]);
      corrections++;
      i += 2;
    } else if (ratio > MISSED_BEAT_RATIO) {
      const parts = Math.max(2, Math.round(ratio));
      const each = rr[i] / parts;
      for (let k = 0; k < parts; k++) nn.push(each);
      corrections++;
      i++;
    } else {
      nn.push(rr[i]);
      i++;
    }
  }
  return { nn, corrections };
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

  const knownIndices: number[] = [];
  const knownValues: number[] = [];
  for (let i = 0; i < nn.length; i++) {
    if (!flagged[i]) {
      knownIndices.push(i);
      knownValues.push(nn[i]);
    }
  }

  if (knownIndices.length >= 2) {
    const interior: number[] = [];
    const firstKnown = knownIndices[0];
    const lastKnown = knownIndices[knownIndices.length - 1];
    for (const idx of flaggedIndices) {
      if (idx > firstKnown && idx < lastKnown) interior.push(idx);
    }
    if (interior.length > 0) {
      const values = naturalCubicSpline(knownIndices, knownValues, interior);
      for (let k = 0; k < interior.length; k++) {
        corrected[interior[k]] = values[k];
      }
    }
  }

  let corrections = 0;
  for (const idx of flaggedIndices) {
    corrections++;
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
    };
  }

  const { nn: structural, corrections: structuralCorrections } = correctBeatStructure(rr);
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

  let quality: RecordingQuality = "good";
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

  return {
    nn,
    totalIntervals,
    correctedIntervals,
    artifactPercentage,
    quality,
    reason,
  };
}
