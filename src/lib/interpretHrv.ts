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
  MetricInterpretation,
  Confidence,
  PercentileCategory,
} from "@/lib/types";

export function normalizeNumber(value: string | number): number {
  if (typeof value === "number") return value;
  const normalized = value.replace(",", ".").trim();
  return parseFloat(normalized);
}

function assessConfidence(input: MeasurementInput): {
  confidence: Confidence;
  reasons: string[];
  notInterpretableReason?: string;
} {
  const reasons: string[] = [];

  if (
    input.rhythmConditions.includes("atrial_fibrillation") ||
    input.rhythmConditions.includes("atrial_flutter") ||
    input.rhythmConditions.includes("paced_ventricular")
  ) {
    return {
      confidence: "not-interpretable",
      reasons: [
        "Standard sinus-rhythm HRV interpretation may not be valid for this recording.",
      ],
      notInterpretableReason:
        "Atrial fibrillation, atrial flutter, or paced ventricular rhythm was present. Standard sinus-rhythm HRV interpretation is not valid.",
    };
  }

  if (input.rhythmConditions.includes("frequent_ectopy") && input.artefactCorrection !== "completed") {
    return {
      confidence: "not-interpretable",
      reasons: [
        "Frequent ectopic beats were present and artefact correction was not completed.",
      ],
      notInterpretableReason:
        "Frequent ectopic beats with no artefact correction. Standard HRV interpretation is not valid.",
    };
  }

  let flagCount = 0;

  if (input.measurementSource === "unknown") {
    reasons.push("Measurement source is unknown.");
    flagCount++;
  }
  if (input.measurementSource === "smartwatch" || input.measurementSource === "ppg") {
    reasons.push("PPG or smartwatch source limits accuracy, especially for frequency-domain measurements.");
    flagCount++;
  }
  if (input.recordingDuration < 4.5 || input.recordingDuration > 5.5) {
    reasons.push(
      "Recording duration is not approximately five minutes, which this reference framework is designed for."
    );
    flagCount++;
  }
  if (input.position === "standing") {
    reasons.push("Standing position materially affects HRV compared to the supine reference condition.");
    flagCount++;
  }
  if (input.position === "seated" || input.position === "unknown") {
    reasons.push(
      input.position === "seated"
        ? "Seated position may affect HRV compared to the supine reference condition."
        : "Body position is unknown, limiting comparability with reference data."
    );
    flagCount++;
  }
  if (input.breathing === "irregular" || input.breathing === "talking_or_irregular") {
    reasons.push("Irregular breathing or talking during recording may affect HRV measurements.");
    flagCount++;
  }
  if (input.artefactCorrection !== "completed") {
    reasons.push("Artefact correction was not confirmed as completed.");
    flagCount++;
  }
  if (input.rhythmConditions.includes("unknown")) {
    reasons.push("Rhythm quality during recording is unknown.");
    flagCount++;
  }
  if (input.restBefore === "less_than_5" || input.restBefore === "unknown") {
    reasons.push(
      input.restBefore === "less_than_5"
        ? "Rest period before recording was less than five minutes."
        : "Rest period before recording is unknown."
    );
    flagCount++;
  }
  if (input.rhythmConditions.includes("frequent_ectopy")) {
    reasons.push("Frequent ectopic beats were present. Interpretation confidence is reduced.");
    flagCount++;
  }
  if (input.samplingRate !== undefined && input.samplingRate < 250) {
    reasons.push(
      `Sampling rate of ${input.samplingRate} Hz may reduce RR-interval precision.`
    );
    flagCount++;
  }

  if (flagCount >= 2) {
    return { confidence: "low", reasons };
  }
  if (flagCount === 1 || (
    input.measurementSource === "unknown" ||
    input.artefactCorrection === "unknown" ||
    input.breathing === "unknown" ||
    input.rhythmConditions.includes("unknown")
  )) {
    return { confidence: "moderate", reasons };
  }

  if (
    (input.measurementSource === "ecg" || input.measurementSource === "ecg_chest_strap") &&
    input.recordingDuration >= 4.5 &&
    input.recordingDuration <= 5.5 &&
    input.position === "supine" &&
    input.breathing === "spontaneous" &&
    input.restBefore === "at_least_5" &&
    input.artefactCorrection === "completed" &&
    input.rhythmConditions.includes("sinus_rhythm") &&
    !input.rhythmConditions.includes("frequent_ectopy") &&
    (input.samplingRate === undefined || input.samplingRate >= 250)
  ) {
    if (reasons.length === 0) {
      return { confidence: "high", reasons };
    }
  }

  if (flagCount > 0) {
    return { confidence: "low", reasons };
  }
  return { confidence: "moderate", reasons };
}

