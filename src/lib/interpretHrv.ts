import {
  hrvReferenceData,
  getAgeBand,
  classifyPercentile,
  percentileLabels,
  percentileExplanations,
} from "@/data/hrvReferenceData";
import type {
  MeasurementInput,
  HrvInterpretation,
  MetricResult,
  PercentileCategory,
  AutonomicScore,
  LfhfSource,
} from "@/lib/types";

export function normalizeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function computeLfhfRatio(lfPower: number, hfPower: number): number | null {
  if (hfPower <= 0) return null;
  return lfPower / hfPower;
}

export function hasLfhfDiscrepancy(
  enteredRatio: number,
  lfPower: number,
  hfPower: number
): boolean {
  const calculated = computeLfhfRatio(lfPower, hfPower);
  if (calculated === null || calculated === 0) return false;
  return Math.abs(enteredRatio - calculated) / calculated > 0.1;
}

const LFHF_CAUTION =
  "LF/HF is not a direct measurement of sympathetic\u2013parasympathetic balance.";

export function describeLfhf(ratio: number): string {
  if (ratio < 0.5) return "Relative HF predominance";
  if (ratio <= 2.0) return "LF and HF are of broadly comparable magnitude";
  if (ratio <= 4.0) return "Relative LF predominance";
  return "Marked relative LF predominance";
}

const CLINICAL_NOTE =
  "HRV results should be interpreted together with symptoms, examination findings, rhythm assessment and other clinical information.";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateAutonomicScore(
  rmssd?: number,
  lfhfRatio?: number
): AutonomicScore | undefined {
  if (rmssd === undefined || lfhfRatio === undefined) return undefined;

  const vagalComponent =
    rmssd < 20
      ? clamp((20 - rmssd) / 20, 0, 1) * 50
      : rmssd > 50
        ? -clamp((rmssd - 50) / 50, 0, 1) * 50
        : 0;

  const sympatheticComponent =
    lfhfRatio > 2
      ? clamp((lfhfRatio - 2) / 6, 0, 1) * 50
      : lfhfRatio < 1
        ? -clamp(1 - lfhfRatio, 0, 1) * 50
        : 0;

  const value = Math.round(clamp(vagalComponent + sympatheticComponent, -100, 100));

  const label =
    value <= -25
      ? "Parasympathetic predominance"
      : value < 25
        ? "Balanced or mixed pattern"
        : value < 50
          ? "Mild sympathetic shift"
          : value < 75
            ? "Marked sympathetic predominance"
            : "Pronounced sympathetic predominance";

  return { value, label };
}

function rmssdDesc(category: PercentileCategory): string {
  if (category === "below_p5") return "Parasympathetic activity is markedly reduced.";
  if (category === "p5_to_p25") return "Parasympathetic activity is reduced.";
  if (category === "p25_to_p75") return "Parasympathetic activity is preserved.";
  if (category === "p75_to_p95") return "Parasympathetic activity is high.";
  return "Parasympathetic activity is very high.";
}

function sdnnDesc(category: PercentileCategory): string {
  if (category === "below_p5") return "Overall short-term HRV is markedly reduced.";
  if (category === "p5_to_p25") return "Overall short-term HRV is reduced.";
  if (category === "p25_to_p75") return "Overall short-term HRV is within the expected range.";
  if (category === "p75_to_p95") return "Overall short-term HRV is high.";
  return "Overall short-term HRV is very high.";
}

