import { describe, it, expect } from "vitest";
import { calculateHrv } from "@/lib/calculateHrv";
import { correctRrIntervals, detectArtifacts } from "@/lib/rrArtifactCorrection";
import { parseHeartRateMeasurement } from "@/lib/bluetoothHeartRate";

function generateModulatedRr(
  base: number,
  amplitude: number,
  freqHz: number,
  beats: number,
): number[] {
  const rr: number[] = [];
  let t = 0;
  for (let i = 0; i < beats; i++) {
    const v = base + amplitude * Math.sin(2 * Math.PI * freqHz * t);
    rr.push(v);
    t += v / 1000;
  }
  return rr;
}

function expectClose(actual: number, expected: number, relTol: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.max(Math.abs(expected) * relTol, 1e-6),
  );
}

describe("calculateHrv", () => {
  it("handles an empty input without crashing", () => {
    const hrv = calculateHrv([]);
    expect(hrv.totalBeats).toBe(0);
    expect(hrv.rmssd).toBe(0);
    expect(hrv.sdnn).toBe(0);
    expect(hrv.pnn50).toBe(0);
    expect(hrv.meanHr).toBe(0);
    expect(hrv.lfPower).toBe(0);
    expect(hrv.hfPower).toBe(0);
  });

  it("returns zeroed metrics for non-finite input", () => {
    const hrv = calculateHrv([800, NaN, 820, Infinity]);
    expect(hrv.totalBeats).toBe(0);
    expect(hrv.rmssd).toBe(0);
    expect(hrv.sdnn).toBe(0);
    expect(hrv.lfPower).toBe(0);
    expect(hrv.hfPower).toBe(0);
  });

  it("calculates time-domain metrics", () => {
    const rr = [800, 840, 800, 840, 800, 840, 800, 840, 800, 840];
    const hrv = calculateHrv(rr);
    expect(hrv.totalBeats).toBe(10);
    expect(hrv.rmssd).toBeCloseTo(40, 0);
    expect(hrv.meanHr).toBeCloseTo(60000 / 820, 1);
    expect(hrv.sdnn).toBeGreaterThan(0);
  });

  it("calculates pNN50 as the share of successive differences above 50 ms", () => {
    const rr: number[] = [];
    for (let i = 0; i < 100; i++) {
      rr.push(800);
      rr.push(900);
    }
    const hrv = calculateHrv(rr);
    expect(hrv.pnn50).toBeCloseTo(100, 1);
  });

  it("concentrates power in the LF band for a 0.1 Hz modulation", () => {
    const rr = generateModulatedRr(1000, 20, 0.1, 300);
    const hrv = calculateHrv(rr);
    expect(hrv.lfPower).toBeGreaterThan(hrv.hfPower);
    expect(hrv.lfPower).toBeGreaterThan(120);
  });

  it("concentrates power in the HF band for a 0.25 Hz modulation", () => {
    const rr = generateModulatedRr(1000, 20, 0.25, 300);
    const hrv = calculateHrv(rr);
    expect(hrv.hfPower).toBeGreaterThan(hrv.lfPower);
    expect(hrv.hfPower).toBeGreaterThan(120);
  });

  it("returns near-zero spectral power for a constant series", () => {
    const rr = new Array<number>(300).fill(1000);
    const hrv = calculateHrv(rr);
    expect(hrv.lfPower + hrv.hfPower).toBeLessThan(1);
  });

  it("computes an LF/HF ratio from LF and HF power", () => {
    const rr = generateModulatedRr(1000, 20, 0.1, 300);
    const hrv = calculateHrv(rr);
    expect(hrv.lfhfRatio).toBeCloseTo(hrv.lfPower / hrv.hfPower, 2);
  });

  it("uses a boundary-crossing interval as spectral support without changing time-domain metrics", () => {
    const complete = generateModulatedRr(1000, 20, 0.1, 299);
    const spectral = [...complete, 1000];
    const withSupport = calculateHrv(complete, {
      analysisDurationMs: 300000,
      spectralIntervals: spectral,
    });
    const withoutSupport = calculateHrv(complete, { analysisDurationMs: 300000 });
    expect(withSupport.totalBeats).toBe(299);
    expect(withSupport.rmssd).toBeCloseTo(withoutSupport.rmssd, 10);
    expect(withSupport.sdnn).toBeCloseTo(withoutSupport.sdnn, 10);
    expect(withSupport.pnn50).toBeCloseTo(withoutSupport.pnn50, 10);
    expect(withSupport.meanHr).toBeCloseTo(withoutSupport.meanHr, 10);
    expect(withSupport.lfPower).toBeGreaterThan(120);
  });

  it("reconstructs the spectral sample exactly from complete plus boundary support", () => {
    const full = generateModulatedRr(1005, 20, 0.1, 300);
    const complete: number[] = [];
    const spectral: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < full.length; i++) {
      const v = full[i];
      spectral.push(v);
      if (cumulative + v > 300000) {
        if (i + 1 < full.length) spectral.push(full[i + 1]);
        break;
      }
      complete.push(v);
      cumulative += v;
    }

    const reference = calculateHrv(full, { analysisDurationMs: 300000 });
    const withSupport = calculateHrv(complete, {
      analysisDurationMs: 300000,
      spectralIntervals: spectral,
    });
    const withoutSupport = calculateHrv(complete, { analysisDurationMs: 300000 });

    expect(withSupport.rmssd).toBeCloseTo(withoutSupport.rmssd, 10);
    expect(withSupport.sdnn).toBeCloseTo(withoutSupport.sdnn, 10);
    expect(withSupport.meanHr).toBeCloseTo(withoutSupport.meanHr, 10);

    expect(withSupport.lfPower).toBeCloseTo(reference.lfPower, 3);
    expect(withSupport.hfPower).toBeCloseTo(reference.hfPower, 3);
    expect(Math.abs(withSupport.lfPower - withoutSupport.lfPower)).toBeGreaterThan(0.05);
  });
});

