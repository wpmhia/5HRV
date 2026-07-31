export function naturalCubicSpline(x: number[], y: number[], xOut: number[]): number[] {
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
