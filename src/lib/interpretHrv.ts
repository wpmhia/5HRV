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

const SAFETY_MESSAGE =
  "Seek medical assessment for concerning symptoms such as syncope, chest pain, severe breathlessness, a sustained irregular heartbeat or new neurological symptoms. HRV interpretation must not delay urgent care.";

const STANDING_LIMITATIONS = [
  "Age",
  "Heart rate",
  "Breathing pattern",
  "Body position",
  "Time of day",
  "Acute illness",
  "Medication",
  "Recent physical activity",
  "Sleep",
  "Alcohol",
  "Caffeine",
  "Nicotine",
  "Recording artefacts",
  "Ectopic beats",
  "Recording device and analysis method",
];

function combinedPattern(
  rmssdCategory: PercentileCategory | undefined,
  sdnnCategory: PercentileCategory | undefined
): string {
  const rmssdLow =
    rmssdCategory === "below_p5" || rmssdCategory === "p5_to_p25";
  const sdnnLow =
    sdnnCategory === "below_p5" || sdnnCategory === "p5_to_p25";
  const rmssdCentral = rmssdCategory === "p25_to_p75";
  const sdnnCentral = sdnnCategory === "p25_to_p75";
  const anyAboveP95 =
    rmssdCategory === "above_p95" || sdnnCategory === "above_p95";

  if (anyAboveP95) {
    return "One or more values are unusually high within the selected reference distribution. Higher HRV is not automatically better; rhythm, ectopy, breathing and artefact correction should be reviewed.";
  }
  if (rmssdLow && sdnnLow) {
    return "Short-term HRV is lower than expected for the selected reference group, with reduced beat-to-beat vagal-related variability and reduced overall five-minute variability.";
  }
  if (rmssdLow && !sdnnLow && sdnnCategory !== undefined) {
    return "Beat-to-beat vagal-related variability is relatively low, while overall five-minute variability is better preserved.";
  }
  if (sdnnLow && !rmssdLow && rmssdCategory !== undefined) {
    return "Overall five-minute variability is relatively low without a corresponding reduction in RMSSD.";
  }
  if (rmssdCentral && sdnnCentral) {
    return "RMSSD and SDNN are within the central 50% of the selected reference distribution. This does not exclude autonomic dysfunction or another medical condition.";
  }
  if (rmssdCategory !== undefined && sdnnCategory !== undefined) {
    return "RMSSD and SDNN fall in different parts of the selected reference distribution. RMSSD and SDNN do not show generally reduced short-term variability.";
  }
  return "Only one reference metric was entered, so a combined RMSSD\u2013SDNN pattern cannot be determined.";
}

function buildSummary(
  input: MeasurementInput,
  rmssdCategory: PercentileCategory | undefined,
  sdnnCategory: PercentileCategory | undefined,
  referenceAvailable: boolean
): string {
  if (!referenceAvailable) {
    return "The entered values are described below, but they cannot be placed within an age- and sex-specific reference distribution. Interpretation is limited to the recording conditions and the descriptive behaviour of each metric.";
  }

  const sentences: string[] = [];

  const summaryPhrases: Record<PercentileCategory, string> = {
    below_p5: "below the fifth percentile",
    p5_to_p25: "in the lower part of the reference distribution",
    p25_to_p75: "within the central 50% of the reference distribution",
    p75_to_p95: "in the upper part of the reference distribution",
    above_p95: "unusually high within the reference distribution",
  };

  const parts: string[] = [];
  if (input.rmssd !== undefined && rmssdCategory !== undefined) {
    parts.push(`RMSSD is ${summaryPhrases[rmssdCategory]}`);
  }
  if (input.sdnn !== undefined && sdnnCategory !== undefined) {
    parts.push(`SDNN is ${summaryPhrases[sdnnCategory]}`);
  }

  if (parts.length > 0) {
    sentences.push(
      `${parts.join(" and ")} for the selected age and reference-sex group.`
    );
  }

  sentences.push(combinedPattern(rmssdCategory, sdnnCategory));

  const anyLow =
    rmssdCategory === "below_p5" ||
    rmssdCategory === "p5_to_p25" ||
    sdnnCategory === "below_p5" ||
    sdnnCategory === "p5_to_p25";
  if (anyLow) {
    sentences.push(
      "The finding is nonspecific and does not by itself diagnose autonomic dysfunction or another medical condition."
    );
  }

  return sentences.join(" ");
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
      interpretation:
        "Short-term beat-to-beat variability strongly influenced by cardiac vagal modulation." +
        (rmssdCategory ? " " + percentileExplanations[rmssdCategory] : ""),
      limitation:
        "RMSSD does not directly measure vagal nerve activity; it is a statistical marker influenced by it.",
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
      interpretation:
        "SDNN reflects overall variability during this five-minute recording." +
        (sdnnCategory ? " " + percentileExplanations[sdnnCategory] : ""),
      limitation:
        "Five-minute SDNN must not be compared with 24-hour Holter SDNN reference values.",
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

  let lfhfWarning: string | undefined;
  let ratio = input.lfhfRatio;
  let ratioCalculated = false;
  if (
    input.lfPower !== undefined &&
    input.hfPower !== undefined &&
    input.hfPower > 0
  ) {
    const calculated = input.lfPower / input.hfPower;
    if (ratio === undefined) {
      ratio = calculated;
      ratioCalculated = true;
    } else if (hasLfhfDiscrepancy(ratio, input.lfPower, input.hfPower)) {
      lfhfWarning =
        "The entered LF/HF ratio differs by more than 10% from LF \u00F7 HF. Verify the entered LF, HF and LF/HF values.";
    }
  }

  if (ratio !== undefined) {
    metrics.push({
      key: "lfhf",
      name: "LF/HF ratio",
      value: Math.round(ratio * 100) / 100,
      unit: "",
      interpretation:
        describeLfhf(ratio) +
        "." +
        (ratioCalculated ? " Calculated from the entered LF and HF values." : ""),
      limitation: (lfhfWarning ? `${lfhfWarning} ${LFHF_CAUTION}` : LFHF_CAUTION),
    });
  }

  const summary = buildSummary(input, rmssdCategory, sdnnCategory, referenceAvailable);

  const overall = referenceAvailable
    ? combinedPattern(rmssdCategory, sdnnCategory)
    : "Without a matching reference distribution, only descriptive statements can be made. Interpret the values descriptively and together with the recording conditions and clinical context.";

  return {
    summary,
    metrics,
    overall,
    limitations: STANDING_LIMITATIONS,
    clinicalNote: CLINICAL_NOTE,
    referenceAvailable,
    referenceNote,
    lfhfWarning,
    safetyMessage: SAFETY_MESSAGE,
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