describe("correctRrIntervals", () => {
  it("corrects a missed beat at the start of the series", () => {
    const rr = new Array<number>(100).fill(800);
    rr[0] = 1600;
    const result = correctRrIntervals(rr);
    expect(result.totalIntervals).toBe(101);
    expect(result.correctedIntervals).toBe(1);
    expect(result.nn[0]).toBeCloseTo(800, 0);
    expect(result.nn[1]).toBeCloseTo(800, 0);
  });

  it("inserts a missing beat for a doubled interval", () => {
    const rr = new Array<number>(100).fill(800);
    rr[50] = 1600;
    const result = correctRrIntervals(rr);
    expect(result.totalIntervals).toBe(101);
    expect(result.correctedIntervals).toBe(1);
    expect(result.artifactPercentage).toBeCloseTo(1, 1);
    expect(result.quality).toBe("good");
    expect(result.nn[50]).toBeCloseTo(800, 0);
    expect(result.nn[51]).toBeCloseTo(800, 0);
  });

  it("counts every inserted beat for a multi-missed interval", () => {
    const rr = new Array<number>(100).fill(800);
    rr[50] = 2400;
    const result = correctRrIntervals(rr);
    expect(result.totalIntervals).toBe(102);
    expect(result.correctedIntervals).toBe(2);
    expect(result.quality).toBe("good");
  });

  it("rejects an isolated raw gap above the signal-loss threshold", () => {
    const rr = new Array<number>(100).fill(800);
    rr[50] = 5000;
    const result = correctRrIntervals(rr);
    expect(result.quality).toBe("poor");
    expect(result.reason).toContain("signal loss");
    expect(result.nn).toEqual([]);
  });

  it("removes an extra beat by merging a short interval with the next", () => {
    const rr = new Array<number>(100).fill(800);
    rr[50] = 300;
    rr[51] = 900;
    const result = correctRrIntervals(rr);
    expect(result.totalIntervals).toBeLessThan(100);
    expect(result.correctedIntervals).toBeGreaterThanOrEqual(1);
    expect(result.quality).toBe("good");
  });

  it("detects a run of implausible intervals as substantial signal loss", () => {
    const rr = new Array<number>(100).fill(800);
    for (let i = 40; i < 80; i++) rr[i] = 3000;
    const result = correctRrIntervals(rr);
    expect(result.quality).toBe("poor");
    expect(result.reason).toContain("signal loss");
  });

  it("flags ambiguous long intervals that are not clean integer multiples", () => {
    const rr = new Array<number>(100).fill(800);
    rr[50] = 2000; // 2.5 beats: cannot be a confident missed detection
    const result = correctRrIntervals(rr);
    expect(result.ambiguousIntervals).toBeGreaterThan(0);
    expect(result.usable).toBe(false);
    expect(result.reason).toMatch(/ambiguous/i);
  });

  it("keeps rhythm suitability separate and rejects more than 20 ectopic beats", () => {
    let rr = new Array<number>(600).fill(800);
    for (let k = 0; k < 21; k++) {
      const at = 30 + k * 10;
      rr = rr.slice(0, at).concat([350, 450], rr.slice(at + 1));
    }
    const result = correctRrIntervals(rr);
    expect(result.ectopicBeats).toBeGreaterThan(20);
    expect(result.rhythmSuitable).toBe(false);
    expect(result.usable).toBe(false);
    expect(result.reason).toMatch(/ectopic/i);
  });

  it("classifies recordings with more than 5% artefacts as poor", () => {
    const rr = new Array<number>(100).fill(800);
    for (const idx of [5, 15, 25, 35, 45, 55]) rr[idx] = 1600;
    const result = correctRrIntervals(rr);
    expect(result.quality).toBe("poor");
  });

  it("classifies recordings between 3% and 5% as acceptable", () => {
    const rr = new Array<number>(100).fill(800);
    for (const idx of [5, 15, 25, 35]) rr[idx] = 1600;
    const result = correctRrIntervals(rr);
    expect(result.artifactPercentage).toBeGreaterThan(3);
    expect(result.artifactPercentage).toBeLessThanOrEqual(5);
    expect(result.quality).toBe("acceptable");
  });

  it("handles an empty input without crashing", () => {
    const result = correctRrIntervals([]);
    expect(result.totalIntervals).toBe(0);
    expect(result.quality).toBe("good");
    expect(result.nn).toEqual([]);
  });

  it("exposes detection independently of correction", () => {
    const rr = new Array<number>(50).fill(800);
    rr[25] = 1600;
    const artifact = detectArtifacts(rr);
    expect(artifact[25]).toBe(true);
  });
});

