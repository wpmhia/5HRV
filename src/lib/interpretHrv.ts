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
  AutonomicConcordance,
  AutonomicProfile,
  LfhfSource,
  ReferenceBand,
  RecordingMetadata,
  ReferenceCompatibility,
  VagalStatus,
  VariabilityStatus,
  FrequencyDomainPattern,
} from "@/lib/types";

export const ANALYSIS_ENGINE_VERSION = "1.0.0";
export const REFERENCE_DATASET_VERSION = "danfund-brinth-2022";

export function normalizeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

const DANFUND_ANALYSIS_SECONDS = 300;
const DANFUND_DURATION_TOLERANCE_SECONDS = 1;
const DANFUND_REQUIRED_REST_SECONDS = 300;

// The DanFunD reference distribution was derived from the final five minutes
// of a standardized supine recording preceded by at least five minutes of
// supine rest. Percentile placement and the Autonomic Pattern Score are only
// meaningful when the recording matches those protocol conditions.
export function assessReferenceCompatibility(
  recording?: RecordingMetadata,
): ReferenceCompatibility {
  if (!recording) {
    return {
      compatible: false,
      reference: null,
      reasons: ["Recording protocol metadata is missing, so DanFunD reference compatibility cannot be established."],
    };
  }

  const reasons: string[] = [];

  if (recording.durationSeconds !== undefined) {
    const duration = recording.durationSeconds;
    if (
      duration < DANFUND_ANALYSIS_SECONDS - DANFUND_DURATION_TOLERANCE_SECONDS ||
      duration > DANFUND_ANALYSIS_SECONDS + DANFUND_DURATION_TOLERANCE_SECONDS
    ) {
      reasons.push(
        `The recording duration (${Math.round(duration / 60)} minutes) does not match the five-minute analysis window of the DanFunD reference protocol.`,
      );
    }
  }

  if (recording.source === "bluetooth_rr") {
    if (
      recording.preparationSeconds === undefined ||
      recording.preparationSeconds < DANFUND_REQUIRED_REST_SECONDS
    ) {
      reasons.push(
        "The recording was not preceded by five minutes of quiet supine rest, which the DanFunD reference protocol requires.",
      );
    }
    if (recording.posture !== "supine") {
      reasons.push(
        "The recording was not obtained in the supine position required by the DanFunD reference protocol.",
      );
    }
  }

  return {
    compatible: reasons.length === 0,
    reference: reasons.length === 0 ? "danfund" : null,
    reasons,
  };
}

export function computeLfhfRatio(lfPower: number, hfPower: number): number | null {
  if (hfPower <= 0) return null;
  return lfPower / hfPower;
}

export function describeLfhf(ratio: number): string {
  if (ratio < 0.5) return "Relative HF predominance";
  if (ratio <= 2.0) return "LF and HF are of broadly comparable magnitude";
  if (ratio <= 4.0) return "Relative LF predominance";
  return "Marked relative LF predominance";
}

function describeLfhfInSentence(ratio: number): string {
  if (ratio < 0.5) return "relative HF predominance";
  if (ratio <= 2.0) return "LF and HF of broadly comparable magnitude";
  if (ratio <= 4.0) return "relative LF predominance";
  return "marked relative LF predominance";
}

export function describeLfhfByBand(band: ReferenceBand): string | null {
  switch (band) {
    case "below_p5": return "Very low relative to the reference population, indicating marked HF predominance.";
    case "p5_to_p25": return "Low relative to the reference population, indicating HF predominance.";
    case "p25_to_p75": return "Within the typical range for the reference population.";
    case "p75_to_p95": return "High relative to the reference population, consistent with LF predominance.";
    case "above_p95": return "Very high relative to the reference population, indicating marked LF predominance.";
    default: return null;
  }
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
  "5HRV is a scientific HRV calculator that analyses five-minute HRV recordings using peer-reviewed physiological research and published age- and sex-specific reference populations. Clinical interpretation remains the responsibility of the healthcare professional, who integrates these findings with the patient\u2019s history, symptoms, examination, medications, recording conditions and other relevant clinical information. Interpretation assumes that the supplied values originate from a technically valid five-minute HRV analysis.";

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
  return clamp(percentile, 0, 100);
}

