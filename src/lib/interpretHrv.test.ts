import { describe, it, expect } from "vitest";
import {
  interpretHrv,
  normalizeNumber,
  computeLfhfRatio,
  hasLfhfDiscrepancy,
  describeLfhf,
  findProhibitedPhrases,
} from "@/lib/interpretHrv";
import {
  getAgeBand,
  classifyPercentile,
  hrvReferenceData,
} from "@/data/hrvReferenceData";
import type { MeasurementInput, HrvInterpretation } from "@/lib/types";

const baseInput: MeasurementInput = {
  age: 40,
  referenceSex: "male",
  measurementSource: "ecg",
  durationMinutes: 5,
  position: "supine",
  rhythm: "sinus",
  artefactCorrection: "completed",
  rmssd: 30,
  sdnn: 35,
};

function allText(result: HrvInterpretation): string {
  const parts: string[] = [
    result.summary,
    result.overall,
    result.clinicalNote,
    result.safetyMessage,
    result.confidenceLabel,
    ...result.confidenceReasons,
    ...result.limitations,
  ];
  if (result.referenceNote) parts.push(result.referenceNote);
  if (result.lfhfWarning) parts.push(result.lfhfWarning);
  for (const m of result.metrics) {
    parts.push(m.name, m.categoryLabel ?? "", m.interpretation, m.limitation ?? "");
  }
  return parts.join(" ");
}

describe("normalizeNumber", () => {
  it("parses decimal points", () => {
    expect(normalizeNumber("30.4")).toBe(30.4);
  });
  it("parses decimal commas", () => {
    expect(normalizeNumber("30,40")).toBe(30.4);
  });
  it("returns null for empty strings", () => {
    expect(normalizeNumber("")).toBeNull();
    expect(normalizeNumber("   ")).toBeNull();
  });
  it("returns null for invalid input", () => {
    expect(normalizeNumber("abc")).toBeNull();
  });
  it("trims whitespace", () => {
    expect(normalizeNumber("  47,63 ")).toBe(47.63);
  });
});

describe("getAgeBand", () => {
  it("selects correct bands at boundaries", () => {
    expect(getAgeBand(18)).toBe("18-29");
    expect(getAgeBand(29)).toBe("18-29");
    expect(getAgeBand(30)).toBe("30-39");
    expect(getAgeBand(45)).toBe("40-49");
    expect(getAgeBand(59)).toBe("50-59");
    expect(getAgeBand(60)).toBe("60-72");
    expect(getAgeBand(72)).toBe("60-72");
  });
  it("returns null outside 18-72", () => {
    expect(getAgeBand(17)).toBeNull();
    expect(getAgeBand(73)).toBeNull();
    expect(getAgeBand(100)).toBeNull();
  });
});

describe("classifyPercentile", () => {
  const ref = hrvReferenceData.male["40-49"].rmssd; // [11.64, 19.92, 29.95, 43.84, 81.32]
  it("classifies below p5", () => {
    expect(classifyPercentile(10, ref)).toBe("below_p5");
  });
  it("value exactly at p5 is in the 5th-25th band", () => {
    expect(classifyPercentile(11.64, ref)).toBe("p5_to_p25");
  });
  it("value exactly at p25 is central", () => {
    expect(classifyPercentile(19.92, ref)).toBe("p25_to_p75");
  });
  it("value exactly at p75 is central", () => {
    expect(classifyPercentile(43.84, ref)).toBe("p25_to_p75");
  });
  it("value just above p75 is upper part", () => {
    expect(classifyPercentile(44, ref)).toBe("p75_to_p95");
  });
  it("value exactly at p95 is upper part", () => {
    expect(classifyPercentile(81.32, ref)).toBe("p75_to_p95");
  });
  it("value above p95 is unusually high", () => {
    expect(classifyPercentile(82, ref)).toBe("above_p95");
  });
});

