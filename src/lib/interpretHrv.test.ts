import { describe, it, expect } from "vitest";
import {
  interpretHrv,
  normalizeNumber,
  computeLfhfRatio,
  hasLfhfDiscrepancy,
  describeLfhf,
  findProhibitedPhrases,
  buildClinicalParagraph,
} from "@/lib/interpretHrv";
import type { MetricResult, AutonomicScore } from "@/lib/types";
import {
  getAgeBand,
  classifyPercentile,
  hrvReferenceData,
} from "@/data/hrvReferenceData";
import type { MeasurementInput, HrvInterpretation } from "@/lib/types";

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
    const paragraph = buildClinicalParagraph(result.metrics, result.autonomicScore);
    expect(paragraph).toContain("LF/HF 9.49");
    expect(paragraph).not.toContain(" HF ");
    expect(paragraph).not.toContain(" LF ");
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
    expect(result.overall).toContain("are reduced");
  });
  it("low RMSSD with preserved SDNN", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 15,
      sdnn: 40,
    });
    expect(result.overall).toContain(
      "Parasympathetic activity is reduced, while overall short-term HRV is preserved"
    );
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
      "Parasympathetic activity is preserved, but overall short-term HRV is reduced"
    );
  });
  it("both central", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 30,
      sdnn: 34.04,
    });
    expect(result.overall).toContain("within the expected range");
  });
  it("RMSSD above 95th percentile with central SDNN", () => {
    const result = interpretHrv({
      ...baseInput,
      age: 45,
      referenceSex: "male",
      rmssd: 100,
      sdnn: 40,
    });
    expect(result.overall).toContain(
      "Parasympathetic activity is high and overall short-term HRV is preserved"
    );
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
    expect(result.overall).toContain("reduced parasympathetic activity");
    expect(result.overall).toContain("reduced overall HRV");
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
    expect(result.overall).toContain("preserved parasympathetic activity");
    expect(result.overall).toContain("high overall HRV");
  });
});

