import {
  LF_LOW_HZ,
  LF_HIGH_HZ,
  HF_LOW_HZ,
  HF_HIGH_HZ,
} from "@/lib/calculateHrv";

// Reference implementation of a Hann-windowed Welch periodogram, kept separate
// from the production engine so spectral behaviour can be compared
// independently. This mirrors the non-parametric FFT/Welch approach used by
// Kubios and the DanFunD analysis pipeline (300 s window, 50% overlap, tapered).
export function hannWindow(n: number): number[] {
  const w = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  }
  return w;
}

export function windowedWelchLfHf(
  signal: number[],
  fs: number,
  windowSeconds: number,
): { lfPower: number; hfPower: number } {
  const n = signal.length;
  if (n < 4) return { lfPower: 0, hfPower: 0 };

  const winLen = Math.min(Math.round(windowSeconds * fs), n);
  const hop = Math.max(1, Math.floor(winLen / 2));

  const segments: number[][] = [];
  for (let start = 0; start + winLen <= n; start += hop) {
    segments.push(signal.slice(start, start + winLen));
  }
  if (segments.length === 0) segments.push(signal.slice(0, winLen));

  const window = hannWindow(winLen);
  const windowPower = window.reduce((s, v) => s + v * v, 0);

  let lfPower = 0;
  let hfPower = 0;
  for (const segment of segments) {
    const mean = segment.reduce((s, v) => s + v, 0) / segment.length;
    const winSeg = segment.map((v, i) => (v - mean) * window[i]);

    for (let k = 1; k <= Math.floor(winLen / 2); k++) {
      let re = 0;
      let im = 0;
      for (let i = 0; i < winLen; i++) {
        const angle = (2 * Math.PI * k * i) / winLen;
        re += winSeg[i] * Math.cos(angle);
        im -= winSeg[i] * Math.sin(angle);
      }
      const power = (re * re + im * im) / windowPower;
      const freq = (k * fs) / winLen;
      if (freq >= LF_LOW_HZ && freq < LF_HIGH_HZ) {
        lfPower += power;
      } else if (freq >= HF_LOW_HZ && freq <= HF_HIGH_HZ) {
        hfPower += power;
      }
    }
  }

  return { lfPower: lfPower / segments.length, hfPower: hfPower / segments.length };
}
