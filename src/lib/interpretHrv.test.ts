import { describe, it, expect } from "vitest";
import {
  interpretHrv,
  normalizeNumber,
  computeLfhfRatio,
  hasLfhfDiscrepancy,
  describeLfhf,
  deriveLfhfPattern,
  findProhibitedPhrases,
  deriveHrvFindings,
  renderMetricDescriptions,
  renderClinicalSummary,
  estimatePercentile,
  estimatePercentileLog,
} from "@/lib/interpretHrv";
import type {
  MeasurementInput,
  HrvInterpretation,
  HrvFindings,
} from "@/lib/types";
import {
  getAgeBand,
  classifyPercentile,
  hrvReferenceData,
  percentileLabels,
} from "@/data/hrvReferenceData";

const baseInput: MeasurementInput = {
  age: 40,
  referenceSex: "male",
  rmssd: 30,
  sdnn: 35,
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
    expect(pct).toBe(45);
  });
  it("returns estimated percentile for RMSSD 23.14 (female 30-39)", () => {
    const pct = estimatePercentile(23.14, ref);
    expect(pct).toBe(15);
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
  it("reported LF/HF includes source in metric and is used for Autonomic Score", () => {
    const result = interpretHrv({
      ...baseInput, rmssd: 14.53, sdnn: 34.19, pnn50: 0.21,
      lfhfRatio: 9.49, lfhfSource: "manual",
    });
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf).toBeDefined();
    expect(lfhf!.lfhfSource).toBe("manual");
    expect(lfhf!.interpretation).toContain("Entered ratio.");
    expect(result.autonomicScore).toBeDefined();
    expect(result.autonomicScore!.value).toBeGreaterThan(0);
  });
  it("reported-only LF/HF produces clinical paragraph with frequency domain LF/HF only", () => {
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

describe("deriveHrvFindings", () => {
  it("classifies patient example correctly", () => {
    const input: MeasurementInput = {
      age: 33,
      referenceSex: "female",
      rmssd: 23.14,
      sdnn: 39.33,
      pnn50: 3.28,
      hfPower: 70.55,
      lfPower: 416.47,
    };
    const f = deriveHrvFindings(input);
    expect(f.rmssd.band).toBe("p5_to_p25");
    expect(f.sdnn.band).toBe("p25_to_p75");
    expect(f.frequencyDomain.lfhfRatio).toBeCloseTo(5.9, 1);
    expect(f.frequencyDomain.pattern).toBe("marked_lf_predominance");
    expect(f.autonomicScore?.value).toBe(58);
    expect(f.autonomicScore?.label).toBe("Marked sympathetic-direction shift");
  });

  it("estimates percentiles", () => {
    const input: MeasurementInput = {
      age: 33,
      referenceSex: "female",
      rmssd: 23.14,
      sdnn: 39.33,
    };
    const f = deriveHrvFindings(input);
    expect(f.rmssd.estimatedPercentile).toBe(15);
    expect(f.sdnn.estimatedPercentile).toBe(45);
  });

  it("returns rmssdComponent and lfhfComponent in score", () => {
    const input: MeasurementInput = {
      age: 33,
      referenceSex: "female",
      rmssd: 23.14,
      lfhfRatio: 5.9,
    };
    const f = deriveHrvFindings(input);
    expect(f.autonomicScore).toBeDefined();
    expect(f.autonomicScore!.rmssdComponent).toBe(25);
    expect(f.autonomicScore!.lfhfComponent).toBeCloseTo(32.5, 1);
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
  it("reports reduced HRV with autonomic score", () => {
    const result = interpretHrv(example1);
    expect(result.autonomicScore).toBeDefined();
    expect(result.overall).toContain("reduced parasympathetic");
    expect(result.overall).toContain("reduced");
  });
  it("describes relative LF predominance", () => {
    const result = interpretHrv(example1);
    expect(result.metrics.find((m) => m.key === "lfhf")!.interpretation).toContain(
      "Relative LF predominance"
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
  it("reports preserved parasympathetic activity and high overall HRV with autonomic score", () => {
    const result = interpretHrv(example2);
    expect(result.autonomicScore).toBeDefined();
    expect(result.overall).toContain("preserved");
    expect(result.overall).toContain("within");
  });
});

describe("renderClinicalSummary", () => {
  it("renders for the patient example", () => {
    const input: MeasurementInput = {
      age: 33,
      referenceSex: "female",
      rmssd: 23.14,
      sdnn: 39.33,
      pnn50: 3.28,
      hfPower: 70.55,
      lfPower: 416.47,
    };
    const findings = deriveHrvFindings(input);
    const text = renderClinicalSummary(findings);
    expect(text).toContain("SDNN 39.33");
    expect(text).toContain("RMSSD 23.14");
    expect(text).toContain("LF/HF");
    expect(text).toContain("5.9");
    expect(text).toContain("Serial measurements");
  });

  it("empty metrics returns empty-ish string (no crash)", () => {
    const input: MeasurementInput = { age: 40, referenceSex: "none" };
    const findings = deriveHrvFindings(input);
    expect(() => renderClinicalSummary(findings)).not.toThrow();
  });

  it("reduced RMSSD → reduced parasympathetic activity", () => {
    const input: MeasurementInput = {
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 15,
      sdnn: 35,
    };
    const findings = deriveHrvFindings(input);
    const text = renderClinicalSummary(findings);
    expect(text).toContain("reduced");
  });

  it("preserved RMSSD with pNN50 — parasympathetic still preserved (RMSSD is primary)", () => {
    const input: MeasurementInput = {
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 35,
      pnn50: 0.5,
    };
    const findings = deriveHrvFindings(input);
    const text = renderClinicalSummary(findings);
    expect(text).toContain("preserved");
  });

  it("preserved RMSSD with HF — parasympathetic still preserved (RMSSD is primary)", () => {
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
    const text = renderClinicalSummary(findings);
    expect(text).toContain("preserved");
  });

  it("RMSSD absent → no RMSSD statement", () => {
    const input: MeasurementInput = {
      age: 40,
      referenceSex: "male",
      sdnn: 35,
    };
    const findings = deriveHrvFindings(input);
    const text = renderClinicalSummary(findings);
    expect(text).not.toContain("RMSSD");
  });

  it("includes autonomic score direction when available", () => {
    const input: MeasurementInput = {
      ...baseInput, lfhfRatio: 2.0,
    };
    const findings = deriveHrvFindings(input);
    const text = renderClinicalSummary(findings);
    expect(text).toContain("central autonomic pattern");
  });

  it("builds from autonomic score when score is available over LF/HF", () => {
    const input: MeasurementInput = {
      ...baseInput, lfhfRatio: 9.49, rmssd: 14.53,
    };
    const findings = deriveHrvFindings(input);
    const text = renderClinicalSummary(findings);
    // Score will be high (marked sympathetic predominance)
    expect(text).toContain("Serial measurements");
  });

  it("appends chronic stress sentence for abnormal patterns", () => {
    const input: MeasurementInput = {
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 15,
      sdnn: 35,
    };
    const findings = deriveHrvFindings(input);
    const text = renderClinicalSummary(findings);
    expect(text).toMatch(/chronic physiological stress/i);
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
    const text = renderClinicalSummary(findings);
    expect(text).not.toMatch(/chronic physiological stress/i);
  });

  it("always includes serial measurements sentence", () => {
    const input: MeasurementInput = { age: 40, referenceSex: "none", rmssd: 30, sdnn: 35 };
    const findings = deriveHrvFindings(input);
    const text = renderClinicalSummary(findings);
    expect(text).toContain("Serial measurements");
  });
});

describe("renderMetricDescriptions", () => {
  it("includes preface with all metrics present", () => {
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
  };

  it("classifies bands correctly", () => {
    const f = deriveHrvFindings(patientFixture);
    expect(f.rmssd.band).toBe("p5_to_p25");
    expect(f.sdnn.band).toBe("p25_to_p75");
  });

  it("estimates percentiles", () => {
    const f = deriveHrvFindings(patientFixture);
    expect(f.rmssd.estimatedPercentile).toBe(15);
    expect(f.sdnn.estimatedPercentile).toBe(45);
  });

  it("frequency domain pattern is marked LF predominance", () => {
    const f = deriveHrvFindings(patientFixture);
    expect(f.frequencyDomain.lfhfRatio).toBeCloseTo(5.9, 1);
    expect(f.frequencyDomain.pattern).toBe("marked_lf_predominance");
  });

  it("computes autonomic score with percentile-based RMSSD component", () => {
    const result = interpretHrv(patientFixture);
    expect(result.autonomicScore).toBeDefined();
    // RMSSD 23.14 is p5_to_p25 for women 30-39 → component = 25
    expect(result.autonomicScore!.rmssdComponent).toBe(25);
    // LF/HF = 416.47/70.55 ≈ 5.90 → lfhfComponent = clamp((5.90-2)/6)*50 ≈ 32.53
    expect(result.autonomicScore!.lfhfComponent).toBeCloseTo(32.53, 1);
    // Total = round(25 + 32.53) = 58 → "Marked sympathetic predominance"
    expect(result.autonomicScore!.value).toBe(58);
    expect(result.autonomicScore!.label).toBe("Marked sympathetic-direction shift");
  });

  it("score components are exposed", () => {
    const result = interpretHrv(patientFixture);
    expect(result.autonomicScore).toBeDefined();
    expect(result.autonomicScore!.rmssdComponent).toBe(25);
    expect(result.autonomicScore!.lfhfComponent).toBeCloseTo(32.53, 1);
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

  it("LF/HF above P95 for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    const lfhfPct = result.findings.autonomicProfile?.spectral.percentile;
    expect(lfhfPct).toBeGreaterThanOrEqual(95);
  });

  it("reduced vagal modulation for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    expect(result.findings.rmssd.vagalStatus).toBe("reduced");
  });

  it("marked relative LF predominance for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    const lfhf = result.metrics.find((m) => m.key === "lfhf");
    expect(lfhf?.interpretation).toContain("Marked relative LF predominance");
  });

  it("concordant sympathetic-direction shift for the patient fixture", () => {
    const result = interpretHrv(patientFixture);
    expect(result.findings.autonomicProfile?.concordance).toBe("concordant_sympathetic_shift");
  });
});

describe("continuous percentile estimation", () => {
  const maleRef = hrvReferenceData.male["30-39"].rmssd;
  const p25 = maleRef[1];
  const epsilon = 0.01;

  it("P25 - epsilon and P25 + epsilon must not differ by 25 score points", () => {
    const pctBelow = estimatePercentile(p25 - epsilon, maleRef)!;
    const pctAbove = estimatePercentile(p25 + epsilon, maleRef)!;
    expect(Math.abs(pctBelow - pctAbove)).toBeLessThan(25);
  });
});

describe("age/sex normalisation", () => {
  it("the same LF/HF value must produce different spectral percentiles when reference distributions differ", () => {
    const sameRatio = 1.6;
    const male18 = hrvReferenceData.male["18-29"].lfhf;
    const female18 = hrvReferenceData.female["18-29"].lfhf;
    const pctMale = estimatePercentileLog(sameRatio, male18 as readonly [number, number, number, number, number])!;
    const pctFemale = estimatePercentileLog(sameRatio, female18 as readonly [number, number, number, number, number])!;
    expect(pctMale).not.toBe(pctFemale);
  });
});

describe("concordance", () => {
  function makeInput(overrides: Partial<MeasurementInput>): MeasurementInput {
    return {
      age: 40,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 35,
      lfhfRatio: 1.5,
      ...overrides,
    };
  }

  it("low RMSSD + high LF/HF => concordant sympathetic-direction shift", () => {
    const result = interpretHrv(makeInput({ rmssd: 6, lfhfRatio: 9 }));
    expect(result.findings.autonomicProfile?.concordance).toBe("concordant_sympathetic_shift");
  });

  it("high RMSSD + low LF/HF => concordant parasympathetic-direction shift", () => {
    const result = interpretHrv(makeInput({ rmssd: 120, lfhfRatio: 0.2 }));
    expect(result.findings.autonomicProfile?.concordance).toBe("concordant_parasympathetic_shift");
  });

  it("low RMSSD + low LF/HF => mixed", () => {
    const result = interpretHrv(makeInput({ rmssd: 6, lfhfRatio: 0.2 }));
    expect(result.findings.autonomicProfile?.concordance).toBe("mixed");
  });

  it("high RMSSD + high LF/HF => mixed", () => {
    const result = interpretHrv(makeInput({ rmssd: 120, lfhfRatio: 9 }));
    expect(result.findings.autonomicProfile?.concordance).toBe("mixed");
  });

  it("opposing extreme components must never produce label 'Central' or 'Balanced'", () => {
    const result = interpretHrv(makeInput({ rmssd: 6, lfhfRatio: 9 }));
    const label = result.autonomicScore?.label ?? "";
    expect(label).not.toMatch(/central|balanced/i);
  });
});

describe("no misleading cancellation", () => {
  it("very low RMSSD + very high LF/HF still labels as mixed or sympathetic, never central", () => {
    const result = interpretHrv({
      age: 40,
      referenceSex: "male",
      rmssd: 5,
      sdnn: 35,
      lfhfRatio: 12,
    });
    expect(result.findings.autonomicProfile?.concordance).not.toBe("central");
    expect(result.findings.autonomicProfile?.concordance).toBe("concordant_sympathetic_shift");
  });
});