export function interpolateLogPercentile(
  value: number,
  reference: readonly [number, number, number, number, number],
): number {
  const [p5, p25, p50, p75, p95] = reference;
  if (p5 <= 0 || value <= 0) {
    return clamp(estimatePercentile(value, reference) ?? 50, 5, 95);
  }

  const cappedVal = clamp(value, p5, p95);

  const logVal = Math.log(cappedVal);
  const logP5 = Math.log(p5);
  const logP25 = Math.log(p25);
  const logP50 = Math.log(p50);
  const logP75 = Math.log(p75);
  const logP95 = Math.log(p95);

  if (cappedVal <= p25) {
    return clamp(5 + ((logVal - logP5) / (logP25 - logP5)) * 20, 5, 25);
  }
  if (cappedVal <= p50) {
    return clamp(25 + ((logVal - logP25) / (logP50 - logP25)) * 25, 25, 50);
  }
  if (cappedVal <= p75) {
    return clamp(50 + ((logVal - logP50) / (logP75 - logP50)) * 25, 50, 75);
  }
  return clamp(75 + ((logVal - logP75) / (logP95 - logP75)) * 20, 75, 95);
}

export function percentileToZ(percentile: number): number {
  const p = clamp(percentile / 100, 0.001, 0.999);
  const t = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
  const z0 = t - (2.515517 + 0.802853 * t + 0.010328 * t * t) / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t);
  return p < 0.5 ? -z0 : z0;
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

// Provisional 70/30 weighting balancing vagal modulation (RMSSD)
// against relative spectral pattern (LF/HF). RMSSD is the primary
// component because it isolates vagal tone with fewer confounding
// influences than frequency-domain ratios.
export const VAGAL_WEIGHT = 0.7;
export const SPECTRAL_WEIGHT = 0.3;
export const AUTONOMIC_SCORE_DENOMINATOR = 2.2;

function deriveConcordance(
  rmssdPercentile: number,
  lfhfPercentile: number,
): AutonomicConcordance {
  const rmssdLow = rmssdPercentile < 25;
  const rmssdHigh = rmssdPercentile > 75;
  const rmssdCentral = !rmssdLow && !rmssdHigh;
  const lfhfLow = lfhfPercentile < 25;
  const lfhfHigh = lfhfPercentile > 75;
  const lfhfCentral = !lfhfLow && !lfhfHigh;

  if (rmssdCentral && lfhfCentral) return "central";

  if (rmssdLow && lfhfHigh) return "concordant_sympathetic_shift";
  if (rmssdHigh && lfhfLow) return "concordant_parasympathetic_shift";

  if ((rmssdLow && lfhfLow) || (rmssdHigh && lfhfHigh)) return "mixed";

  if (rmssdLow || lfhfHigh) return "single_axis_sympathetic_shift";
  return "single_axis_parasympathetic_shift";
}

