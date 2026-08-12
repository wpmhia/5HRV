import { naturalCubicSpline } from "@/lib/cubicSpline";

export type HrvMetrics = {
  rmssd: number;
  sdnn: number;
  pnn50: number;
  meanHr: number;
  totalBeats: number;
  hfPower: number;
  lfPower: number;
  lfhfRatio: number;
};

export const RESAMPLE_FREQUENCY_HZ = 4;
export const LF_LOW_HZ = 0.04;
export const LF_HIGH_HZ = 0.15;
export const HF_LOW_HZ = 0.15;
export const HF_HIGH_HZ = 0.4;
export const DETREND_LAMBDA = 500;
export const WELCH_WINDOW_SECONDS = 300;

function sum(values: number[]): number {
  let s = 0;
  for (const v of values) s += v;
  return s;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function standardDeviation(values: number[], m: number): number {
  if (values.length < 2) return 0;
  let s = 0;
  for (const v of values) {
    const d = v - m;
    s += d * d;
  }
  return Math.sqrt(s / (values.length - 1));
}

export function smoothnessPriors(y: number[], lambda: number): number[] {
  const n = y.length;
  if (n < 4) return y.slice();
  const lambda2 = lambda * lambda;

  const diag = new Array<number>(n).fill(1 + 6 * lambda2);
  const sub1 = new Array<number>(n - 1).fill(-4 * lambda2);
  const sub2 = new Array<number>(n - 2).fill(lambda2);
  if (n >= 1) diag[0] = 1 + lambda2;
  if (n >= 2) {
    diag[n - 1] = 1 + lambda2;
    sub1[0] = -2 * lambda2;
    sub1[n - 2] = -2 * lambda2;
  }
  if (n >= 3) {
    diag[1] = 1 + 5 * lambda2;
    diag[n - 2] = 1 + 5 * lambda2;
  }

  const l0 = new Float64Array(n);
  const l1 = new Float64Array(n);
  const l2 = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    let d = diag[j];
    if (j >= 1) d -= l1[j] * l1[j];
    if (j >= 2) d -= l2[j] * l2[j];
    l0[j] = Math.sqrt(Math.max(d, 1e-12));
    if (j + 1 < n) {
      let s = sub1[j];
      if (j >= 1) s -= l2[j + 1] * l1[j];
      l1[j + 1] = s / l0[j];
    }
    if (j + 2 < n) {
      l2[j + 2] = sub2[j] / l0[j];
    }
  }

  const z = new Float64Array(n);
  z[0] = y[0] / l0[0];
  if (n >= 2) z[1] = (y[1] - l1[1] * z[0]) / l0[1];
  for (let i = 2; i < n; i++) {
    z[i] = (y[i] - l1[i] * z[i - 1] - l2[i] * z[i - 2]) / l0[i];
  }
  z[n - 1] /= l0[n - 1];
  if (n >= 2) z[n - 2] = (z[n - 2] - l1[n - 1] * z[n - 1]) / l0[n - 2];
  for (let i = n - 3; i >= 0; i--) {
    let s = z[i];
    if (i + 1 < n) s -= l1[i + 1] * z[i + 1];
    if (i + 2 < n) s -= l2[i + 2] * z[i + 2];
    z[i] = s / l0[i];
  }

  const residual = new Array<number>(n);
  for (let i = 0; i < n; i++) residual[i] = y[i] - z[i];
  return residual;
}

export function buildTachogram(
  timesMs: number[],
  values: number[],
  durationMs: number,
  fs: number,
): number[] {
  const n = timesMs.length;
  if (n === 0) return [];
  const dt = 1000 / fs;
  const m = Math.max(1, Math.floor(durationMs / dt));
  const lastBeatMs = timesMs[n - 1];
  const xOut = new Array<number>(m);
  for (let k = 0; k < m; k++) {
    const t = k * dt;
    xOut[k] = t > lastBeatMs ? lastBeatMs : t;
  }
  return naturalCubicSpline(timesMs, values, xOut);
}

