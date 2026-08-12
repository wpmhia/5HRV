/**
 * Generates synthetic HRV recording fixtures with reference outputs produced by
 * the current engine baseline.
 *
 * These fixtures are fully synthetic (deterministic, seeded) and contain no
 * identifiable data. The stored `expected` values are produced by the engine
 * and serve as differential regression references: any engine change that
 * alters the output for an unchanged input is detected by the fixture test.
 *
 * NOTE: The values are NOT yet independently validated against Kubios or the
 * DanFunD analysis pipeline. External parity validation is a separate exercise
 * (see the methodology page); these fixtures lock the current implementation
 * against regressions in the meantime.
 *
 * Run with: bun run scripts/generate-hrv-fixtures.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeHrvRecording } from "../src/lib/analyzeHrvRecording";

type Generator = (rng: () => number) => number[];

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BEATS = 385;
const DT = 0.8;

function cleanSeries(rng: () => number, hfAmp: number, lfAmp: number, noise: number): number[] {
  const rr: number[] = [];
  for (let i = 0; i < BEATS; i++) {
    const t = i * DT;
    const resp = hfAmp * Math.sin(2 * Math.PI * 0.24 * t);
    const lf = lfAmp * Math.sin(2 * Math.PI * 0.08 * t);
    const jitter = (rng() - 0.5) * noise;
    rr.push(Math.round(800 + resp + lf + jitter));
  }
  return rr;
}

function insertExtraBeat(rr: number[], atIndex: number): number[] {
  const next = rr.slice();
  next.splice(atIndex, 1, 350, 450);
  return next;
}

function insertMissedDetection(rr: number[], atIndex: number): number[] {
  const next = rr.slice();
  next.splice(atIndex, 2, 1600);
  return next;
}

const generators: { name: string; gen: Generator }[] = [
  { name: "clean-normal", gen: (rng) => cleanSeries(rng, 40, 12, 10) },
  { name: "high-vagal-variation", gen: (rng) => cleanSeries(rng, 90, 15, 12) },
  { name: "low-variability", gen: (rng) => cleanSeries(rng, 4, 2, 4) },
  {
    name: "respiratory-hf-dominant",
    gen: (rng) => {
      const rr: number[] = [];
      for (let i = 0; i < BEATS; i++) {
        const t = i * DT;
        const resp = 75 * Math.sin(2 * Math.PI * 0.28 * t);
        const jitter = (rng() - 0.5) * 6;
        rr.push(Math.round(800 + resp + jitter));
      }
      return rr;
    },
  },
  {
    name: "lf-dominant",
    gen: (rng) => {
      const rr: number[] = [];
      for (let i = 0; i < BEATS; i++) {
        const t = i * DT;
        const lf = 65 * Math.sin(2 * Math.PI * 0.09 * t);
        const jitter = (rng() - 0.5) * 8;
        rr.push(Math.round(800 + lf + jitter));
      }
      return rr;
    },
  },
  {
    name: "slow-hr-drift",
    gen: (rng) => {
      const rr: number[] = [];
      for (let i = 0; i < BEATS; i++) {
        const t = i * DT;
        const drift = 200 * (i / BEATS); // 700 -> 900 ms
        const resp = 20 * Math.sin(2 * Math.PI * 0.2 * t);
        const jitter = (rng() - 0.5) * 8;
        rr.push(Math.round(700 + drift + resp + jitter));
      }
      return rr;
    },
  },
  { name: "single-ectopic", gen: (rng) => insertExtraBeat(cleanSeries(rng, 40, 12, 10), 150) },
  {
    name: "multiple-ectopics",
    gen: (rng) => {
      let rr = cleanSeries(rng, 40, 12, 10);
      for (const at of [60, 90, 130, 170, 210, 250, 290, 330]) {
        rr = insertExtraBeat(rr, at);
      }
      return rr;
    },
  },
  { name: "missed-detection", gen: (rng) => insertMissedDetection(cleanSeries(rng, 40, 12, 10), 150) },
  {
    name: "extra-detection",
    gen: (rng) => {
      const rr = cleanSeries(rng, 40, 12, 10);
      rr.splice(150, 2, 300, 900);
      return rr;
    },
  },
  {
    name: "short-signal-gap",
    gen: (rng) => {
      const rr = cleanSeries(rng, 40, 12, 10);
      rr[150] = 2500;
      return rr;
    },
  },
  {
    name: "borderline-poor",
    gen: (rng) => {
      let rr = cleanSeries(rng, 40, 12, 10);
      for (let k = 0; k < 22; k++) {
        rr = insertExtraBeat(rr, 40 + k * 15);
      }
      return rr;
    },
  },
];

function main(): void {
  const outDir = join(process.cwd(), "tests", "fixtures", "hrv-recordings");
  mkdirSync(outDir, { recursive: true });

  const options = {
    analysisDurationSeconds: 300,
    minAnalysedMs: 296_000,
    source: "bluetooth_rr" as const,
    preparationSeconds: 300,
    posture: "supine",
    deviceName: "Fixture sensor",
  };

  for (const { name, gen } of generators) {
    const rng = mulberry32(name.length * 7919 + 1337);
    const rr = gen(rng);
    const analysis = analyzeHrvRecording(rr, options);
    const expected = analysis.ok && analysis.metrics && analysis.correction
      ? {
          ok: true,
          metrics: analysis.metrics,
          quality: analysis.correction.quality,
          ectopicBeats: analysis.correction.ectopicBeats,
          correctedIntervals: analysis.correction.correctedIntervals,
          protocolCompatible: analysis.protocolCompatible,
        }
      : { ok: false, rejectionReason: analysis.rejectionReason };
    writeFileSync(
      join(outDir, `${name}.json`),
      JSON.stringify({ name, rr, expected }, null, 2) + "\n",
    );
    console.log(`generated ${name}: ${rr.length} beats, ok=${expected.ok}`);
  }
}

main();