function buildConclusion(
  rmssdCategory: PercentileCategory | undefined,
  sdnnCategory: PercentileCategory | undefined,
  autonomicScore?: AutonomicScore
): string {
  const rmssdLow = rmssdCategory === "below_p5" || rmssdCategory === "p5_to_p25";
  const sdnnLow = sdnnCategory === "below_p5" || sdnnCategory === "p5_to_p25";
  const rmssdTypical = rmssdCategory === "p25_to_p75";
  const sdnnTypical = sdnnCategory === "p25_to_p75";
  const rmssdHigh = rmssdCategory === "p75_to_p95" || rmssdCategory === "above_p95";
  const sdnnHigh = sdnnCategory === "p75_to_p95" || sdnnCategory === "above_p95";

  if (autonomicScore) {
    let prefix: string;
    if (autonomicScore.value <= -25) prefix = "Vagal-predominant autonomic pattern";
    else if (autonomicScore.value < 25) prefix = "Balanced autonomic pattern";
    else if (autonomicScore.value < 50) prefix = "Mild sympathetic shift";
    else if (autonomicScore.value < 75) prefix = "Marked sympathicotonic pattern";
    else prefix = "Pronounced sympathicotonic pattern";

    const parts: string[] = [];
    if (rmssdCategory) {
      parts.push(rmssdLow ? "reduced parasympathetic activity" : "preserved parasympathetic activity");
    }
    if (sdnnCategory) {
      if (sdnnLow) parts.push("reduced overall HRV");
      else if (sdnnHigh) parts.push("high overall HRV");
      else parts.push("preserved overall HRV");
    }
    if (parts.length > 0) prefix += ` with ${parts.join(" and ")}`;
    return prefix + ".";
  }

  if (rmssdCategory && sdnnCategory) {
    if (rmssdLow && sdnnLow) return "Parasympathetic activity and overall short-term HRV are reduced.";
    if (rmssdLow) return `Parasympathetic activity is reduced, while overall short-term HRV ${sdnnLow ? "is" : sdnnHigh ? "is high" : "is preserved"}.`;
    if (sdnnLow) return `Parasympathetic activity ${rmssdLow ? "is" : rmssdHigh ? "is high" : "is preserved"}, but overall short-term HRV is reduced.`;
    if (rmssdTypical && sdnnTypical) return "Parasympathetic activity and overall short-term HRV are within the expected range.";
    if (rmssdTypical && sdnnHigh) return "Parasympathetic activity is preserved and overall short-term HRV is high. There is no pattern of reduced HRV.";
    if (rmssdHigh && sdnnHigh) return "Parasympathetic activity and overall short-term HRV are high.";
    return `Parasympathetic activity ${rmssdHigh ? "is high" : "is preserved"} and overall short-term HRV ${sdnnHigh ? "is high" : "is preserved"}.`;
  }

  if (rmssdCategory) {
    if (rmssdLow) return "Parasympathetic activity is reduced.";
    if (rmssdTypical) return "Parasympathetic activity is within the expected range.";
    return "Parasympathetic activity is high.";
  }

  if (sdnnCategory) {
    if (sdnnLow) return "Overall short-term HRV is reduced.";
    if (sdnnTypical) return "Overall short-term HRV is within the expected range.";
    return "Overall short-term HRV is high.";
  }

  return "";
}