describe("LF/HF calculation", () => {
  it("computes ratio from LF and HF", () => {
    expect(computeLfhfRatio(400, 200)).toBe(2);
  });
  it("returns null when HF is zero", () => {
    expect(computeLfhfRatio(400, 0)).toBeNull();
  });
  it("detects discrepancy above 10%", () => {
    expect(hasLfhfDiscrepancy(3, 400, 200)).toBe(true);
  });
  it("accepts values within 10%", () => {
    expect(hasLfhfDiscrepancy(2.1, 400, 200)).toBe(false);
  });
  it("auto-calculates LF/HF when LF and HF are entered without a ratio", () => {
    const result = interpretHrv({ ...baseInput, lfPower: 300, hfPower: 150 });
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf).toBeDefined();
    expect(lfhf!.value).toBe(2);
  });
  it("warns when entered ratio disagrees with LF/HF", () => {
    const result = interpretHrv({
      ...baseInput,
      lfPower: 300,
      hfPower: 150,
      lfhfRatio: 5,
    });
    expect(result.lfhfWarning).toBeDefined();
  });
  it("describes ratio categories", () => {
    expect(describeLfhf(0.3)).toBe("Relative HF predominance");
    expect(describeLfhf(1)).toBe("LF and HF are of broadly comparable magnitude");
    expect(describeLfhf(2.6)).toBe("Relative LF predominance");
    expect(describeLfhf(5)).toBe("Marked relative LF predominance");
  });
  it("always attaches the LF/HF caution", () => {
    const result = interpretHrv({ ...baseInput, lfhfRatio: 2.6 });
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf!.limitation).toContain(
      "not a direct measurement of sympathetic"
    );
  });
});

describe("recording confidence", () => {
  it("high confidence for protocol-matching ECG recording", () => {
    expect(interpretHrv(baseInput).confidence).toBe("high");
  });
  it("moderate confidence with one limitation", () => {
    const result = interpretHrv({ ...baseInput, position: "seated" });
    expect(result.confidence).toBe("moderate");
  });
  it("low confidence with several limitations", () => {
    const result = interpretHrv({
      ...baseInput,
      measurementSource: "smartwatch",
      position: "standing",
      artefactCorrection: "not_completed",
    });
    expect(result.confidence).toBe("low");
  });
  it("not valid for atrial fibrillation or flutter", () => {
    const result = interpretHrv({ ...baseInput, rhythm: "af_flutter" });
    expect(result.confidence).toBe("not-valid");
  });
  it("not valid for paced rhythm", () => {
    const result = interpretHrv({ ...baseInput, rhythm: "paced" });
    expect(result.confidence).toBe("not-valid");
  });
  it("not valid for frequent ectopic beats", () => {
    const result = interpretHrv({ ...baseInput, rhythm: "frequent_ectopy" });
    expect(result.confidence).toBe("not-valid");
  });
  it("suppresses percentile categories when not valid", () => {
    const result = interpretHrv({ ...baseInput, rhythm: "af_flutter" });
    const rmssd = result.metrics.find((m) => m.key === "rmssd");
    expect(rmssd!.category).toBeUndefined();
    expect(result.referenceAvailable).toBe(false);
  });
});

describe("reference availability", () => {
  it("no percentile when reference sex is not used", () => {
    const result = interpretHrv({ ...baseInput, referenceSex: "none" });
    const rmssd = result.metrics.find((m) => m.key === "rmssd");
    expect(rmssd!.category).toBeUndefined();
    expect(result.referenceAvailable).toBe(false);
  });
  it("no percentile above age 72, with explanation", () => {
    const result = interpretHrv({ ...baseInput, age: 80 });
    const rmssd = result.metrics.find((m) => m.key === "rmssd");
    expect(rmssd!.category).toBeUndefined();
    expect(result.referenceNote).toContain("above 72 years");
  });
  it("still provides percentile at age 72", () => {
    const result = interpretHrv({ ...baseInput, age: 72, rmssd: 17.02 });
    const rmssd = result.metrics.find((m) => m.key === "rmssd");
    expect(rmssd!.category).toBe("p25_to_p75");
  });
});

describe("combined interpretation patterns", () => {
  it("both below 25th percentile", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 15,
      sdnn: 20,
    });
    expect(result.overall).toContain(
      "lower than expected for the selected reference group"
    );
  });
  it("low RMSSD with preserved SDNN", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 15,
      sdnn: 40,
    });
    expect(result.overall).toContain("better preserved");
  });
  it("low SDNN with central RMSSD", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 15,
    });
    expect(result.overall).toContain(
      "without a corresponding reduction in RMSSD"
    );
  });
  it("both central includes the non-exclusion statement", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 34.04,
    });
    expect(result.overall).toContain("central 50%");
    expect(result.overall).toContain(
      "does not exclude autonomic dysfunction"
    );
  });
  it("above 95th percentile warns that higher is not automatically better", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 100,
      sdnn: 40,
    });
    expect(result.overall).toContain("unusually high");
    expect(result.overall).toContain("not automatically better");
  });
});

