import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { extractWindow } from "@/lib/analyzeHrvRecording";
import { correctRrIntervals } from "@/lib/rrArtifactCorrection";
import {
  calculateHrv,
  smoothnessPriors,
  buildTachogram,
  DETREND_LAMBDA,
  RESAMPLE_FREQUENCY_HZ,
  WELCH_WINDOW_SECONDS,
} from "@/lib/calculateHrv";
import { windowedWelchLfHf } from "@/lib/welchReference";

const fixtureDir = join(process.cwd(), "tests", "fixtures", "hrv-recordings");

type Fixture = {
  name: string;
  rr: number[];
  expected: { ok: boolean };
};

const fixtures = readdirSync(fixtureDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(fixtureDir, f), "utf8")) as Fixture)
  .filter((f) => f.expected.ok);

function buildSpectralTachogram(rr: number[]) {
  const correction = correctRrIntervals(rr);
  if (!correction.usable) return null;
  const { completeIntervals, spectralIntervals } = extractWindow(correction.nn, 300_000);
  const detrended = smoothnessPriors(spectralIntervals, DETREND_LAMBDA);
  const timesMs = new Array<number>(spectralIntervals.length);
  timesMs[0] = 0;
  for (let i = 1; i < spectralIntervals.length; i++) {
    timesMs[i] = timesMs[i - 1] + spectralIntervals[i - 1];
  }
  return {
    completeIntervals,
    spectralIntervals,
    tachogram: buildTachogram(timesMs, detrended, 300_000, RESAMPLE_FREQUENCY_HZ),
  };
}

// Drift-dominated recordings place low-frequency power close to the LF band
// edge (0.04 Hz), where the choice of taper (rectangular vs Hann) has the
// largest effect. Allow a wider tolerance there.
const WIDE_TOLERANCE_FIXTURES = new Set(["slow-hr-drift"]);

describe("spectral parity vs windowed Welch reference", () => {
  it.each(fixtures.map((f) => [f.name, f] as const))(
    "%s LF/HF ratio is consistent with a Hann-windowed Welch periodogram",
    (_name, fixture) => {
      const built = buildSpectralTachogram(fixture.rr);
      expect(built).not.toBeNull();

      const engine = calculateHrv(built!.completeIntervals, {
        analysisDurationMs: 300_000,
        spectralIntervals: built!.spectralIntervals,
      });
      const ref = windowedWelchLfHf(built!.tachogram, RESAMPLE_FREQUENCY_HZ, WELCH_WINDOW_SECONDS);

      const engineRatio = engine.hfPower > 0 ? engine.lfPower / engine.hfPower : 0;
      const refRatio = ref.hfPower > 0 ? ref.lfPower / ref.hfPower : 0;
      const relativeDifference =
        Math.abs(engineRatio - refRatio) / Math.max(Math.abs(refRatio), 1e-6);

      const tolerance = WIDE_TOLERANCE_FIXTURES.has(fixture.name) ? 0.5 : 0.1;
      expect(relativeDifference).toBeLessThan(tolerance);
    },
  );
});