describe("buildClinicalParagraph", () => {
  const baseRmssd: MetricResult = {
    key: "rmssd", name: "RMSSD", value: 30, unit: "ms",
    category: "p25_to_p75", categoryLabel: "Typical",
    referencePercentiles: [10, 20, 40, 60, 80],
    interpretation: "Parasympathetic activity is preserved.",
  };
  const baseSdnn: MetricResult = {
    key: "sdnn", name: "SDNN", value: 35, unit: "ms",
    category: "p25_to_p75", categoryLabel: "Typical",
    referencePercentiles: [15, 25, 45, 65, 85],
    interpretation: "Overall short-term HRV is within the expected range.",
  };
  const basePnn50: MetricResult = {
    key: "pnn50", name: "pNN50", value: 5, unit: "%",
    interpretation: "A vagal-related measure.",
  };
  const baseHf: MetricResult = {
    key: "hf", name: "HF power", value: 200, unit: "ms²",
    interpretation: "Respiratory-frequency variability.",
  };
  const baseLf: MetricResult = {
    key: "lf", name: "LF power", value: 400, unit: "ms²",
    interpretation: "Mixed autonomic and baroreflex-related influences.",
  };
  const baseLfhf: MetricResult = {
    key: "lfhf", name: "LF/HF ratio", value: 2, unit: "",
    interpretation: "LF and HF are of broadly comparable magnitude.",
  };

  it("empty metrics returns empty string", () => {
    expect(buildClinicalParagraph([])).toBe("");
  });

  it("reduced RMSSD → reduced parasympathetic activity", () => {
    const rmssd: MetricResult = {
      ...baseRmssd, value: 15, category: "p5_to_p25", categoryLabel: "Low",
    };
    const result = buildClinicalParagraph([rmssd, baseSdnn]);
    expect(result).toContain("reduced parasympathetic activity");
    expect(result).not.toContain("mixed parasympathetic");
  });

  it("reduced RMSSD with pNN50 → still reduced parasympathetic (RMSSD is primary)", () => {
    const rmssd: MetricResult = {
      ...baseRmssd, value: 15, category: "p5_to_p25", categoryLabel: "Low",
    };
    const pnn50: MetricResult = { ...basePnn50, value: 0.5 };
    const result = buildClinicalParagraph([rmssd, baseSdnn, pnn50]);
    expect(result).toContain("reduced parasympathetic activity");
  });

  it("preserved RMSSD with pNN50 — parasympathetic still preserved (RMSSD is primary)", () => {
    const pnn50: MetricResult = { ...basePnn50, value: 0.5 };
    const result = buildClinicalParagraph([baseRmssd, baseSdnn, pnn50]);
    expect(result).toContain("preserved parasympathetic activity");
    expect(result).not.toContain("reduced parasympathetic activity");
  });

  it("preserved RMSSD with HF — parasympathetic still preserved (RMSSD is primary)", () => {
    const hf: MetricResult = { ...baseHf, value: 30 };
    const result = buildClinicalParagraph([baseRmssd, baseSdnn, hf]);
    expect(result).toContain("preserved parasympathetic activity");
  });

  it("preserved RMSSD with pNN50 and HF — preserved parasympathetic", () => {
    const result = buildClinicalParagraph([baseRmssd, baseSdnn, basePnn50, baseHf]);
    expect(result).toContain("preserved parasympathetic activity");
  });

  it("RMSSD absent → no parasympathetic statement at all", () => {
    const result = buildClinicalParagraph([baseSdnn]);
    expect(result).not.toContain("parasympathetic");
    expect(result).toContain("preserved total variability");
  });

  it("RMSSD present but unclassified → could not be classified", () => {
    const rmssd: MetricResult = {
      ...baseRmssd, category: undefined, categoryLabel: undefined,
    };
    const sdnn: MetricResult = {
      ...baseSdnn, category: undefined, categoryLabel: undefined,
    };
    const result = buildClinicalParagraph([rmssd, sdnn]);
    expect(result).toContain("could not be classified");
  });

  it("includes autonomic score direction when available", () => {
    const result = buildClinicalParagraph(
      [baseRmssd, baseSdnn, baseLfhf],
      { value: 10, label: "Balanced or mixed pattern" }
    );
    expect(result).toContain("balanced or mixed autonomic pattern");
  });

  it("builds from autonomic score when score is available over LF/HF", () => {
    const result = buildClinicalParagraph(
      [baseRmssd, baseSdnn, baseLfhf],
      { value: 60, label: "Mild sympathetic shift" }
    );
    expect(result).toContain("marked sympathetic predominance");
  });

  it("uses LF/HF direction when no autonomic score", () => {
    const lfhf: MetricResult = { ...baseLfhf, value: 3.5 };
    const result = buildClinicalParagraph([baseRmssd, baseSdnn, lfhf]);
    expect(result).toContain("relative LF predominance");
  });

  it("appends chronic stress sentence for abnormal patterns", () => {
    const rmssd: MetricResult = {
      ...baseRmssd, value: 15, category: "p5_to_p25", categoryLabel: "Low",
    };
    const result = buildClinicalParagraph([rmssd, baseSdnn]);
    expect(result).toMatch(/chronic physiological stress/i);
  });

  it("omits chronic stress sentence for preserved patterns", () => {
    const result = buildClinicalParagraph([baseRmssd, baseSdnn]);
    expect(result).not.toMatch(/chronic physiological stress/i);
  });

  it("includes preface with all metrics present", () => {
    const result = buildClinicalParagraph([
      baseRmssd, baseSdnn, basePnn50, baseHf, baseLf, baseLfhf,
    ]);
    expect(result).toContain("Time domain:");
    expect(result).toContain("frequency domain:");
    expect(result).toContain("SDNN 35 ms");
    expect(result).toContain("RMSSD 30 ms");
    expect(result).toContain("pNN50 5%");
    expect(result).toContain("HF 200 ms²");
    expect(result).toContain("LF 400 ms²");
    expect(result).toContain("LF/HF 2");
  });

  it("handles only frequency-domain metrics", () => {
    const result = buildClinicalParagraph([baseHf, baseLf, baseLfhf]);
    expect(result).toContain("frequency domain:");
    expect(result).not.toContain("Time domain:");
  });

  it("handles only time-domain metrics", () => {
    const result = buildClinicalParagraph([baseRmssd, baseSdnn]);
    expect(result).toContain("Time domain:");
    expect(result).not.toContain("frequency domain:");
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
