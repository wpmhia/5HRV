import { describe, it, expect } from "vitest";
import {
  interpretHrv,
  normalizeNumber,
  computeLfhfRatio,
  describeLfhf,
  describeLfhfByBand,
  deriveLfhfPattern,
  findProhibitedPhrases,
  deriveHrvFindings,
  renderMetricDescriptions,
  renderAnalysis,
  estimatePercentile,
  interpolateLogPercentile,
  percentileToZ,
  assessReferenceCompatibility,
} from "@/lib/interpretHrv";
import type {
  MeasurementInput,
  HrvInterpretation,
} from "@/lib/types";
import {
  getAgeBand,
  classifyPercentile,
  hrvReferenceData,
} from "@/data/hrvReferenceData";

const baseInput: MeasurementInput = {
  age: 40,
  referenceSex: "male",
  rmssd: 30,
  sdnn: 35,
  recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
};

function allText(result: HrvInterpretation): string {
  const parts: string[] = [
    result.summary,
    result.overall,
    result.clinicalNote,
    result.safetyMessage,
    ...result.limitations,
  ];
  if (result.referenceNote) parts.push(result.referenceNote);
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
  const ref = hrvReferenceData.male["40-49"].rmssd;
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

describe("estimatePercentile", () => {
  const ref = hrvReferenceData.female["30-39"].rmssd;
  it("returns estimated percentile for SDNN 39.33 (female 30-39)", () => {
    const sdnnRef = hrvReferenceData.female["30-39"].sdnn;
    const pct = estimatePercentile(39.33, sdnnRef);
    expect(Math.round(pct!)).toBe(45);
  });
  it("returns estimated percentile for RMSSD 23.14 (female 30-39)", () => {
    const pct = estimatePercentile(23.14, ref);
    expect(Math.round(pct!)).toBe(15);
  });
  it("returns null for array with wrong length", () => {
    expect(estimatePercentile(30, [1, 2, 3])).toBeNull();
  });
  it("clamps to 0 at very low values", () => {
    expect(estimatePercentile(0, [20, 40, 60, 80, 100])).toBe(0);
  });
  it("returns 100 at extreme high values", () => {
    expect(estimatePercentile(999, [20, 40, 60, 80, 100])).toBe(100);
  });
});

describe("interpolateLogPercentile", () => {
  it("clamps to 5-95 range", () => {
    const ref = hrvReferenceData.female["30-39"].lfhf;
    const below = interpolateLogPercentile(0.01, ref as readonly [number, number, number, number, number]);
    const above = interpolateLogPercentile(100, ref as readonly [number, number, number, number, number]);
    expect(below).toBeGreaterThanOrEqual(5);
    expect(above).toBeLessThanOrEqual(95);
  });
  it("a ratio of zero stays within the 5-95 clamp", () => {
    const ref = hrvReferenceData.female["30-39"].lfhf;
    const pct = interpolateLogPercentile(0, ref as readonly [number, number, number, number, number]);
    expect(pct).toBeGreaterThanOrEqual(5);
    expect(pct).toBeLessThanOrEqual(95);
  });
  it("returns intermediate value within published anchors", () => {
    const ref = hrvReferenceData.male["40-49"].lfhf;
    const pct = interpolateLogPercentile(2.0, ref as readonly [number, number, number, number, number]);
    expect(pct).toBeGreaterThanOrEqual(25);
    expect(pct).toBeLessThanOrEqual(75);
  });
});

describe("percentileToZ", () => {
  it("returns 0 at 50th percentile", () => {
    expect(percentileToZ(50)).toBeCloseTo(0, 1);
  });
  it("returns positive above 50, negative below", () => {
    expect(percentileToZ(95)).toBeGreaterThan(0);
    expect(percentileToZ(5)).toBeLessThan(0);
  });
  it("is symmetric around 50", () => {
    expect(percentileToZ(5) + percentileToZ(95)).toBeCloseTo(0, 1);
  });
});

describe("deriveLfhfPattern", () => {
  it("returns relative_hf_predominance below 0.5", () => {
    expect(deriveLfhfPattern(0.3)).toBe("relative_hf_predominance");
  });
  it("returns comparable_lf_hf between 0.5 and 2.0", () => {
    expect(deriveLfhfPattern(1)).toBe("comparable_lf_hf");
    expect(deriveLfhfPattern(2)).toBe("comparable_lf_hf");
  });
  it("returns relative_lf_predominance between 2.0 and 4.0", () => {
    expect(deriveLfhfPattern(3)).toBe("relative_lf_predominance");
  });
  it("returns marked_lf_predominance above 4.0", () => {
    expect(deriveLfhfPattern(5)).toBe("marked_lf_predominance");
  });
});

describe("LF/HF calculation", () => {
  it("computes ratio from LF and HF", () => {
    expect(computeLfhfRatio(400, 200)).toBe(2);
  });
  it("returns null when HF is zero", () => {
    expect(computeLfhfRatio(400, 0)).toBeNull();
  });
  it("auto-calculates LF/HF when LF and HF are entered without a ratio", () => {
    const result = interpretHrv({ ...baseInput, lfPower: 300, hfPower: 150 });
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf).toBeDefined();
    expect(lfhf!.value).toBe(2);
  });
  it("reported LF/HF includes source in metric and produces a profile score", () => {
    const result = interpretHrv({
      ...baseInput, rmssd: 14.53, sdnn: 34.19, pnn50: 0.21,
      lfhfRatio: 9.49, lfhfSource: "manual",
    });
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf).toBeDefined();
    expect(lfhf!.lfhfSource).toBe("manual");
    expect(lfhf!.interpretation).toContain("Entered ratio.");
    expect(result.autonomicProfile).toBeDefined();
    expect(result.autonomicProfile!.score).toBeGreaterThan(0);
  });
  it("reported-only LF/HF produces analysis paragraph with frequency domain LF/HF only", () => {
    const result = interpretHrv({
      ...baseInput, rmssd: 14.53, sdnn: 34.19, pnn50: 0.21,
      lfhfRatio: 9.49, lfhfSource: "manual",
    });
    expect(result.overall).toContain("LF/HF ratio of 9.49");
  });
  it("calculated LF/HF takes priority over reported ratio", () => {
    const result = interpretHrv({
      ...baseInput, lfPower: 300, hfPower: 150, lfhfRatio: 9.49,
    });
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf).toBeDefined();
    expect(lfhf!.value).toBe(2);
    expect(lfhf!.lfhfSource).toBe("calculated");
    expect(lfhf!.interpretation).toContain("Calculated from LF and HF.");
  });
  it("uses calculated LF/HF when LF and HF are present, ignoring reported ratio", () => {
    const result = interpretHrv({
      ...baseInput,
      lfPower: 300,
      hfPower: 150,
      lfhfRatio: 5,
    });
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf).toBeDefined();
    expect(lfhf!.value).toBe(2);
    expect(lfhf!.lfhfSource).toBe("calculated");
  });
  it("uses reported LF/HF when LF and HF are absent", () => {
    const result = interpretHrv({ ...baseInput, lfhfRatio: 3.5 });
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf).toBeDefined();
    expect(lfhf!.value).toBe(3.5);
    expect(lfhf!.lfhfSource).toBe("imported");
  });
  it("omits LF/HF when neither LF/HF nor ratio is available", () => {
    const result = interpretHrv(baseInput);
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf).toBeUndefined();
  });
  it("describes ratio categories", () => {
    expect(describeLfhf(0.3)).toBe("Relative HF predominance");
    expect(describeLfhf(1)).toBe("LF and HF are of broadly comparable magnitude");
    expect(describeLfhf(2.6)).toBe("Relative LF predominance");
    expect(describeLfhf(5)).toBe("Marked relative LF predominance");
  });

  it("describes LF/HF by percentile band", () => {
    expect(describeLfhfByBand("below_p5")).toBe("Very low relative to the reference population, indicating marked HF predominance.");
    expect(describeLfhfByBand("p5_to_p25")).toBe("Low relative to the reference population, indicating HF predominance.");
    expect(describeLfhfByBand("p25_to_p75")).toBe("Within the typical range for the reference population.");
    expect(describeLfhfByBand("p75_to_p95")).toBe("High relative to the reference population, consistent with LF predominance.");
    expect(describeLfhfByBand("above_p95")).toBe("Very high relative to the reference population, indicating marked LF predominance.");
    expect(describeLfhfByBand("unclassified")).toBeNull();
  });
  it("always attaches the LF/HF caution to limitation", () => {
    const result = interpretHrv({ ...baseInput, lfhfRatio: 2.6 });
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf!.limitation).toContain(
      "not a direct measurement of sympathetic"
    );
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
  it("keeps percentiles for an imported report regardless of duration metadata", () => {
    const result = interpretHrv({
      ...baseInput,
      recording: { durationSeconds: 353 },
    });
    const rmssd = result.metrics.find((m) => m.key === "rmssd");
    expect(rmssd!.category).toBeDefined();
    expect(result.referenceAvailable).toBe(true);
    expect(result.referenceNote).toBeUndefined();
  });
  it("no percentile when the bluetooth rest period was skipped", () => {
    const result = interpretHrv({
      ...baseInput,
      recording: {
        source: "bluetooth_rr",
        durationSeconds: 300,
        preparationSeconds: 0,
        posture: "supine",
      },
    });
    expect(result.referenceAvailable).toBe(false);
    expect(result.autonomicProfile).toBeUndefined();
    expect(result.overall).toContain("descriptively");
  });
});