function buildMetricInterpretation(
  metricName: string,
  value: number,
  unit: string,
  percentileCategory: PercentileCategory | undefined,
  additionalContext?: string
): MetricInterpretation {
  const label = percentileCategory
    ? percentileLabels[percentileCategory]
    : "Limited interpretation";

  let explanation = percentileCategory
    ? percentileExplanations[percentileCategory]
    : `No matched reference-percentile for ${metricName}.`;

  if (additionalContext) {
    explanation += " " + additionalContext;
  }

  return {
    value,
    unit,
    percentileCategory,
    label,
    explanation,
  };
}

function getSpectralInterpretation(input: MeasurementInput): string | undefined {
  const ratio = input.lfhfRatio;
  if (ratio === undefined) return undefined;

  const base: Record<string, string> = {
    below_0_5: "The spectral distribution is relatively HF weighted.",
    between: "LF and HF are of broadly comparable magnitude.",
    above_2: "The spectral distribution shows relative LF predominance.",
    above_4: "The spectral distribution shows marked relative LF predominance.",
  };

  let category: string;
  if (ratio < 0.5) {
    category = base.below_0_5;
  } else if (ratio <= 2.0) {
    category = base.between;
  } else if (ratio <= 4.0) {
    category = base.above_2;
  } else {
    category = base.above_4;
  }

  return (
    category +
    " LF/HF is not a direct measurement of sympathetic" +
    "\u2013parasympathetic balance and must be interpreted cautiously."
  );
}

function buildSummary(
  input: MeasurementInput,
  rmssdCategory: PercentileCategory | undefined,
  sdnnCategory: PercentileCategory | undefined
): string {
  const rmssdLow =
    rmssdCategory === "below_p5" || rmssdCategory === "p5_to_p25";
  const sdnnLow =
    sdnnCategory === "below_p5" || sdnnCategory === "p5_to_p25";
  const rmssdMid = rmssdCategory === "p25_to_p75";
  const sdnnMid = sdnnCategory === "p25_to_p75";
  const anyHigh =
    rmssdCategory === "above_p95" || sdnnCategory === "above_p95";

  if (rmssdLow && sdnnLow) {
    return "Short-term HRV is lower than expected for the selected reference group, with reductions in both beat-to-beat vagal-related variability and overall five-minute variability. This pattern is nonspecific and cannot identify its cause.";
  }
  if (rmssdLow && (sdnnMid || sdnnCategory === "p75_to_p95" || sdnnCategory === "above_p95")) {
    return "Beat-to-beat vagal-related variability is relatively low, while overall short-term variability is better preserved.";
  }
  if (sdnnLow && (rmssdMid || rmssdCategory === "p75_to_p95" || rmssdCategory === "above_p95")) {
    return "Overall five-minute variability is relatively low without a corresponding reduction in RMSSD. Confirm recording quality and consider the influence of heart rate, breathing and recording conditions.";
  }
  if (rmssdMid && sdnnMid) {
    return "RMSSD and SDNN fall within the central 50% of the selected age- and sex-specific reference distribution. This does not exclude autonomic dysfunction or another medical condition.";
  }
  if (anyHigh) {
    return "One or more HRV measures are unusually high within the selected reference distribution. High values may occur in healthy individuals but can also be influenced by slow heart rate, ectopic beats, rhythm irregularity, breathing or artefact. Higher is not automatically better.";
  }

  return "HRV measurements have been contextualized against the selected reference distribution. Interpretation is limited by the available data and recording conditions.";
}