describe("parseHeartRateMeasurement", () => {
  it("parses 8-bit heart rate and RR intervals in ms", () => {
    const buffer = new Uint8Array([0x10, 70, 0x00, 0x04, 0x00, 0x02]);
    const result = parseHeartRateMeasurement(new DataView(buffer.buffer));
    expect(result.heartRate).toBe(70);
    expect(result.rrIntervalsMs).toEqual([1000, 500]);
  });

  it("parses 16-bit heart rate without RR intervals", () => {
    const buffer = new Uint8Array([0x01, 0x2c, 0x01]);
    const result = parseHeartRateMeasurement(new DataView(buffer.buffer));
    expect(result.heartRate).toBe(300);
    expect(result.rrIntervalsMs).toEqual([]);
  });

  it("skips energy-expended bytes when present", () => {
    const buffer = new Uint8Array([0x18, 70, 0x0a, 0x00, 0x00, 0x04]);
    const result = parseHeartRateMeasurement(new DataView(buffer.buffer));
    expect(result.heartRate).toBe(70);
    expect(result.rrIntervalsMs).toEqual([1000]);
  });

  it("parses sensor contact flags", () => {
    const unsupported = parseHeartRateMeasurement(new DataView(new Uint8Array([0x10, 70]).buffer));
    expect(unsupported.contactSupported).toBe(false);
    expect(unsupported.contactDetected).toBe(false);

    const supportedNoContact = parseHeartRateMeasurement(new DataView(new Uint8Array([0x14, 70]).buffer));
    expect(supportedNoContact.contactSupported).toBe(true);
    expect(supportedNoContact.contactDetected).toBe(false);

    const contactGood = parseHeartRateMeasurement(new DataView(new Uint8Array([0x16, 70]).buffer));
    expect(contactGood.contactSupported).toBe(true);
    expect(contactGood.contactDetected).toBe(true);
  });
});