function computeAutonomicProfile(
  rmssdPercentile: number,
  lfhfPercentile: number,
  rmssdBand: ReferenceBand,
  lfhfBand: ReferenceBand,
  sdnnPercentile?: number,
  sdnnBand?: ReferenceBand,
): AutonomicProfile {
  const vagalDeviation = -percentileToZ(rmssdPercentile);
  const spectralDeviation = percentileToZ(lfhfPercentile);

  const vagalWeighted = VAGAL_WEIGHT * vagalDeviation;
  const spectralWeighted = SPECTRAL_WEIGHT * spectralDeviation;
  const combinedDeviation = vagalWeighted + spectralWeighted;

  const score = Math.round(clamp(combinedDeviation / AUTONOMIC_SCORE_DENOMINATOR, -1, 1) * 100);

  const concordance = deriveConcordance(rmssdPercentile, lfhfPercentile);

  const label = (() => {
    if (concordance === "mixed") return "Mixed autonomic pattern";
    if (score <= -75) return "Pronounced parasympathetic-direction shift";
    if (score <= -50) return "Marked parasympathetic-direction shift";
    if (score <= -25) return "Mild parasympathetic-direction shift";
    if (score < 25) {
      if (concordance === "central") return "Central autonomic pattern";
      if (concordance.includes("parasympathetic")) return "Mild parasympathetic-direction shift";
      if (concordance.includes("sympathetic")) return "Mild sympathetic-direction shift";
      return "Mixed autonomic pattern";
    }
    if (score < 50) return "Mild sympathetic-direction shift";
    if (score < 75) return "Marked sympathetic-direction shift";
    return "Pronounced sympathetic-direction shift";
  })();

  return {
    score,
    label,
    vagal: {
      percentile: rmssdPercentile,
      deviationZ: vagalDeviation,
      category: rmssdBand as PercentileCategory,
    },
    spectral: {
      percentile: lfhfPercentile,
      deviationZ: spectralDeviation,
      category: lfhfBand as PercentileCategory,
    },
    totalVariability: sdnnPercentile !== undefined && sdnnBand !== undefined ? {
      percentile: sdnnPercentile,
      category: sdnnBand as PercentileCategory,
    } : undefined,
    concordance,
    provisional: true,
    vagalWeighted,
    spectralWeighted,
    combinedDeviation,
  };
}

export function deriveHrvFindings(input: MeasurementInput): HrvFindings {
  const ageBand = getAgeBand(input.age);
  const referenceCompatibility = assessReferenceCompatibility(input.recording);
  const referenceAvailable =
    input.referenceSex !== "none" &&
    ageBand !== null &&
    referenceCompatibility.compatible;

  let referenceNote: string | undefined;
  if (input.age > 72) {
    referenceNote =
      "No matching age-specific reference percentile is available above 72 years. The values can still be described, but they cannot be placed accurately within this reference distribution.";
  } else if (input.referenceSex === "none") {
    referenceNote =
      "No sex-specific reference distribution was selected. The values are described without reference-percentile placement.";
  }
  if (referenceCompatibility.reasons.length > 0) {
    const protocolNote = referenceCompatibility.reasons.join(" ");
    referenceNote = referenceNote ? `${protocolNote} ${referenceNote}` : protocolNote;
  }

  let rmssdBand: ReferenceBand = "unclassified";
  let sdnnBand: ReferenceBand = "unclassified";
  let rmssdPercentiles: readonly number[] | undefined;
  let sdnnPercentiles: readonly number[] | undefined;
  let lfhfPercentiles: readonly number[] | undefined;

  if (referenceAvailable && ageBand) {
    const ref = hrvReferenceData[input.referenceSex as "male" | "female"][ageBand];
    rmssdPercentiles = ref.rmssd;
    sdnnPercentiles = ref.sdnn;
    lfhfPercentiles = ref.lfhf;
    if (input.rmssd !== undefined) {
      rmssdBand = classifyPercentile(input.rmssd, rmssdPercentiles);
    }
    if (input.sdnn !== undefined) {
      sdnnBand = classifyPercentile(input.sdnn, sdnnPercentiles);
    }
  }

  let ratio: number | undefined;
  let lfhfSource: LfhfSource | undefined;
  let lfhfBand: ReferenceBand = "unclassified";
  if (input.lfPower !== undefined && input.hfPower !== undefined && input.hfPower > 0) {
    ratio = input.lfPower / input.hfPower;
    lfhfSource = "calculated";
  } else if (input.lfhfRatio !== undefined) {
    ratio = input.lfhfRatio;
    lfhfSource = input.lfhfSource ?? "imported";
  }
  if (ratio !== undefined && lfhfPercentiles) {
    lfhfBand = classifyPercentile(ratio, lfhfPercentiles);
  }

  const fdPattern: FrequencyDomainPattern =
    ratio !== undefined ? deriveLfhfPattern(ratio) : "unavailable";

  const vagalStatus = categorizeVagal(rmssdBand);
  const variabilityStatus = categorizeVariability(sdnnBand);

  const rmssdPct =
    input.rmssd !== undefined && rmssdPercentiles
      ? estimatePercentile(input.rmssd, rmssdPercentiles) ?? 50
      : undefined;

  const sdnnPct =
    input.sdnn !== undefined && sdnnPercentiles
      ? estimatePercentile(input.sdnn, sdnnPercentiles) ?? 50
      : undefined;

  const lfhfPct =
    ratio !== undefined && lfhfPercentiles
      ? interpolateLogPercentile(ratio, lfhfPercentiles as readonly [number, number, number, number, number])
      : undefined;

  let autonomicProfile: HrvFindings["autonomicProfile"] = undefined;

  if (rmssdPct !== undefined && lfhfPct !== undefined) {
    autonomicProfile = computeAutonomicProfile(
      rmssdPct, lfhfPct, rmssdBand, lfhfBand, sdnnPct, sdnnBand,
    );
  }

  return {
    age: input.age,
    referenceSex: input.referenceSex,
    ageBand,
    referenceAvailable,
    referenceNote,
    referenceCompatibility,

    rmssd: {
      value: input.rmssd,
      band: rmssdBand,
      estimatedPercentile: rmssdPct,
      referencePercentiles: rmssdPercentiles ? [...rmssdPercentiles] : undefined,
      vagalStatus,
    },

    sdnn: {
      value: input.sdnn,
      band: sdnnBand,
      estimatedPercentile: sdnnPct,
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
      lfhfBand: lfhfBand !== "unclassified" ? lfhfBand : undefined,
    },

    autonomicProfile,
  };
}

