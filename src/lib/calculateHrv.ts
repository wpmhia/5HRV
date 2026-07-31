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

function naturalCubicSpline(x: number[], y: number[], xOut: number[]): number[] {
  const n = x.length;
  if (n === 0) return [];
  if (n === 1) return xOut.map(() => y[0]);
  if (n === 2) return xOut.map((t) => y[0] + ((y[1] - y[0]) / (x[1] - x[0])) * (t - x[0]));

  const h = new Array<number>(n - 1);
  for (let i = 0; i < n - 1; i++) h[i] = x[i + 1] - x[i];

  const alpha = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    alpha[i] = (3 / h[i]) * (y[i + 1] - y[i]) - (3 / h[i - 1]) * (y[i] - y[i - 1]);
  }

  const l = new Array<number>(n).fill(0);
  const mu = new Array<number>(n).fill(0);
  const z = new Array<number>(n).fill(0);
  l[0] = 1;
  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }
  l[n - 1] = 1;

  const c = new Array<number>(n).fill(0);
  const b = new Array<number>(n).fill(0);
  const d = new Array<number>(n).fill(0);
  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (y[j + 1] - y[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }

  const out = new Array<number>(xOut.length);
  let j = 0;
  for (let k = 0; k < xOut.length; k++) {
    const t = xOut[k];
    while (j < n - 2 && t > x[j + 1]) j++;
    const dx = t - x[j];
    out[k] = y[j] + b[j] * dx + c[j] * dx * dx + d[j] * dx * dx * dx;
  }
  return out;
}

function buildTachogram(nn: number[], fs: number): number[] {
  const n = nn.length;
  if (n === 0) return [];
  const times = new Array<number>(n);
  times[0] = 0;
  for (let i = 1; i < n; i++) times[i] = times[i - 1] + nn[i - 1];
  const totalMs = times[n - 1] + nn[n - 1];
  const dt = 1000 / fs;
  const m = Math.max(1, Math.floor(totalMs / dt));
  const xOut = new Array<number>(m);
  for (let k = 0; k < m; k++) xOut[k] = k * dt;
  return naturalCubicSpline(times, nn, xOut);
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

function spectralPower(signal: number[], fs: number): { lfPower: number; hfPower: number } {
  const n = signal.length;
  if (n < 4) return { lfPower: 0, hfPower: 0 };
  const m = mean(signal);
  const nfft = nextPowerOfTwo(n);
  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);
  for (let i = 0; i < n; i++) re[i] = signal[i] - m;
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

export function calculateHrv(nn: number[]): HrvMetrics {
  const n = nn.length;
  const m = mean(nn);

  let sumSqDiff = 0;
  let nn50 = 0;
  for (let i = 1; i < n; i++) {
    const d = nn[i] - nn[i - 1];
    sumSqDiff += d * d;
    if (Math.abs(d) > 50) nn50++;
  }

  const rmssd = n > 1 ? Math.sqrt(sumSqDiff / (n - 1)) : 0;
  const sdnn = standardDeviation(nn, m);
  const pnn50 = n > 1 ? (nn50 / (n - 1)) * 100 : 0;
  const meanHr = m > 0 ? 60000 / m : 0;

  const tachogram = buildTachogram(nn, RESAMPLE_FREQUENCY_HZ);
  const detrended = smoothnessPriors(tachogram, DETREND_LAMBDA);
  const { lfPower, hfPower } = spectralPower(detrended, RESAMPLE_FREQUENCY_HZ);

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