describe("golden validation", () => {
  const constant = new Array<number>(300).fill(800);

  const alternating: number[] = [];
  for (let i = 0; i < 150; i++) alternating.push(800, 900);

  const lfModulated = generateModulatedRr(1000, 20, 0.1, 300);
  const hfModulated = generateModulatedRr(1000, 20, 0.25, 300);

  const missedBeat = new Array<number>(300).fill(800);
  missedBeat[150] = 1600;

  const withDuration = (rr: number[]) => calculateHrv(rr, { analysisDurationMs: 300000 });

  it("matches golden values for a constant series", () => {
    const hrv = withDuration(constant);
    expect(hrv.rmssd).toBeLessThan(1e-6);
    expect(hrv.sdnn).toBeLessThan(1e-6);
    expect(hrv.pnn50).toBe(0);
    expect(hrv.meanHr).toBeCloseTo(75, 1);
    expect(hrv.totalBeats).toBe(300);
    expect(hrv.lfPower).toBeLessThan(1e-9);
    expect(hrv.hfPower).toBeLessThan(1e-9);
  });

  it("matches golden values for an alternating series", () => {
    const hrv = withDuration(alternating);
    expectClose(hrv.rmssd, 100, 0.01);
    expectClose(hrv.sdnn, 50.08, 0.01);
    expectClose(hrv.pnn50, 100, 0.01);
    expectClose(hrv.meanHr, 70.588, 0.01);
    expect(hrv.totalBeats).toBe(300);
    expectClose(hrv.lfPower, 13.689, 0.05);
    expectClose(hrv.hfPower, 4.225, 0.05);
  });

  it("matches golden values for a 0.1 Hz modulated series", () => {
    const hrv = withDuration(lfModulated);
    expectClose(hrv.rmssd, 8.727, 0.05);
    expectClose(hrv.sdnn, 14.148, 0.05);
    expect(hrv.pnn50).toBe(0);
    expectClose(hrv.meanHr, 60.012, 0.01);
    expect(hrv.totalBeats).toBe(300);
    expectClose(hrv.lfPower, 199.287, 0.05);
    expectClose(hrv.hfPower, 0.028, 0.5);
    expectClose(hrv.lfhfRatio, 7195.06, 0.1);
  });

  it("matches golden values for a 0.25 Hz modulated series", () => {
    const hrv = withDuration(hfModulated);
    expectClose(hrv.rmssd, 20, 0.05);
    expectClose(hrv.sdnn, 14.163, 0.05);
    expect(hrv.pnn50).toBe(0);
    expectClose(hrv.meanHr, 60.009, 0.01);
    expect(hrv.totalBeats).toBe(300);
    expectClose(hrv.lfPower, 0.017, 0.5);
    expectClose(hrv.hfPower, 194.361, 0.05);
  });

  it("restores a clean series after structural artefact correction", () => {
    const correction = correctRrIntervals(missedBeat);
    expect(correction.quality).toBe("good");
    expect(correction.totalIntervals).toBe(301);
    const hrv = calculateHrv(correction.nn);
    expect(hrv.rmssd).toBeLessThan(1e-6);
    expect(hrv.sdnn).toBeLessThan(1e-6);
    expect(hrv.totalBeats).toBe(301);
  });
});
