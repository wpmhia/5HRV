export type RecordingQuality = "good" | "acceptable" | "poor";

export type CorrectionResult = {
  nn: number[];
  totalIntervals: number;
  correctedIntervals: number;
  artifactPercentage: number;
  quality: RecordingQuality;
  reason?: string;
};

const MIN_RR_MS = 200;
const MAX_RR_MS = 2000;
const DEVIATION_RATIO = 0.2;
const MAX_CONSECUTIVE_ARTIFACT_RUN = 30;
const GOOD_ARTIFACT_PERCENT = 3;
const POOR_ARTIFACT_PERCENT = 5;

function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
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
    if (!Number.isFinite(v) || v < MIN_RR_MS || v > MAX_RR_MS) {
      artifact[i] = true;
    }
  }

  for (let i = 0; i < n; i++) {
    if (artifact[i]) continue;
    const window: number[] = [];
    for (let j = i - 2; j <= i + 2; j++) {
      if (j === i || j < 0 || j >= n || artifact[j]) continue;
      window.push(rr[j]);
    }
    if (window.length < 3) continue;
    const med = median(window);
    const ratio = rr[i] / med;
    if (ratio > 1 + DEVIATION_RATIO || ratio < 1 - DEVIATION_RATIO) {
      artifact[i] = true;
    }
  }

  return artifact;
}

function interpolateRuns(rr: number[], artifact: boolean[]): number[] {
  const n = rr.length;
  const out = rr.slice();
  let i = 0;
  while (i < n) {
    if (!artifact[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < n && artifact[j]) j++;
    const leftIndex = i - 1;
    const rightIndex = j;
    const leftVal = leftIndex >= 0 ? out[leftIndex] : rr[i];
    const rightVal = rightIndex < n ? out[rightIndex] : rr[i];
    const span = j - i + 1;
    for (let k = i; k < j; k++) {
      const t = (k - i + 1) / span;
      out[k] = leftVal + (rightVal - leftVal) * t;
    }
    i = j;
  }
  return out;
}

export function correctRrIntervals(rr: number[]): CorrectionResult {
  const totalIntervals = rr.length;
  const artifact = detectArtifacts(rr);
  const correctedIntervals = artifact.filter(Boolean).length;
  const nn = interpolateRuns(rr, artifact);
  const artifactPercentage = totalIntervals > 0 ? (correctedIntervals / totalIntervals) * 100 : 0;

  const maxRun = maxConsecutiveRun(artifact);
  let quality: RecordingQuality = "good";
  let reason: string | undefined;
  if (artifactPercentage > POOR_ARTIFACT_PERCENT || maxRun > MAX_CONSECUTIVE_ARTIFACT_RUN) {
    quality = "poor";
    reason = maxRun > MAX_CONSECUTIVE_ARTIFACT_RUN
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
