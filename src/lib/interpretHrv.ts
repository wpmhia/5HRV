import {
  hrvReferenceData,
  getAgeBand,
  classifyPercentile,
  percentileLabels,
} from "@/data/hrvReferenceData";
import type {
  MeasurementInput,
  HrvFindings,
  HrvInterpretation,
  MetricResult,
  PercentileCategory,
  AutonomicScore,
  LfhfSource,
  ReferenceBand,
  VagalStatus,
  VariabilityStatus,
  FrequencyDomainPattern,
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

export function describeLfhf(ratio: number): string {
  if (ratio < 0.5) return "Relative HF predominance";
  if (ratio <= 2.0) return "LF and HF are of broadly comparable magnitude";
  if (ratio <= 4.0) return "Relative LF predominance";
  return "Marked relative LF predominance";
}

export function deriveLfhfPattern(ratio: number): FrequencyDomainPattern {
  if (ratio < 0.5) return "relative_hf_predominance";
  if (ratio <= 2.0) return "comparable_lf_hf";
  if (ratio <= 4.0) return "relative_lf_predominance";
  return "marked_lf_predominance";
}

const LFHF_CAUTION =
  "LF/HF is not a direct measurement of sympathetic\u2013parasympathetic balance.";

const CLINICAL_NOTE =
  "HRV results should be interpreted together with symptoms, examination findings, rhythm assessment and other clinical information.";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function estimatePercentile(
  value: number,
  percentiles: readonly number[]
): number | null {
  if (percentiles.length !== 5) return null;
  const [p5, p25, p50, p75, p95] = percentiles;
  let percentile: number;
  if (value <= p5) {
    percentile = (value / p5) * 5;
  } else if (value <= p25) {
    percentile = 5 + ((value - p5) / (p25 - p5)) * 20;
  } else if (value <= p50) {
    percentile = 25 + ((value - p25) / (p50 - p25)) * 25;
  } else if (value <= p75) {
    percentile = 50 + ((value - p50) / (p75 - p50)) * 25;
  } else if (value <= p95) {
    percentile = 75 + ((value - p75) / (p95 - p75)) * 20;
  } else {
    percentile = 95 + ((value - p95) / p95) * 5;
  }
  return Math.round(Math.min(100, Math.max(0, percentile)));
}

function categorizeVagal(band: ReferenceBand): VagalStatus {
  switch (band) {
    case "below_p5": return "markedly_reduced";
    case "p5_to_p25": return "reduced";
    case "p25_to_p75": return "preserved";
    case "p75_to_p95": return "high";
    case "above_p95": return "very_high";
    default: return "unclassified";
  }
}

function categorizeVariability(band: ReferenceBand): VariabilityStatus {
  switch (band) {
    case "below_p5": return "markedly_reduced";
    case "p5_to_p25": return "reduced";
    case "p25_to_p75": return "preserved";
    case "p75_to_p95": return "high";
    case "above_p95": return "very_high";
    default: return "unclassified";
  }
}

function calculateScoreComponents(
  rmssdBand: ReferenceBand,
  lfhfRatio: number
): { rmssdComponent: number; lfhfComponent: number } {
  const rmssdComponent = (() => {
    switch (rmssdBand) {
      case "below_p5": return 50;
      case "p5_to_p25": return 25;
      case "p25_to_p75": return 0;
      case "p75_to_p95": return -25;
      case "above_p95": return -50;
      default: return 0;
    }
  })();

  const lfhfComponent =
    lfhfRatio > 2
      ? clamp((lfhfRatio - 2) / 6, 0, 1) * 50
      : lfhfRatio < 1
        ? -clamp(1 - lfhfRatio, 0, 1) * 50
        : 0;

  return { rmssdComponent, lfhfComponent };
}

function scoreLabel(value: number): string {
  if (value <= -25) return "Parasympathetic predominance";
  if (value < 25) return "Balanced or mixed pattern";
  if (value < 50) return "Mild sympathetic shift";
  if (value < 75) return "Marked sympathetic predominance";
  return "Pronounced sympathetic predominance";
}

export function deriveHrvFindings(input: MeasurementInput): HrvFindings {
  const ageBand = getAgeBand(input.age);
  const referenceAvailable = input.referenceSex !== "none" && ageBand !== null;

  let referenceNote: string | undefined;
  if (input.age > 72) {
    referenceNote =
      "No matching age-specific reference percentile is available above 72 years. The values can still be described, but they cannot be placed accurately within this reference distribution.";
  } else if (input.referenceSex === "none") {
    referenceNote =
      "No sex-specific reference distribution was selected. The values are described without reference-percentile placement.";
  }

  let rmssdBand: ReferenceBand = "unclassified";
  let sdnnBand: ReferenceBand = "unclassified";
  let rmssdPercentiles: readonly number[] | undefined;
  let sdnnPercentiles: readonly number[] | undefined;

  if (referenceAvailable && ageBand) {
    const ref = hrvReferenceData[input.referenceSex as "male" | "female"][ageBand];
    rmssdPercentiles = ref.rmssd;
    sdnnPercentiles = ref.sdnn;
    if (input.rmssd !== undefined) {
      rmssdBand = classifyPercentile(input.rmssd, rmssdPercentiles);
    }
    if (input.sdnn !== undefined) {
      sdnnBand = classifyPercentile(input.sdnn, sdnnPercentiles);
    }
  }

  let ratio: number | undefined;
  let lfhfSource: LfhfSource | undefined;
  if (input.lfPower !== undefined && input.hfPower !== undefined && input.hfPower > 0) {
    ratio = input.lfPower / input.hfPower;
    lfhfSource = "calculated";
  } else if (input.lfhfRatio !== undefined) {
    ratio = input.lfhfRatio;
    lfhfSource = input.lfhfSource ?? "imported";
  }

  const fdPattern: FrequencyDomainPattern =
    ratio !== undefined ? deriveLfhfPattern(ratio) : "unavailable";

  const vagalStatus = categorizeVagal(rmssdBand);
  const variabilityStatus = categorizeVariability(sdnnBand);

  let autonomicScore: HrvFindings["autonomicScore"] = undefined;
  if (rmssdBand !== "unclassified" && ratio !== undefined) {
    const { rmssdComponent, lfhfComponent } = calculateScoreComponents(rmssdBand, ratio);
    const value = Math.round(clamp(rmssdComponent + lfhfComponent, -100, 100));
    autonomicScore = {
      value,
      label: scoreLabel(value),
      rmssdComponent,
      lfhfComponent,
    };
  }

  return {
    age: input.age,
    referenceSex: input.referenceSex,
    ageBand,
    referenceAvailable,
    referenceNote,

    rmssd: {
      value: input.rmssd,
      band: rmssdBand,
      estimatedPercentile:
        input.rmssd !== undefined && rmssdPercentiles
          ? estimatePercentile(input.rmssd, rmssdPercentiles) ?? undefined
          : undefined,
      referencePercentiles: rmssdPercentiles ? [...rmssdPercentiles] : undefined,
      vagalStatus,
    },

    sdnn: {
      value: input.sdnn,
      band: sdnnBand,
      estimatedPercentile:
        input.sdnn !== undefined && sdnnPercentiles
          ? estimatePercentile(input.sdnn, sdnnPercentiles) ?? undefined
          : undefined,
      referencePercentiles: sdnnPercentiles ? [...sdnnPercentiles] : undefined,
      variabilityStatus,
    },

    pnn50: input.pnn50 !== undefined ? { value: input.pnn50 } : undefined,

    frequencyDomain: {
      hfPower: input.hfPower,
      lfPower: input.lfPower,
      lfhfRatio: ratio !== undefined ? Math.round(ratio * 100) / 100 : undefined,
      lfhfSource,
      pattern: fdPattern,
    },

    autonomicScore,
  };
}

function bandIsLow(band: ReferenceBand): boolean {
  return band === "below_p5" || band === "p5_to_p25";
}

function bandIsTypical(band: ReferenceBand): boolean {
  return band === "p25_to_p75";
}

function bandIsHigh(band: ReferenceBand): boolean {
  return band === "p75_to_p95" || band === "above_p95";
}

function describeBand(band: ReferenceBand, highLabel: string, lowLabel: string, typicalLabel: string, unclassifiedLabel: string): string {
  if (band === "unclassified") return unclassifiedLabel;
  if (bandIsLow(band)) return lowLabel;
  if (bandIsHigh(band)) return highLabel;
  return typicalLabel;
}

export function renderMetricDescriptions(findings: HrvFindings): MetricResult[] {
  const metrics: MetricResult[] = [];

  const rmssdVal = findings.rmssd.value;
  if (rmssdVal !== undefined) {
    const v = findings.rmssd;
    metrics.push({
      key: "rmssd",
      name: "RMSSD",
      value: rmssdVal,
      unit: "ms",
      category: v.band !== "unclassified" ? (v.band as PercentileCategory) : undefined,
      categoryLabel: v.band !== "unclassified" ? percentileLabels[v.band as PercentileCategory] : undefined,
      referencePercentiles: v.referencePercentiles,
      interpretation: describeBand(
        v.band,
        "Parasympathetic activity is high.",
        "Parasympathetic activity is reduced.",
        "Parasympathetic activity is preserved.",
        "Short-term beat-to-beat variability strongly influenced by cardiac vagal modulation."
      ),
    });
  }

  const sdnnVal = findings.sdnn.value;
  if (sdnnVal !== undefined) {
    const v = findings.sdnn;
    metrics.push({
      key: "sdnn",
      name: "SDNN",
      value: sdnnVal,
      unit: "ms",
      category: v.band !== "unclassified" ? (v.band as PercentileCategory) : undefined,
      categoryLabel: v.band !== "unclassified" ? percentileLabels[v.band as PercentileCategory] : undefined,
      referencePercentiles: v.referencePercentiles,
      interpretation: describeBand(
        v.band,
        "Overall short-term HRV is high.",
        "Overall short-term HRV is reduced.",
        "Overall short-term HRV is within the expected range.",
        "SDNN reflects overall variability during this five-minute recording."
      ),
    });
  }

  if (findings.pnn50) {
    metrics.push({
      key: "pnn50",
      name: "pNN50",
      value: findings.pnn50.value,
      unit: "%",
      interpretation: "A vagal-related measure of successive NN-interval variation.",
      limitation: "No validated age- and sex-specific percentile dataset is implemented for pNN50, so no reference category is assigned.",
    });
  }

  if (findings.frequencyDomain.hfPower !== undefined) {
    metrics.push({
      key: "hf",
      name: "HF power",
      value: findings.frequencyDomain.hfPower,
      unit: "ms\u00B2",
      interpretation: "Respiratory-frequency variability influenced by cardiac vagal modulation and breathing.",
      limitation: "No universal reference range is applied to HF power; values depend strongly on breathing and analysis settings.",
    });
  }

  if (findings.frequencyDomain.lfPower !== undefined) {
    metrics.push({
      key: "lf",
      name: "LF power",
      value: findings.frequencyDomain.lfPower,
      unit: "ms\u00B2",
      interpretation: "LF power reflects mixed autonomic and baroreflex-related influences.",
      limitation: "LF power does not directly measure sympathetic activity and must not be interpreted as a pure sympathetic marker.",
    });
  }

  if (findings.frequencyDomain.lfhfRatio !== undefined) {
    const ratio = findings.frequencyDomain.lfhfRatio;
    const source = findings.frequencyDomain.lfhfSource;
    const sourceText =
      source === "calculated"
        ? " Calculated from LF and HF."
        : source === "manual"
          ? " Entered ratio."
          : " Reported ratio from the uploaded analysis.";
    metrics.push({
      key: "lfhf",
      name: "LF/HF ratio",
      value: ratio,
      unit: "",
      lfhfSource: source,
      interpretation: describeLfhf(ratio) + "." + sourceText,
      limitation: LFHF_CAUTION,
    });
  }

  return metrics;
}

export function renderClinicalSummary(findings: HrvFindings): string {
  const sdnn = findings.sdnn;
  const rmssd = findings.rmssd;
  const fd = findings.frequencyDomain;
  const score = findings.autonomicScore;

  const clauses: string[] = [];

  if (sdnn.value !== undefined && sdnn.referencePercentiles && findings.ageBand) {
    const sexLabel = findings.referenceSex === "female" ? "women" : findings.referenceSex === "male" ? "men" : "the selected reference group";
    const bandLabel = sdnn.band !== "unclassified" ? percentileLabels[sdnn.band as PercentileCategory] : "";
    const pctStr = sdnn.estimatedPercentile !== undefined ? `, at approximately the ${ordinal(sdnn.estimatedPercentile)} percentile` : "";
    clauses.push(
      `SDNN ${sdnn.value} ms is within the ${bandLabel} reference range for ${sexLabel} aged ${findings.ageBand}${pctStr}.`
    );
  }

  if (rmssd.value !== undefined && rmssd.referencePercentiles && findings.ageBand) {
    const sexLabel = findings.referenceSex === "female" ? "women" : findings.referenceSex === "male" ? "men" : "the selected reference group";
    const bandLabel = rmssd.band !== "unclassified" ? percentileLabels[rmssd.band as PercentileCategory] : "";
    const pctStr = rmssd.estimatedPercentile !== undefined ? `, at approximately the ${ordinal(rmssd.estimatedPercentile)} percentile` : "";
    const vagalText = rmssd.vagalStatus === "reduced" || rmssd.vagalStatus === "markedly_reduced"
      ? ", indicating reduced short-term parasympathetic activity"
      : "";
    clauses.push(
      `RMSSD ${rmssd.value} ms is within the ${bandLabel} reference range for ${sexLabel} aged ${findings.ageBand}${pctStr}${vagalText}.`
    );
  }

  if (fd.lfhfRatio !== undefined) {
    const patternText = describeLfhf(fd.lfhfRatio);
    clauses.push(
      `The frequency-domain pattern shows ${patternText.toLowerCase()}, with an LF/HF ratio of ${fd.lfhfRatio}.`
    );
  }

  const overallVar = sdnn.band !== "unclassified" && !bandIsLow(sdnn.band) ? "preserved" : "reduced";
  const paraStatus = rmssd.vagalStatus === "reduced" || rmssd.vagalStatus === "markedly_reduced" ? "reduced" : "preserved";
  const scoreText = score
    ? ` and a ${score.label.toLowerCase()}`
    : "";
  clauses.push(
    `Overall variability is ${overallVar}, with ${paraStatus} parasympathetic activity${scoreText}.`
  );

  const isAbnormal =
    bandIsLow(sdnn.band) ||
    bandIsLow(rmssd.band) ||
    (score !== undefined && score.value >= 25);

  if (isAbnormal) {
    clauses.push(
      "This pattern may indicate chronic physiological stress or autonomic imbalance in the appropriate clinical context."
    );
  }

  clauses.push(
    "Serial measurements under standardised conditions are more informative than a single recording."
  );

  return clauses.join(" ");
}

function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1: return `${value}st`;
    case 2: return `${value}nd`;
    case 3: return `${value}rd`;
    default: return `${value}th`;
  }
}

function buildConclusion(findings: HrvFindings): string {
  return renderClinicalSummary(findings);
}

export function buildClinicalParagraph(
  findings: HrvFindings
): string {
  return renderClinicalSummary(findings);
}

export function interpretHrv(input: MeasurementInput): HrvInterpretation {
  const findings = deriveHrvFindings(input);

  const metrics = renderMetricDescriptions(findings);
  const conclusion = findings.referenceAvailable
    ? buildConclusion(findings)
    : "The entered values cannot be placed within an age- and sex-specific reference distribution. Interpret the values descriptively and together with the clinical context.";

  return {
    summary: conclusion,
    metrics,
    overall: conclusion,
    limitations: [],
    clinicalNote: CLINICAL_NOTE,
    referenceAvailable: findings.referenceAvailable,
    referenceNote: findings.referenceNote,
    safetyMessage: "",
    autonomicScore: findings.autonomicScore,
    findings,
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
