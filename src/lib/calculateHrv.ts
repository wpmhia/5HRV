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

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
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

  const apply = (p: number[]): number[] => {
    const q = new Array<number>(n - 2).fill(0);
    for (let i = 0; i < n - 2; i++) q[i] = p[i] - 2 * p[i + 1] + p[i + 2];
    const out = new Array<number>(n);
    for (let j = 0; j < n; j++) {
      let s = 0;
      if (j >= 2) s += q[j - 2];
      if (j >= 1 && j - 1 < q.length) s += -2 * q[j - 1];
      if (j < q.length) s += q[j];
      out[j] = p[j] + lambda2 * s;
    }
    return out;
  };

  const x = new Array<number>(n).fill(0);
  const r = y.slice();
  const p = r.slice();
  let rho = dot(r, r);
  const tolerance = 1e-12 * rho;
  for (let iter = 0; iter < 300; iter++) {
    if (rho <= tolerance) break;
    const ap = apply(p);
    const pAp = dot(p, ap);
    if (pAp === 0) break;
    const alpha = rho / pAp;
    for (let i = 0; i < n; i++) {
      x[i] += alpha * p[i];
      r[i] -= alpha * ap[i];
    }
    const rhoNext = dot(r, r);
    if (rhoNext <= tolerance) break;
    const beta = rhoNext / rho;
    for (let i = 0; i < n; i++) p[i] = r[i] + beta * p[i];
    rho = rhoNext;
  }

  const residual = new Array<number>(n);
  for (let i = 0; i < n; i++) residual[i] = y[i] - x[i];
  return residual;
}

function buildTachogram(timesMs: number[], values: number[], fs: number): number[] {
  const n = timesMs.length;
  if (n === 0) return [];
  const totalMs = timesMs[n - 1] + values[n - 1];
  const dt = 1000 / fs;
  const m = Math.max(1, Math.floor(totalMs / dt));
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
  const tachogram = buildTachogram(timesMs, detrended, RESAMPLE_FREQUENCY_HZ);
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