export function buildClinicalParagraph(
  metrics: MetricResult[],
  autonomicScore?: AutonomicScore
): string {
  const byKey = new Map(metrics.map((m) => [m.key, m]));
  const sdnn = byKey.get("sdnn");
  const rmssd = byKey.get("rmssd");
  const pnn50 = byKey.get("pnn50");
  const hf = byKey.get("hf");
  const lf = byKey.get("lf");
  const lfhf = byKey.get("lfhf");

  const tdValues: string[] = [];
  if (sdnn) tdValues.push(`SDNN ${sdnn.value} ms`);
  if (rmssd) tdValues.push(`RMSSD ${rmssd.value} ms`);
  if (pnn50) tdValues.push(`pNN50 ${pnn50.value}%`);

  const fdValues: string[] = [];
  if (hf) fdValues.push(`HF ${hf.value} ms\u00B2`);
  if (lf) fdValues.push(`LF ${lf.value} ms\u00B2`);
  if (lfhf) fdValues.push(`LF/HF ${lfhf.value}`);

  let preface = "";
  if (tdValues.length > 0) preface += `Time domain: ${tdValues.join(", ")}`;
  if (fdValues.length > 0) {
    if (preface) preface += "; ";
    preface += `frequency domain: ${fdValues.join(", ")}`;
  }
  if (!preface) return "";

  const sdnnCat = sdnn?.category;
  const rmssdCat = rmssd?.category;
  const rmssdLow = rmssdCat === "below_p5" || rmssdCat === "p5_to_p25";
  const pnn50Low = pnn50 !== undefined && pnn50.value < 1;
  const hfLow = hf !== undefined && hf.value < 50;
  const parasympConflict = rmssd !== undefined && !rmssdLow && (pnn50Low || hfLow);

  const overallVar =
    !sdnn
      ? undefined
      : !sdnnCat
        ? "total variability could not be classified"
        : sdnnCat === "below_p5" || sdnnCat === "p5_to_p25"
          ? "reduced total variability"
          : "preserved total variability";

  const parasymp =
    !rmssd
      ? undefined
      : !rmssdCat
        ? "parasympathetic activity could not be classified"
        : rmssdLow
          ? "reduced parasympathetic activity"
          : parasympConflict
            ? "mixed parasympathetic findings"
            : "preserved parasympathetic activity";

  let sympDir: string | undefined;
  if (autonomicScore) {
    if (autonomicScore.value <= -25) sympDir = "parasympathetic predominance";
    else if (autonomicScore.value < 25) sympDir = "balanced autonomic activity";
    else if (autonomicScore.value < 50) sympDir = "mild sympathetic shift";
    else if (autonomicScore.value < 75) sympDir = "marked sympathetic predominance";
    else sympDir = "pronounced sympathetic predominance";
  } else if (lfhf) {
    const ratio = lfhf.value;
    if (ratio < 1) sympDir = "relative parasympathetic predominance";
    else if (ratio <= 2) sympDir = "balanced autonomic activity";
    else if (ratio <= 4) sympDir = "relative sympathetic predominance";
    else sympDir = "marked sympathetic predominance";
  }

  const findings: string[] = [];
  if (overallVar) findings.push(overallVar);
  if (parasymp) findings.push(parasymp);
  if (sympDir) findings.push(sympDir);

  if (findings.length === 0) return preface + ".";

  const patternText =
    findings.length === 1
      ? findings[0]
      : findings.length === 2
        ? `${findings[0]} and ${findings[1]}`
        : `${findings[0]} with ${findings.slice(1, -1).join(", ")}${findings.length > 3 ? "," : ""} and ${findings[findings.length - 1]}`;

  let text = `${preface}. The pattern shows ${patternText}.`;

  const isAbnormal =
    (sdnnCat === "below_p5" || sdnnCat === "p5_to_p25") ||
    rmssdLow ||
    parasympConflict ||
    (sympDir !== undefined && (sympDir.includes("sympathetic") || sympDir.includes("parasympathetic predominance")));

  if (isAbnormal) {
    text += " This pattern may indicate chronic physiological stress or autonomic imbalance in the appropriate clinical context.";
  }

  return text;
}

