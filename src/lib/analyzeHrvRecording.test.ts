import { describe, it, expect } from "vitest";
import { analyzeHrvRecording, extractWindow } from "@/lib/analyzeHrvRecording";

const options = {
  analysisDurationSeconds: 300,
  minAnalysedMs: 296_000,
};

function makeSeries(n: number): number[] {
  return new Array<number>(n).fill(800);
}

describe("analyzeHrvRecording", () => {
  it("accepts a clean five-minute recording", () => {
    const analysis = analyzeHrvRecording(makeSeries(385), {
      ...options,
      source: "bluetooth_rr",
      preparationSeconds: 300,
      posture: "supine",
    });
    expect(analysis.ok).toBe(true);
    expect(analysis.metrics).toBeDefined();
    expect(analysis.engineVersion).toBeDefined();
  });

  it("rejects a recording shorter than five minutes", () => {
    const analysis = analyzeHrvRecording(makeSeries(300), options);
    expect(analysis.ok).toBe(false);
    expect(analysis.rejectionReason).toMatch(/five-minute/i);
  });

  it("rejects invalid RR interval data", () => {
    const analysis = analyzeHrvRecording([800, NaN, 800], options);
    expect(analysis.ok).toBe(false);
    expect(analysis.rejectionReason).toMatch(/invalid/i);
  });

  it("still analyses a recording without preparation metadata", () => {
    const analysis = analyzeHrvRecording(makeSeries(385), {
      ...options,
      source: "bluetooth_rr",
      preparationSeconds: 0,
      posture: "supine",
    });
    expect(analysis.ok).toBe(true);
    expect(analysis.metrics).toBeDefined();
  });

  it("rejects a recording with ambiguous long intervals", () => {
    const rr = makeSeries(385);
    rr[200] = 2000;
    const analysis = analyzeHrvRecording(rr, options);
    expect(analysis.ok).toBe(false);
    expect(analysis.rejectionReason).toMatch(/ambiguous/i);
  });

  it("extracts the exact analysis window plus boundary support", () => {
    const rr = makeSeries(400);
    const { completeIntervals, spectralIntervals } = extractWindow(rr, 300_000);
    const completeMs = completeIntervals.reduce((s, v) => s + v, 0);
    expect(completeMs).toBeLessThanOrEqual(300_000);
    expect(spectralIntervals.length).toBeGreaterThan(completeIntervals.length);
  });
});