function buildLimitations(input: MeasurementInput): string[] {
  const limitations: string[] = [];

  limitations.push("Age");
  if (input.referenceSex !== "none") {
    limitations.push("Reference sex");
  }
  if (input.meanHeartRate !== undefined) {
    limitations.push("Mean heart rate");
  }
  limitations.push("Body position");
  limitations.push("Respiratory rate and depth");
  limitations.push("Time of day");
  limitations.push("Recent exercise");
  limitations.push("Acute illness");
  limitations.push("Sleep");
  limitations.push("Psychological stress");
  limitations.push("Caffeine");
  limitations.push("Nicotine");
  limitations.push("Alcohol");
  limitations.push("Medication");
  limitations.push("Hydration");
  limitations.push("Ectopic beats");
  limitations.push("Artefact correction");
  limitations.push("Device and sampling method");

  return limitations;
}

export function interpretHrv(input: MeasurementInput): HrvInterpretation {
  const { confidence, reasons: confidenceReasons, notInterpretableReason } =
    assessConfidence(input);

  if (confidence === "not-interpretable") {
    return {
      confidence: "not-interpretable",
      confidenceReasons,
      summary: notInterpretableReason || "",
      limitations: buildLimitations(input),
      safetyMessage:
        "Seek medical assessment for concerning symptoms such as syncope, chest pain, severe breathlessness, a sustained irregular heartbeat or new neurological symptoms. HRV interpretation must not delay urgent care.",
      notInterpretableReason,
    };
  }

  const ageBand = getAgeBand(input.age);
  const hasReference =
    input.referenceSex !== "none" && ageBand !== null && input.age <= 72;

  let rmssdCategory: PercentileCategory | undefined;
  let sdnnCategory: PercentileCategory | undefined;

  if (hasReference && input.rmssd !== undefined) {
    const refData =
      hrvReferenceData[input.referenceSex as "male" | "female"][ageBand!];
    const rmssdResult = classifyPercentile(input.rmssd, refData.rmssd);
    rmssdCategory = rmssdResult.category;
  }

  if (hasReference && input.sdnn !== undefined) {
    const refData =
      hrvReferenceData[input.referenceSex as "male" | "female"][ageBand!];
    const sdnnResult = classifyPercentile(input.sdnn, refData.sdnn);
    sdnnCategory = sdnnResult.category;
  }

  const summary = buildSummary(input, rmssdCategory, sdnnCategory);

  const interpretation: HrvInterpretation = {
    confidence,
    confidenceReasons,
    summary,
    limitations: buildLimitations(input),
    safetyMessage:
      "Seek medical assessment for concerning symptoms such as syncope, chest pain, severe breathlessness, a sustained irregular heartbeat or new neurological symptoms. HRV interpretation must not delay urgent care.",
  };

  const noRefNote = !hasReference
    ? " No matched reference percentile is available for this age or reference-sex selection. Personal trends are more informative than single reference comparisons."
    : "";

  if (input.rmssd !== undefined) {
    const rmssdDesc = "A measure of short-term beat-to-beat variability that is strongly influenced by cardiac vagal modulation.";
    let rmssdExtra = rmssdDesc;
    if (!hasReference) {
      rmssdExtra += noRefNote;
    }
    interpretation.rmssdInterpretation = buildMetricInterpretation(
      "RMSSD",
      input.rmssd,
      "ms",
      rmssdCategory,
      rmssdDesc
    );
  }

  if (input.sdnn !== undefined) {
    const sdnnDesc = "The standard deviation of normal-to-normal intervals, reflecting overall variability during the recording. For a five-minute recording, do not compare with 24-hour SDNN reference values.";
    let sdnnExtra = sdnnDesc;
    if (!hasReference) {
      sdnnExtra += noRefNote;
    }
    interpretation.sdnnInterpretation = buildMetricInterpretation(
      "SDNN",
      input.sdnn,
      "ms",
      sdnnCategory,
      sdnnDesc
    );
  }

  if (input.pnn50 !== undefined) {
    interpretation.pnn50Interpretation = {
      value: input.pnn50,
      unit: "%",
      label: "Limited interpretation",
      explanation:
        "The percentage of successive normal-to-normal intervals differing by more than 50 ms. It is related to short-term vagal modulation but is strongly age dependent.",
      limitation:
        "A validated reference-percentile table for pNN50 has not been implemented.",
    };
  }

  if (input.hfPower !== undefined) {
    let hfExtra = "Respiratory-frequency variability strongly influenced by cardiac vagal modulation, breathing rate, breathing depth and spectral-analysis method.";

    if (input.rmssd !== undefined && rmssdCategory) {
      const hfReduced = input.hfPower < 200;
      const rmssdReduced =
        rmssdCategory === "below_p5" || rmssdCategory === "p5_to_p25";
      if (hfReduced && rmssdReduced) {
        hfExtra +=
          " RMSSD and HF are directionally concordant, supporting reduced respiratory and beat-to-beat vagal-related variability under these recording conditions.";
      } else if (hfReduced !== rmssdReduced) {
        hfExtra +=
          " RMSSD and HF are discordant. Breathing pattern, spectral method, artefacts or other recording conditions may explain the difference.";
      }
    }

    interpretation.hfInterpretation = {
      value: input.hfPower,
      unit: "ms\u00B2",
      label: "Limited interpretation",
      explanation: hfExtra,
      limitation:
        "HF power is strongly affected by breathing and spectral-analysis method. No universal normal range is provided.",
    };
  }

  if (input.lfPower !== undefined) {
    interpretation.lfInterpretation = {
      value: input.lfPower,
      unit: "ms\u00B2",
      label: "Limited interpretation",
      explanation:
        "Low-frequency variability reflecting mixed autonomic and baroreflex-related influences. LF power reflects mixed autonomic and baroreflex-related influences and must not be treated as a pure sympathetic measurement.",
      limitation:
        "LF power reflects mixed influences and must not be treated as a pure sympathetic measurement.",
    };
  }

  if (input.lfhfRatio !== undefined || (input.lfPower !== undefined && input.hfPower !== undefined)) {
    let ratio = input.lfhfRatio;
    let ratioWarning: string | undefined;

    if (input.lfPower !== undefined && input.hfPower !== undefined && input.hfPower !== 0) {
      const calculatedRatio = input.lfPower / input.hfPower;
      if (ratio === undefined) {
        ratio = calculatedRatio;
      } else {
        const diff = Math.abs(ratio - calculatedRatio) / calculatedRatio;
        if (diff > 0.1) {
          ratioWarning =
            "The entered LF/HF ratio differs by more than 10% from the calculated value (LF \u00F7 HF). Please verify both values.";
        }
      }
    }

    if (ratio !== undefined) {
      interpretation.lfhfInterpretation = {
        value: Math.round(ratio * 100) / 100,
        unit: "",
        label: "Limited interpretation",
        explanation:
          "A mathematical description of the relative distribution of LF and HF spectral power.",
        limitation: ratioWarning
          ? ratioWarning +
            " LF/HF is not a direct measurement of sympathetic" +
            "\u2013parasympathetic balance and must be interpreted cautiously."
          : "LF/HF is not a direct measurement of sympathetic\u2013parasympathetic balance and must be interpreted cautiously.",
      };

      const spectralInterpretation = getSpectralInterpretation({
        ...input,
        lfhfRatio: ratio,
      });
      if (spectralInterpretation) {
        interpretation.spectralInterpretation = spectralInterpretation;
      }
    }
  }

  return interpretation;
}