describe("assessReferenceCompatibility", () => {
  it("uses age/sex reference for manual calculator input without recording metadata", () => {
    expect(assessReferenceCompatibility()).toEqual({
      compatible: true,
      reference: "danfund",
      reasons: [],
    });
    const result = interpretHrv({
      age: 33,
      referenceSex: "female",
      rmssd: 69.67,
      sdnn: 72.54,
      pnn50: 49.76,
      lfhfRatio: 0.84,
      lfhfSource: "manual",
    });
    expect(result.referenceAvailable).toBe(true);
    expect(result.findings.rmssd.band).toBe("p75_to_p95");
    expect(result.findings.sdnn.band).toBe("p75_to_p95");
  });
  it("accepts a five-minute recording", () => {
    expect(assessReferenceCompatibility({ durationSeconds: 300 })).toEqual({
      compatible: true,
      reference: "danfund",
      reasons: [],
    });
  });
  it("does not apply the acquisition gate to imported report metadata", () => {
    const result = assessReferenceCompatibility({ durationSeconds: 353 });
    expect(result.compatible).toBe(true);
    expect(result.reference).toBe("danfund");
    expect(result.reasons).toEqual([]);
  });
  it("does not apply the acquisition gate to manual duration metadata", () => {
    expect(assessReferenceCompatibility({ durationSeconds: 120 }).compatible).toBe(true);
  });
  it("accepts a full-protocol bluetooth recording", () => {
    expect(
      assessReferenceCompatibility({
        source: "bluetooth_rr",
        durationSeconds: 300,
        preparationSeconds: 300,
        posture: "supine",
      }).compatible,
    ).toBe(true);
  });
  it("rejects a Polar H10 recording outside the five-minute window", () => {
    expect(assessReferenceCompatibility({
      source: "bluetooth_rr",
      durationSeconds: 353,
      preparationSeconds: 300,
      posture: "supine",
    }).compatible).toBe(false);
  });
  it("rejects a bluetooth recording with a shortened rest period", () => {
    const result = assessReferenceCompatibility({
      source: "bluetooth_rr",
      durationSeconds: 300,
      preparationSeconds: 45,
      posture: "supine",
    });
    expect(result.compatible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/supine rest/i);
  });
  it("rejects a bluetooth recording in a non-supine position", () => {
    const result = assessReferenceCompatibility({
      source: "bluetooth_rr",
      durationSeconds: 300,
      preparationSeconds: 300,
      posture: "seated",
    });
    expect(result.compatible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/supine/i);
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
    expect(result.overall).toContain("reduced");
  });
  it("low RMSSD with preserved SDNN", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 15,
      sdnn: 40,
    });
    expect(result.overall).toContain("reduced parasympathetic");
    expect(result.overall).toContain("preserved");
  });
  it("low SDNN with central RMSSD", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 15,
    });
    expect(result.overall).toContain("preserved");
    expect(result.overall).toContain("reduced");
  });
});