function periodogram(segment: number[], fs: number): { lfPower: number; hfPower: number } {
  const n = segment.length;
  if (n < 4) return { lfPower: 0, hfPower: 0 };
  const m = mean(segment);
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) x[i] = segment[i] - m;

  // FFT point density equals the Welch window width (no zero-padding), matching
  // the Kubios default frequency grid. Only bins in the LF/HF bands are needed.
  const scale = 2 / (n * n);
  const kMin = Math.max(1, Math.ceil((LF_LOW_HZ * n) / fs));
  const kMax = Math.floor((HF_HIGH_HZ * n) / fs);
  let lf = 0;
  let hf = 0;
  for (let k = kMin; k <= kMax; k++) {
    const freq = (k * fs) / n;
    const omega = (2 * Math.PI * k) / n;
    const cStep = Math.cos(omega);
    const sStep = Math.sin(omega);
    let c = 1;
    let s = 0;
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      re += x[i] * c;
      im -= x[i] * s;
      const nextC = c * cStep - s * sStep;
      const nextS = c * sStep + s * cStep;
      c = nextC;
      s = nextS;
    }
    const power = scale * (re * re + im * im);
    if (freq >= LF_LOW_HZ && freq < LF_HIGH_HZ) lf += power;
    if (freq >= HF_LOW_HZ && freq <= HF_HIGH_HZ) hf += power;
  }
  return { lfPower: lf, hfPower: hf };
}

// Welch's periodogram: 300-second segments with 50% overlap, averaged.
// A complete five-minute series therefore yields a single segment; shorter
// series use the longest available segment length.
function welchPower(signal: number[], fs: number): { lfPower: number; hfPower: number } {
  const n = signal.length;
  if (n < 4) return { lfPower: 0, hfPower: 0 };
  const windowLength = Math.min(Math.round(WELCH_WINDOW_SECONDS * fs), n);
  const hop = Math.max(1, Math.floor(windowLength / 2));
  let lfTotal = 0;
  let hfTotal = 0;
  let segments = 0;
  for (let start = 0; start + windowLength <= n; start += hop) {
    const segment = signal.slice(start, start + windowLength);
    const { lfPower, hfPower } = periodogram(segment, fs);
    lfTotal += lfPower;
    hfTotal += hfPower;
    segments++;
  }
  if (segments === 0) return { lfPower: 0, hfPower: 0 };
  return { lfPower: lfTotal / segments, hfPower: hfTotal / segments };
}

export type CalculateHrvOptions = {
  analysisDurationMs?: number;
  spectralIntervals?: number[];
};

export function calculateHrv(nn: number[], options?: CalculateHrvOptions): HrvMetrics {
  const n = nn.length;
  if (n === 0 || !nn.every((v) => Number.isFinite(v))) {
    return {
      rmssd: 0,
      sdnn: 0,
      pnn50: 0,
      meanHr: 0,
      totalBeats: 0,
      hfPower: 0,
      lfPower: 0,
      lfhfRatio: 0,
    };
  }
  const meanRr = mean(nn);
  const meanHr = meanRr > 0 ? 60000 / meanRr : 0;

  const detrendedTime = smoothnessPriors(nn, DETREND_LAMBDA);

  let sumSqDiff = 0;
  let nn50 = 0;
  for (let i = 1; i < detrendedTime.length; i++) {
    const d = detrendedTime[i] - detrendedTime[i - 1];
    sumSqDiff += d * d;
    if (Math.abs(d) > 50) nn50++;
  }
  const rmssd = detrendedTime.length > 1 ? Math.sqrt(sumSqDiff / (detrendedTime.length - 1)) : 0;
  const sdnn = standardDeviation(detrendedTime, mean(detrendedTime));
  const pnn50 = detrendedTime.length > 1 ? (nn50 / (detrendedTime.length - 1)) * 100 : 0;

  const spectral = options?.spectralIntervals ?? nn;
  const detrendedSpectral =
    spectral === nn ? detrendedTime : smoothnessPriors(spectral, DETREND_LAMBDA);

  let lfPower = 0;
  let hfPower = 0;
  if (spectral.length > 0 && spectral.every((v) => Number.isFinite(v))) {
    const timesMs = new Array<number>(spectral.length);
    timesMs[0] = 0;
    for (let i = 1; i < spectral.length; i++) timesMs[i] = timesMs[i - 1] + spectral[i - 1];
    const durationMs =
      options?.analysisDurationMs ?? timesMs[spectral.length - 1] + spectral[spectral.length - 1];
    const tachogram = buildTachogram(timesMs, detrendedSpectral, durationMs, RESAMPLE_FREQUENCY_HZ);
    ({ lfPower, hfPower } = welchPower(tachogram, RESAMPLE_FREQUENCY_HZ));
  }

  return {
    rmssd,
    sdnn,
    pnn50,
    meanHr,
    totalBeats: n,
    hfPower,
    lfPower,
    lfhfRatio: hfPower > 0 ? lfPower / hfPower : 0,
  };
}
