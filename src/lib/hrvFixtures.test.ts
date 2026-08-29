import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { analyzeHrvRecording } from "@/lib/analyzeHrvRecording";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "hrv-recordings");

type Fixture = {
  name: string;
  rr: number[];
  expected: {
    ok: boolean;
    rejectionReason?: string;
    metrics?: {
      rmssd: number;
      sdnn: number;
      pnn50: number;
      meanHr: number;
      totalBeats: number;
      hfPower: number;
      lfPower: number;
      lfhfRatio: number;
    };
    quality?: string;
    structuralCorrections?: number;
    correctedIntervals?: number;
  };
};

const fixtures = readdirSync(fixtureDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(fixtureDir, f), "utf8")) as Fixture);

const engineOptions = {
  analysisDurationSeconds: 300,
  minAnalysedMs: 296_000,
  source: "bluetooth_rr" as const,
  preparationSeconds: 300,
  posture: "supine",
};

describe("HRV differential fixture suite", () => {
  it.each(fixtures.map((f) => [f.name, f] as const))(
    "%s matches stored reference output",
    (_name, fixture) => {
      const analysis = analyzeHrvRecording(fixture.rr, engineOptions);
      expect(analysis.ok).toBe(fixture.expected.ok);

      if (!fixture.expected.ok) {
        expect(analysis.rejectionReason).toBe(fixture.expected.rejectionReason);
        return;
      }

      expect(analysis.metrics).toBeDefined();
      expect(analysis.correction).toBeDefined();
      const metrics = analysis.metrics!;
      const expected = fixture.expected.metrics!;
      expect(metrics.rmssd).toBeCloseTo(expected.rmssd, 4);
      expect(metrics.sdnn).toBeCloseTo(expected.sdnn, 4);
      expect(metrics.pnn50).toBeCloseTo(expected.pnn50, 4);
      expect(metrics.meanHr).toBeCloseTo(expected.meanHr, 4);
      expect(metrics.totalBeats).toBe(expected.totalBeats);
      expect(metrics.hfPower).toBeCloseTo(expected.hfPower, 4);
      expect(metrics.lfPower).toBeCloseTo(expected.lfPower, 4);
      expect(metrics.lfhfRatio).toBeCloseTo(expected.lfhfRatio, 4);
      expect(analysis.correction!.quality).toBe(fixture.expected.quality);
      expect(analysis.correction!.structuralCorrections).toBe(fixture.expected.structuralCorrections);
      expect(analysis.correction!.correctedIntervals).toBe(fixture.expected.correctedIntervals);
    },
  );
});