describe("missing metrics", () => {
  it("RMSSD only: parasympathetic claim without a variability claim", () => {
    const result = interpretHrv({ age: 33, referenceSex: "female", rmssd: 40, recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" } });
    expect(result.overall).toContain("parasympathetic activity");
    expect(result.overall).not.toContain("overall variability");
  });
  it("SDNN only: variability claim without a parasympathetic claim", () => {
    const result = interpretHrv({ age: 45, referenceSex: "male", sdnn: 30, recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" } });
    expect(result.overall).toContain("overall variability");
    expect(result.overall).not.toContain("parasympathetic activity");
  });
  it("RMSSD and LF/HF without SDNN: no variability claim", () => {
    const result = interpretHrv({ age: 25, referenceSex: "female", rmssd: 40, lfhfRatio: 1.5, lfhfSource: "manual", recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" } });
    expect(result.overall).not.toContain("overall variability");
    expect(result.overall).toContain("parasympathetic activity");
  });
});

describe("deriveHrvFindings", () => {
  it("classifies patient example correctly via autonomic profile", () => {
    const input: MeasurementInput = {
      age: 33,
      referenceSex: "female",
      rmssd: 23.14,
      sdnn: 39.33,
      pnn50: 3.28,
      hfPower: 70.55,
      lfPower: 416.47,
      recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
    };
    const f = deriveHrvFindings(input);
    expect(f.rmssd.band).toBe("p5_to_p25");
    expect(f.sdnn.band).toBe("p25_to_p75");
    expect(f.frequencyDomain.lfhfRatio).toBeCloseTo(5.9, 1);
    expect(f.frequencyDomain.pattern).toBe("marked_lf_predominance");
    expect(f.autonomicProfile).toBeDefined();
    expect(f.autonomicProfile!.score).toBeGreaterThanOrEqual(50);
    expect(f.autonomicProfile!.score).toBeLessThan(60);
    expect(f.autonomicProfile!.label).toBe("Marked sympathetic-direction shift");
  });

  it("estimates percentiles for RMSSD and SDNN", () => {
    const input: MeasurementInput = {
      age: 33,
      referenceSex: "female",
      rmssd: 23.14,
      sdnn: 39.33,
      recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
    };
    const f = deriveHrvFindings(input);
    expect(Math.round(f.rmssd.estimatedPercentile!)).toBe(15);
    expect(Math.round(f.sdnn.estimatedPercentile!)).toBe(45);
  });

  it("profile score uses floating-point internal percentiles", () => {
    const input: MeasurementInput = {
      age: 33,
      referenceSex: "female",
      rmssd: 23.14,
      lfhfRatio: 5.9,
      recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
    };
    const f = deriveHrvFindings(input);
    expect(f.autonomicProfile).toBeDefined();
    expect(f.autonomicProfile!.vagal.deviationZ).toBeDefined();
    expect(f.autonomicProfile!.spectral.deviationZ).toBeDefined();
  });
});

describe("seed example 1", () => {
  const example1: MeasurementInput = {
    age: 20,
    referenceSex: "female",
    rmssd: 18,
    sdnn: 23,
    hfPower: 213,
    lfhfRatio: 2.6,
    recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
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
  it("reports reduced HRV with autonomic profile", () => {
    const result = interpretHrv(example1);
    expect(result.autonomicProfile).toBeDefined();
    expect(result.overall).toContain("reduced parasympathetic");
    expect(result.overall).toContain("reduced");
  });
  it("describes relative LF predominance", () => {
    const result = interpretHrv(example1);
    expect(result.metrics.find((m) => m.key === "lfhf")!.interpretation).toContain(
      "High relative to the reference population, consistent with LF predominance."
    );
  });
  it("conclusion is concise without diagnostic disclaimer", () => {
    const result = interpretHrv(example1);
    expect(result.summary).not.toContain("nonspecific");
    expect(result.summary).not.toContain("does not by itself diagnose");
  });
});

describe("seed example 2", () => {
  const example2: MeasurementInput = {
    age: 45,
    referenceSex: "male",
    rmssd: 30.4,
    sdnn: 47.63,
    hfPower: 125.95,
    lfhfRatio: 3.28,
    recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
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
      "Within the typical range for the reference population."
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
  it("reports preserved parasympathetic activity and high overall HRV with profile", () => {
    const result = interpretHrv(example2);
    expect(result.autonomicProfile).toBeDefined();
    expect(result.overall).toContain("preserved");
    expect(result.overall).toContain("within");
  });
});

describe("renderAnalysis", () => {
  it("renders for the patient example", () => {
    const input: MeasurementInput = {
      age: 33,
      referenceSex: "female",
      rmssd: 23.14,
      sdnn: 39.33,
      pnn50: 3.28,
      hfPower: 70.55,
      lfPower: 416.47,
      recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).toContain("SDNN 39.33");
    expect(text).toContain("RMSSD 23.14");
    expect(text).toContain("LF/HF");
    expect(text).toContain("5.9");
    expect(text).toContain("Serial measurements");
  });

  it("empty metrics returns empty-ish string (no crash)", () => {
    const input: MeasurementInput = { age: 40, referenceSex: "none" };
    const findings = deriveHrvFindings(input);
    expect(() => renderAnalysis(findings)).not.toThrow();
  });

  it("reduced RMSSD -> reduced parasympathetic activity", () => {
    const input: MeasurementInput = {
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 15,
      sdnn: 35,
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).toContain("reduced");
  });

  it("preserved RMSSD with pNN50 -- parasympathetic still preserved (RMSSD is primary)", () => {
    const input: MeasurementInput = {
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 35,
      pnn50: 0.5,
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).toContain("preserved");
  });

  it("preserved RMSSD with HF -- parasympathetic still preserved (RMSSD is primary)", () => {
    const input: MeasurementInput = {
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 35,
      hfPower: 30,
      lfPower: 400,
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).toContain("preserved");
  });

  it("RMSSD absent -> no RMSSD statement", () => {
    const input: MeasurementInput = {
      age: 40,
      referenceSex: "male",
      sdnn: 35,
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).not.toContain("RMSSD");
  });

  it("includes autonomic score direction when available", () => {
    const input: MeasurementInput = {
      ...baseInput, lfhfRatio: 2.0,
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).toContain("central autonomic pattern");
  });

  it("uses elevated for high-band SDNN and RMSSD", () => {
    const input: MeasurementInput = {
      age: 45,
      referenceSex: "female",
      rmssd: 81.53,
      sdnn: 67.27,
      lfhfRatio: 1.06,
      lfhfSource: "manual",
      recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).toContain("elevated overall variability");
    expect(text).toContain("marked parasympathetic-direction shift");
  });

  it("avoids redundant parasympathetic phrase next to parasympathetic-direction shift", () => {
    const input: MeasurementInput = {
      age: 45,
      referenceSex: "female",
      rmssd: 81.53,
      sdnn: 67.27,
      lfhfRatio: 1.06,
      lfhfSource: "manual",
      recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).toContain("elevated overall variability");
    expect(text).not.toContain("elevated parasympathetic activity");
    expect(text).not.toContain("preserved parasympathetic activity");
  });

  it("builds from autonomic profile when score is available over LF/HF", () => {
    const input: MeasurementInput = {
      ...baseInput, lfhfRatio: 9.49, rmssd: 14.53,
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).toContain("Serial measurements");
  });

  it("omits chronic stress sentence for preserved patterns", () => {
    const input: MeasurementInput = {
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 35,
    };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).not.toMatch(/chronic physiological stress/i);
  });

  it("always includes serial measurements sentence", () => {
    const input: MeasurementInput = { age: 40, referenceSex: "none", rmssd: 30, sdnn: 35 };
    const findings = deriveHrvFindings(input);
    const text = renderAnalysis(findings);
    expect(text).toContain("Serial measurements");
  });
});

describe("renderMetricDescriptions", () => {
  it("includes all metrics present", () => {
    const input: MeasurementInput = {
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 35,
      pnn50: 5,
      hfPower: 200,
      lfPower: 400,
      lfhfRatio: 2,
    };
    const findings = deriveHrvFindings(input);
    const metrics = renderMetricDescriptions(findings);
    expect(metrics.find((m) => m.key === "sdnn")).toBeDefined();
    expect(metrics.find((m) => m.key === "rmssd")).toBeDefined();
    expect(metrics.find((m) => m.key === "pnn50")).toBeDefined();
    expect(metrics.find((m) => m.key === "hf")).toBeDefined();
    expect(metrics.find((m) => m.key === "lf")).toBeDefined();
    expect(metrics.find((m) => m.key === "lfhf")).toBeDefined();
  });

  it("handles only frequency-domain metrics", () => {
    const input: MeasurementInput = {
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 35,
      hfPower: 200,
      lfPower: 400,
      lfhfRatio: 2,
    };
    const findings = deriveHrvFindings(input);
    const metrics = renderMetricDescriptions(findings);
    expect(metrics.find((m) => m.key === "hf")).toBeDefined();
    expect(metrics.find((m) => m.key === "lf")).toBeDefined();
    expect(metrics.find((m) => m.key === "pnn50")).toBeUndefined();
  });

  it("handles only time-domain metrics", () => {
    const input: MeasurementInput = {
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 35,
    };
    const findings = deriveHrvFindings(input);
    const metrics = renderMetricDescriptions(findings);
    expect(metrics.find((m) => m.key === "rmssd")).toBeDefined();
    expect(metrics.find((m) => m.key === "sdnn")).toBeDefined();
    expect(metrics.find((m) => m.key === "hf")).toBeUndefined();
    expect(metrics.find((m) => m.key === "lf")).toBeUndefined();
  });
});

describe("prohibited terminology", () => {
  const scenarios: MeasurementInput[] = [
    baseInput,
    { ...baseInput, rmssd: 5, sdnn: 8 },
    { ...baseInput, rmssd: 150, sdnn: 120 },
    { ...baseInput, age: 85 },
    { ...baseInput, referenceSex: "none" },
    { ...baseInput, lfPower: 900, hfPower: 100, lfhfRatio: 9 },
    { ...baseInput, hfPower: 125.95, lfhfRatio: 3.28 },
    {
      age: 20,
      referenceSex: "female",
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

describe("patient regression fixture", () => {
  const patientFixture: MeasurementInput = {
    age: 33,
    referenceSex: "female",
    rmssd: 23.14,
    sdnn: 39.33,
    pnn50: 3.28,
    hfPower: 70.55,
    lfPower: 416.47,
    recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
  };

  it("classifies bands correctly", () => {
    const f = deriveHrvFindings(patientFixture);
    expect(f.rmssd.band).toBe("p5_to_p25");
    expect(f.sdnn.band).toBe("p25_to_p75");
  });

  it("estimates rounded percentiles for display", () => {
    const f = deriveHrvFindings(patientFixture);
    expect(Math.round(f.rmssd.estimatedPercentile!)).toBe(15);
    expect(Math.round(f.sdnn.estimatedPercentile!)).toBe(45);
  });

  it("frequency domain pattern is marked LF predominance", () => {
    const f = deriveHrvFindings(patientFixture);
    expect(f.frequencyDomain.lfhfRatio).toBeCloseTo(5.9, 1);
    expect(f.frequencyDomain.pattern).toBe("marked_lf_predominance");
  });

  it("computes continuous autonomic profile score", () => {
    const result = interpretHrv(patientFixture);
    expect(result.autonomicProfile).toBeDefined();
    expect(result.autonomicProfile!.score).toBeGreaterThanOrEqual(50);
    expect(result.autonomicProfile!.score).toBeLessThan(60);
    expect(result.autonomicProfile!.label).toBe("Marked sympathetic-direction shift");
  });

  it("profile vagal and spectral components are defined", () => {
    const result = interpretHrv(patientFixture);
    expect(result.autonomicProfile).toBeDefined();
    expect(result.autonomicProfile!.vagal.deviationZ).toBeGreaterThan(0);
    expect(result.autonomicProfile!.spectral.deviationZ).toBeGreaterThan(0);
  });

  it("labels contain percentile range", () => {
    const result = interpretHrv(patientFixture);
    const rmssdLabel = result.metrics.find((m) => m.key === "rmssd")!.categoryLabel;
    const sdnnLabel = result.metrics.find((m) => m.key === "sdnn")!.categoryLabel;
    expect(rmssdLabel).toContain("P5");
    expect(sdnnLabel).toContain("P25");
  });

  it("every LF/HF result has its limitation", () => {
    const result = interpretHrv(patientFixture);
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf).toBeDefined();
    expect(lfhf!.limitation).toBeDefined();
  });

  it("summary mentions reduced parasympathetic activity (low RMSSD)", () => {
    const result = interpretHrv(patientFixture);
    expect(result.overall).toMatch(/reduced/i);
  });

  it("summary mentions preserved total variability (typical SDNN)", () => {
    const result = interpretHrv(patientFixture);
    expect(result.overall).toMatch(/preserved/i);
  });

  it("RMSSD in P5-P25 for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    expect(result.findings.rmssd.band).toBe("p5_to_p25");
  });

  it("SDNN in P25-P75 for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    expect(result.findings.sdnn.band).toBe("p25_to_p75");
  });

  it("LF/HF category is above_p95 for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    const cat = result.findings.autonomicProfile?.spectral.category;
    expect(cat).toBe("above_p95");
  });

  it("reduced vagal modulation for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    expect(result.findings.rmssd.vagalStatus).toBe("reduced");
  });

  it("marked relative LF predominance for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf?.interpretation).toContain("Very high relative to the reference population, indicating marked LF predominance.");
  });

  it("concordant sympathetic-direction shift for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    expect(result.findings.autonomicProfile?.concordance).toBe("concordant_sympathetic_shift");
  });
});

describe("continuous percentile estimation", () => {
  const maleRef = hrvReferenceData.male["30-39"].rmssd;
  const p25 = maleRef[1];

  it("profile score changes continuously across RMSSD P25", () => {
    const input: MeasurementInput = { age: 35, referenceSex: "male", sdnn: 40, lfhfRatio: 1.5, recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" } };
    const below = interpretHrv({ ...input, rmssd: p25 - 0.01 });
    const above = interpretHrv({ ...input, rmssd: p25 + 0.01 });
    expect(
      Math.abs(
        below.autonomicProfile!.score -
        above.autonomicProfile!.score
      )
    ).toBeLessThanOrEqual(2);
  });

  it("P25 - epsilon and P25 + epsilon must not differ by 25 score points", () => {
    const pctBelow = estimatePercentile(p25 - 0.01, maleRef)!;
    const pctAbove = estimatePercentile(p25 + 0.01, maleRef)!;
    expect(Math.abs(pctBelow - pctAbove)).toBeLessThan(25);
  });
});

describe("age/sex normalisation", () => {
  it("the same LF/HF value must produce different spectral percentiles when reference distributions differ", () => {
    const sameRatio = 1.6;
    const male18 = hrvReferenceData.male["18-29"].lfhf;
    const female18 = hrvReferenceData.female["18-29"].lfhf;
    const pctMale = interpolateLogPercentile(sameRatio, male18 as readonly [number, number, number, number, number]);
    const pctFemale = interpolateLogPercentile(sameRatio, female18 as readonly [number, number, number, number, number]);
    expect(pctMale).not.toBe(pctFemale);
  });
});

describe("concordance", () => {
  it("single-axis direction keeps its label for low-magnitude scores", () => {
    const result = interpretHrv({
      age: 45,
      referenceSex: "male",
      rmssd: 50,
      sdnn: 35,
      lfhfRatio: 3,
      lfhfSource: "manual",
      recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
    });
    expect(result.autonomicProfile?.concordance).toBe("single_axis_parasympathetic_shift");
    expect(result.autonomicProfile?.label).toBe("Mild parasympathetic-direction shift");
    expect(result.overall).not.toContain("mixed");
  });

  function makeInput(overrides: Partial<MeasurementInput>): MeasurementInput {
    return {
      age: 40,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 35,
      lfhfRatio: 1.5,
      recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
      ...overrides,
    };
  }

  it("low RMSSD + high LF/HF => concordant sympathetic-direction shift", () => {
    const result = interpretHrv(makeInput({ rmssd: 4, lfhfRatio: 15 }));
    expect(result.findings.autonomicProfile?.concordance).toBe("concordant_sympathetic_shift");
  });

  it("high RMSSD + low LF/HF => concordant parasympathetic-direction shift", () => {
    const result = interpretHrv(makeInput({ rmssd: 150, lfhfRatio: 0.1 }));
    expect(result.findings.autonomicProfile?.concordance).toBe("concordant_parasympathetic_shift");
  });

  it("low RMSSD + low LF/HF => mixed", () => {
    const result = interpretHrv(makeInput({ rmssd: 4, lfhfRatio: 0.1 }));
    expect(result.findings.autonomicProfile?.concordance).toBe("mixed");
  });

  it("high RMSSD + high LF/HF => mixed", () => {
    const result = interpretHrv(makeInput({ rmssd: 150, lfhfRatio: 15 }));
    expect(result.findings.autonomicProfile?.concordance).toBe("mixed");
  });

  it("both axes central => central", () => {
    const result = interpretHrv(makeInput({ rmssd: 35, lfhfRatio: 2.0 }));
    expect(result.findings.autonomicProfile?.concordance).toBe("central");
  });

  it("opposing extreme components must never produce label 'Central' or 'Balanced'", () => {
    const result = interpretHrv(makeInput({ rmssd: 4, lfhfRatio: 15 }));
    const label = result.autonomicProfile?.label ?? "";
    expect(label).not.toMatch(/central|balanced/i);
  });
});

describe("no misleading cancellation", () => {
  it("very low RMSSD + very high LF/HF labels as sympathetic shift, never central", () => {
    const result = interpretHrv({
      age: 40,
      referenceSex: "male",
      rmssd: 3,
      sdnn: 35,
      lfhfRatio: 20,
      recording: { durationSeconds: 300, preparationSeconds: 300, posture: "supine" },
    });
    expect(result.findings.autonomicProfile?.concordance).not.toBe("central");
    expect(result.findings.autonomicProfile?.concordance).toBe("concordant_sympathetic_shift");
  });
});

describe("DanFunD reference data validation (Table 3)", () => {
  it("male 18-29 lfhf matches published Table 3", () => {
    const arr = hrvReferenceData.male["18-29"].lfhf;
    expect(arr[0]).toBe(0.34);
    expect(arr[1]).toBe(0.79);
    expect(arr[2]).toBe(1.32);
    expect(arr[3]).toBe(2.37);
    expect(arr[4]).toBe(6.16);
  });
  it("male 40-49 lfhf matches published Table 3", () => {
    const arr = hrvReferenceData.male["40-49"].lfhf;
    expect(arr[0]).toBe(0.47);
    expect(arr[1]).toBe(1.15);
    expect(arr[2]).toBe(2.11);
    expect(arr[3]).toBe(3.99);
    expect(arr[4]).toBe(10.35);
  });
  it("female 30-39 lfhf matches published Table 3", () => {
    const arr = hrvReferenceData.female["30-39"].lfhf;
    expect(arr[0]).toBe(0.25);
    expect(arr[1]).toBe(0.46);
    expect(arr[2]).toBe(0.90);
    expect(arr[3]).toBe(1.88);
    expect(arr[4]).toBe(5.41);
  });
  it("female 50-59 lfhf matches published Table 3", () => {
    const arr = hrvReferenceData.female["50-59"].lfhf;
    expect(arr[0]).toBe(0.30);
    expect(arr[1]).toBe(0.80);
    expect(arr[2]).toBe(1.51);
    expect(arr[3]).toBe(2.90);
    expect(arr[4]).toBe(8.06);
  });
  it("male 60-72 lfhf matches published Table 3", () => {
    const arr = hrvReferenceData.male["60-72"].lfhf;
    expect(arr[0]).toBe(0.41);
    expect(arr[1]).toBe(1.14);
    expect(arr[2]).toBe(2.31);
    expect(arr[3]).toBe(4.47);
    expect(arr[4]).toBe(10.32);
  });
  it("female 60-72 lfhf matches published Table 3", () => {
    const arr = hrvReferenceData.female["60-72"].lfhf;
    expect(arr[0]).toBe(0.34);
    expect(arr[1]).toBe(0.85);
    expect(arr[2]).toBe(1.79);
    expect(arr[3]).toBe(3.10);
    expect(arr[4]).toBe(7.01);
  });
});