function bandIsLow(band: ReferenceBand): boolean {
  return band === "below_p5" || band === "p5_to_p25";
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
        "RMSSD is high relative to the selected reference population, consistent with enhanced cardiac vagal modulation.",
        "RMSSD is low relative to the selected reference population, consistent with reduced cardiac vagal modulation.",
        "RMSSD is within the typical range for the selected reference population.",
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
        "SDNN is high relative to the selected reference population.",
        "SDNN is low relative to the selected reference population.",
        "SDNN is within the typical range for the selected reference population.",
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
    const lfhfBand = findings.frequencyDomain.lfhfBand;
    const bandDescription = lfhfBand ? describeLfhfByBand(lfhfBand) : null;
    metrics.push({
      key: "lfhf",
      name: "LF/HF ratio",
      value: ratio,
      unit: "",
      category: lfhfBand && lfhfBand !== "unclassified" ? (lfhfBand as PercentileCategory) : undefined,
      categoryLabel: lfhfBand && lfhfBand !== "unclassified" ? percentileLabels[lfhfBand as PercentileCategory] : undefined,
      lfhfSource: source,
      interpretation: (bandDescription ?? describeLfhf(ratio) + ".") + sourceText,
      limitation: LFHF_CAUTION,
    });
  }

  return metrics;
}

function describeVariability(status: VariabilityStatus): string {
  switch (status) {
    case "markedly_reduced": return "markedly reduced overall variability";
    case "reduced": return "reduced overall variability";
    case "high": return "elevated overall variability";
    case "very_high": return "markedly elevated overall variability";
    default: return "preserved overall variability";
  }
}

function describeParasympathetic(status: VagalStatus): string {
  switch (status) {
    case "markedly_reduced": return "markedly reduced parasympathetic activity";
    case "reduced": return "reduced parasympathetic activity";
    case "high": return "elevated parasympathetic activity";
    case "very_high": return "markedly elevated parasympathetic activity";
    default: return "preserved parasympathetic activity";
  }
}