export function interpretHrv(input: MeasurementInput): HrvInterpretation {
  const ageBand = getAgeBand(input.age);
  const referenceAvailable =
    input.referenceSex !== "none" && ageBand !== null;

  let referenceNote: string | undefined;
  if (input.age > 72) {
    referenceNote =
      "No matching age-specific reference percentile is available above 72 years. The values can still be described, but they cannot be placed accurately within this reference distribution.";
  } else if (input.referenceSex === "none") {
    referenceNote =
      "No sex-specific reference distribution was selected. The values are described without reference-percentile placement.";
  }

  let rmssdCategory: PercentileCategory | undefined;
  let sdnnCategory: PercentileCategory | undefined;
  let rmssdPercentiles: readonly number[] | undefined;
  let sdnnPercentiles: readonly number[] | undefined;

  if (referenceAvailable && ageBand) {
    const ref =
      hrvReferenceData[input.referenceSex as "male" | "female"][ageBand];
    rmssdPercentiles = ref.rmssd;
    sdnnPercentiles = ref.sdnn;
    if (input.rmssd !== undefined) {
      rmssdCategory = classifyPercentile(input.rmssd, rmssdPercentiles);
    }
    if (input.sdnn !== undefined) {
      sdnnCategory = classifyPercentile(input.sdnn, sdnnPercentiles);
    }
  }

  const metrics: MetricResult[] = [];

  if (input.rmssd !== undefined) {
    metrics.push({
      key: "rmssd",
      name: "RMSSD",
      value: input.rmssd,
      unit: "ms",
      category: rmssdCategory,
      categoryLabel: rmssdCategory
        ? percentileLabels[rmssdCategory]
        : undefined,
      referencePercentiles: rmssdPercentiles
        ? [...rmssdPercentiles]
        : undefined,
      interpretation: rmssdCategory
        ? rmssdDesc(rmssdCategory)
        : "Short-term beat-to-beat variability strongly influenced by cardiac vagal modulation.",
    });
  }

  if (input.sdnn !== undefined) {
    metrics.push({
      key: "sdnn",
      name: "SDNN",
      value: input.sdnn,
      unit: "ms",
      category: sdnnCategory,
      categoryLabel: sdnnCategory ? percentileLabels[sdnnCategory] : undefined,
      referencePercentiles: sdnnPercentiles
        ? [...sdnnPercentiles]
        : undefined,
      interpretation: sdnnCategory
        ? sdnnDesc(sdnnCategory)
        : "SDNN reflects overall variability during this five-minute recording.",
    });
  }

  if (input.pnn50 !== undefined) {
    metrics.push({
      key: "pnn50",
      name: "pNN50",
      value: input.pnn50,
      unit: "%",
      interpretation:
        "A vagal-related measure of successive NN-interval variation.",
      limitation:
        "No validated age- and sex-specific percentile dataset is implemented for pNN50, so no reference category is assigned.",
    });
  }

  if (input.hfPower !== undefined) {
    metrics.push({
      key: "hf",
      name: "HF power",
      value: input.hfPower,
      unit: "ms\u00B2",
      interpretation:
        "Respiratory-frequency variability influenced by cardiac vagal modulation and breathing.",
      limitation:
        "No universal reference range is applied to HF power; values depend strongly on breathing and analysis settings.",
    });
  }

  if (input.lfPower !== undefined) {
    metrics.push({
      key: "lf",
      name: "LF power",
      value: input.lfPower,
      unit: "ms\u00B2",
      interpretation:
        "LF power reflects mixed autonomic and baroreflex-related influences.",
      limitation:
        "LF power does not directly measure sympathetic activity and must not be interpreted as a pure sympathetic marker.",
    });
  }

  let ratio: number | undefined;
  let lfhfSource: LfhfSource | undefined;
  if (
    input.lfPower !== undefined &&
    input.hfPower !== undefined &&
    input.hfPower > 0
  ) {
    ratio = input.lfPower / input.hfPower;
    lfhfSource = "calculated";
  } else if (input.lfhfRatio !== undefined) {
    ratio = input.lfhfRatio;
    lfhfSource = input.lfhfSource ?? "imported";
  }

  if (ratio !== undefined) {
    const sourceText =
      lfhfSource === "calculated"
        ? " Calculated from LF and HF."
        : lfhfSource === "manual"
          ? " Entered ratio."
          : " Reported ratio from the uploaded analysis.";
    metrics.push({
      key: "lfhf",
      name: "LF/HF ratio",
      value: Math.round(ratio * 100) / 100,
      unit: "",
      lfhfSource,
      interpretation: describeLfhf(ratio) + "." + sourceText,
      limitation: LFHF_CAUTION,
    });
  }

  const autonomicScore = calculateAutonomicScore(input.rmssd, ratio);

  const conclusion = referenceAvailable
    ? buildConclusion(rmssdCategory, sdnnCategory, autonomicScore)
    : "The entered values cannot be placed within an age- and sex-specific reference distribution. Interpret the values descriptively and together with the clinical context.";

  return {
    summary: conclusion,
    metrics,
    overall: conclusion,
    limitations: [],
    clinicalNote: CLINICAL_NOTE,
    referenceAvailable,
    referenceNote,
    safetyMessage: "",
    autonomicScore,
  };
}

export const prohibitedPhrases = [
  "diagnosed with",
  "you have POTS",
  "sympathetic dominance",
  "parasympathetic failure",
  "treatment should",
  "start medication",
  "normal autonomic nervous system",
  "sympathetic overactivity",
  "sympathovagal balance",
  "good HRV",
  "bad HRV",
  "excellent HRV",
  "autonomic age",
  "nervous system score",
  "stress score",
  "sympathetic score",
  "recovery score",
  "readiness score",
];

export function findProhibitedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return prohibitedPhrases.filter((phrase) =>
    lower.includes(phrase.toLowerCase())
  );
}
