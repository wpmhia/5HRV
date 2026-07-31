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

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function smoothnessPriors(y: number[], lambda: number): number[] {
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

function buildTachogram(
  timesMs: number[],
  values: number[],
  durationMs: number,
  fs: number,
): number[] {
  const n = timesMs.length;
  if (n === 0) return [];
  const dt = 1000 / fs;
  const m = Math.max(1, Math.floor(durationMs / dt));
  const xOut = new Array<number>(m);
  for (let k = 0; k < m; k++) xOut[k] = k * dt;
  return naturalCubicSpline(timesMs, values, xOut);
}

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wLenR = Math.cos(ang);
    const wLenI = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wR = 1;
      let wI = 0;
      for (let k = 0; k < len / 2; k++) {
        const uR = re[i + k];
        const uI = im[i + k];
        const vR = re[i + k + len / 2] * wR - im[i + k + len / 2] * wI;
        const vI = re[i + k + len / 2] * wI + im[i + k + len / 2] * wR;
        re[i + k] = uR + vR;
        im[i + k] = uI + vI;
        re[i + k + len / 2] = uR - vR;
        im[i + k + len / 2] = uI - vI;
        const nextR = wR * wLenR - wI * wLenI;
        const nextI = wR * wLenI + wI * wLenR;
        wR = nextR;
        wI = nextI;
      }
    }
  }
}

function periodogram(segment: number[], fs: number): { lfPower: number; hfPower: number } {
  const n = segment.length;
  if (n < 4) return { lfPower: 0, hfPower: 0 };
  const m = mean(segment);
  const nfft = nextPowerOfTwo(n);
  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);
  for (let i = 0; i < n; i++) re[i] = segment[i] - m;
  fft(re, im);

  let lf = 0;
  let hf = 0;
  const scale = 2 / (n * nfft);
  for (let k = 1; k < nfft / 2; k++) {
    const freq = (k * fs) / nfft;
    const power = scale * (re[k] * re[k] + im[k] * im[k]);
    if (freq >= LF_LOW_HZ && freq <= LF_HIGH_HZ) lf += power;
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

export function calculateHrv(nn: number[]): HrvMetrics {
  const n = nn.length;
  const meanRr = mean(nn);
  const meanHr = meanRr > 0 ? 60000 / meanRr : 0;

  const detrended = smoothnessPriors(nn, DETREND_LAMBDA);

  let sumSqDiff = 0;
  let nn50 = 0;
  for (let i = 1; i < detrended.length; i++) {
    const d = detrended[i] - detrended[i - 1];
    sumSqDiff += d * d;
    if (Math.abs(d) > 50) nn50++;
  }
  const rmssd = detrended.length > 1 ? Math.sqrt(sumSqDiff / (detrended.length - 1)) : 0;
  const sdnn = standardDeviation(detrended, mean(detrended));
  const pnn50 = detrended.length > 1 ? (nn50 / (detrended.length - 1)) * 100 : 0;

  const timesMs = new Array<number>(n);
  timesMs[0] = 0;
  for (let i = 1; i < n; i++) timesMs[i] = timesMs[i - 1] + nn[i - 1];
  const durationMs = timesMs[n - 1] + nn[n - 1];
  const tachogram = buildTachogram(timesMs, detrended, durationMs, RESAMPLE_FREQUENCY_HZ);
  const { lfPower, hfPower } = welchPower(tachogram, RESAMPLE_FREQUENCY_HZ);

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