export function renderAnalysis(findings: HrvFindings): string {
  const sdnn = findings.sdnn;
  const rmssd = findings.rmssd;
  const fd = findings.frequencyDomain;
  const profile = findings.autonomicProfile;

  const clauses: string[] = [];

  const pctDisplay = (pct: number): string =>
    ordinal(clamp(Math.round(pct), 1, 99));

  if (sdnn.value !== undefined && sdnn.referencePercentiles && findings.ageBand) {
    const sexLabel = findings.referenceSex === "female" ? "women" : findings.referenceSex === "male" ? "men" : "the selected reference group";
    const bandLabel = sdnn.band !== "unclassified" ? percentileLabels[sdnn.band as PercentileCategory] : "";
    const pctStr = sdnn.estimatedPercentile !== undefined ? `, at approximately the ${pctDisplay(sdnn.estimatedPercentile)} percentile` : "";
    clauses.push(
      `SDNN ${sdnn.value} ms is within the ${bandLabel} reference range for ${sexLabel} aged ${findings.ageBand}${pctStr}.`
    );
  }

  if (rmssd.value !== undefined && rmssd.referencePercentiles && findings.ageBand) {
    const sexLabel = findings.referenceSex === "female" ? "women" : findings.referenceSex === "male" ? "men" : "the selected reference group";
    const bandLabel = rmssd.band !== "unclassified" ? percentileLabels[rmssd.band as PercentileCategory] : "";
    const pctStr = rmssd.estimatedPercentile !== undefined ? `, at approximately the ${pctDisplay(rmssd.estimatedPercentile)} percentile` : "";
    const vagalText = rmssd.vagalStatus === "reduced" || rmssd.vagalStatus === "markedly_reduced"
      ? ", indicating reduced short-term parasympathetic activity"
      : "";
    clauses.push(
      `RMSSD ${rmssd.value} ms is within the ${bandLabel} reference range for ${sexLabel} aged ${findings.ageBand}${pctStr}${vagalText}.`
    );
  }

  if (fd.lfhfRatio !== undefined) {
    clauses.push(
      `The frequency-domain pattern shows ${describeLfhfInSentence(fd.lfhfRatio)}, with an LF/HF ratio of ${fd.lfhfRatio}.`
    );
  }

  const summaryParts: string[] = [];
  if (sdnn.value !== undefined && sdnn.band !== "unclassified") {
    summaryParts.push(describeVariability(sdnn.variabilityStatus));
  }
  const parasympatheticShift = profile?.label.endsWith("parasympathetic-direction shift") ?? false;
  if (rmssd.value !== undefined && rmssd.vagalStatus !== "unclassified" && !parasympatheticShift) {
    summaryParts.push(describeParasympathetic(rmssd.vagalStatus));
  }
  if (profile) {
    summaryParts.push(`a ${profile.label.toLowerCase()}`);
  }
  if (summaryParts.length > 0) {
    const last = summaryParts[summaryParts.length - 1];
    const rest = summaryParts.slice(0, -1);
    const body = rest.length === 0 ? last : `${rest.join(", ")} and ${last}`;
    clauses.push(`The recording shows ${body}.`);
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
  return renderAnalysis(findings);
}

export function buildSummary(
  findings: HrvFindings
): string {
  return renderAnalysis(findings);
}

export function interpretHrv(input: MeasurementInput): HrvInterpretation {
  const findings = deriveHrvFindings(input);

  const metrics = renderMetricDescriptions(findings);
  const conclusion = findings.referenceAvailable
    ? buildConclusion(findings)
    : findings.referenceCompatibility && findings.referenceCompatibility.reasons.length > 0
      ? "The recording does not match the five-minute supine DanFunD reference conditions, so the values are described without reference-percentile placement or an Autonomic Pattern Score. Interpret the HRV values descriptively and together with the clinical context."
      : "The entered values cannot be placed within an age- and sex-specific reference distribution. Interpret the values descriptively and together with the clinical context.";

  return {
    summary: conclusion,
    metrics,
    overall: conclusion,
    limitations: [],
    clinicalNote: CLINICAL_NOTE,
    referenceAvailable: findings.referenceAvailable,
    referenceNote: findings.referenceNote,
    referenceCompatibility: findings.referenceCompatibility,
    safetyMessage: "",
    engineVersion: ANALYSIS_ENGINE_VERSION,
    referenceDatasetVersion: REFERENCE_DATASET_VERSION,
    autonomicProfile: findings.autonomicProfile,
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