describe("seed example 1", () => {
  const example1: MeasurementInput = {
    age: 20,
    referenceSex: "female",
    measurementSource: "ecg",
    durationMinutes: 5,
    position: "supine",
    rhythm: "sinus",
    artefactCorrection: "completed",
    rmssd: 18,
    sdnn: 23,
    hfPower: 213,
    lfhfRatio: 2.6,
  };
  it("classifies RMSSD below the fifth percentile", () => {
    const result = interpretHrv(example1);
    expect(result.metrics.find((m) => m.key === "rmssd")!.category).toBe(
      "below_p5"
    );
  });
  it("classifies SDNN in the lower part of the distribution", () => {
    const result = interpretHrv(example1);
    expect(result.metrics.find((m) => m.key === "sdnn")!.category).toBe(
      "p5_to_p25"
    );
  });
  it("reports reduced short-term HRV", () => {
    const result = interpretHrv(example1);
    expect(result.overall).toContain("lower than expected");
  });
  it("describes relative LF predominance", () => {
    const result = interpretHrv(example1);
    expect(result.metrics.find((m) => m.key === "lfhf")!.interpretation).toContain(
      "Relative LF predominance"
    );
  });
  it("has high confidence", () => {
    expect(interpretHrv(example1).confidence).toBe("high");
  });
  it("states the finding cannot diagnose an autonomic condition", () => {
    const result = interpretHrv(example1);
    expect(result.summary).toContain("does not by itself diagnose");
  });
});

describe("seed example 2", () => {
  const example2: MeasurementInput = {
    age: 45,
    referenceSex: "male",
    measurementSource: "ecg",
    durationMinutes: 5,
    position: "supine",
    rhythm: "sinus",
    artefactCorrection: "completed",
    rmssd: 30.4,
    sdnn: 47.63,
    hfPower: 125.95,
    lfhfRatio: 3.28,
  };
  it("classifies RMSSD within the central range around the median", () => {
    const result = interpretHrv(example2);
    expect(result.metrics.find((m) => m.key === "rmssd")!.category).toBe(
      "p25_to_p75"
    );
  });
  it("classifies SDNN in the upper part of the distribution", () => {
    const result = interpretHrv(example2);
    expect(result.metrics.find((m) => m.key === "sdnn")!.category).toBe(
      "p75_to_p95"
    );
  });
  it("describes relative LF predominance", () => {
    const result = interpretHrv(example2);
    expect(result.metrics.find((m) => m.key === "lfhf")!.interpretation).toContain(
      "Relative LF predominance"
    );
  });
  it("does not conclude sympathetic overactivation", () => {
    const text = allText(interpretHrv(example2)).toLowerCase();
    expect(text).not.toContain("sympathetic overactivation");
    expect(text).not.toContain("sympathetic dominance");
    expect(text).not.toContain("sympathetic overactivity");
  });
  it("explains HF is influenced by breathing and spectral method", () => {
    const result = interpretHrv(example2);
    expect(result.metrics.find((m) => m.key === "hf")!.interpretation).toContain(
      "breathing"
    );
  });
  it("does not report generally reduced variability", () => {
    const result = interpretHrv(example2);
    expect(result.overall).toContain(
      "do not show generally reduced short-term variability"
    );
  });
});

describe("prohibited terminology", () => {
  const scenarios: MeasurementInput[] = [
    baseInput,
    { ...baseInput, rmssd: 5, sdnn: 8 },
    { ...baseInput, rmssd: 150, sdnn: 120 },
    { ...baseInput, rhythm: "af_flutter" },
    { ...baseInput, age: 85 },
    { ...baseInput, referenceSex: "none" },
    { ...baseInput, lfPower: 900, hfPower: 100, lfhfRatio: 9 },
    { ...baseInput, hfPower: 125.95, lfhfRatio: 3.28 },
    { ...baseInput, measurementSource: "smartwatch", position: "standing" },
    {
      age: 20,
      referenceSex: "female",
      measurementSource: "ecg",
      durationMinutes: 5,
      position: "supine",
      rhythm: "sinus",
      artefactCorrection: "completed",
      rmssd: 18,
      sdnn: 23,
      hfPower: 213,
      lfhfRatio: 2.6,
    },
  ];

  it("no interpretation contains prohibited phrases", () => {
    for (const scenario of scenarios) {
      const text = allText(interpretHrv(scenario));
      const found = findProhibitedPhrases(text);
      expect(found, `Prohibited phrases found: ${found.join(", ")}`).toEqual(
        []
      );
    }
  });

  it("never uses normal/abnormal or good/bad labels in metric categories", () => {
    for (const scenario of scenarios) {
      const result = interpretHrv(scenario);
      for (const m of result.metrics) {
        const label = (m.categoryLabel ?? "").toLowerCase();
        expect(label).not.toContain("normal");
        expect(label).not.toContain("abnormal");
        expect(label).not.toContain("good");
        expect(label).not.toContain("bad");
        expect(label).not.toContain("healthy");
      }
    }
  });
});