export function computeLfhfRatio(lfPower: number, hfPower: number): number {
  if (hfPower === 0) return 0;
  return lfPower / hfPower;
}

export function checkLfhfDiscrepancy(
  enteredRatio: number,
  lfPower: number,
  hfPower: number
): boolean {
  if (hfPower === 0) return false;
  const calculated = lfPower / hfPower;
  return Math.abs(enteredRatio - calculated) / calculated > 0.1;
}

export const prohibitedPhrases = [
  "diagnosed with",
  "you have POTS",
  "sympathetic dominance",
  "parasympathetic failure",
  "treatment should",
  "start medication",
  "normal autonomic nervous system",
  "excellent HRV",
  "bad HRV",
  "autonomic age",
  "nervous system score",
  "stress score",
  "sympathetic score",
  "recovery score",
  "sympathovagal balance",
  "sympathetic overactivation",
  "LF equals sympathetic",
  "increased LF proves",
  "sympathetic overactivity",
  "proven sympathetic",
  "parasympathetic failure proven",
  "Dysautonomia",
  "Autonomic neuropathy",
  "ME/CFS",
  "Long COVID",
  "Cardiac autonomic failure",
  "sympathetic dominance",
];

export function containsProhibitedPhrases(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const phrase of prohibitedPhrases) {
    if (lower.includes(phrase.toLowerCase())) {
      found.push(phrase);
    }
  }
  return found;
}
