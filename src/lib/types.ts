import type { PercentileCategory } from "@/data/hrvReferenceData";

export type ReferenceSex = "female" | "male" | "none";

export type LfhfSource = "calculated" | "manual" | "imported";

export type ReferenceBand = PercentileCategory | "unclassified";

export type VagalStatus =
  | "markedly_reduced"
  | "reduced"
  | "preserved"
  | "high"
  | "very_high"
  | "unclassified";

export type VariabilityStatus =
  | "markedly_reduced"
  | "reduced"
  | "preserved"
  | "high"
  | "very_high"
  | "unclassified";

export type FrequencyDomainPattern =
  | "relative_hf_predominance"
  | "comparable_lf_hf"
  | "relative_lf_predominance"
  | "marked_lf_predominance"
  | "unavailable";

export type RecordingQuality = "good" | "acceptable" | "poor";

export type ReferenceCompatibility = {
  compatible: boolean;
  reference: "danfund" | null;
  reasons: string[];
};

export type RecordingMetadata = {
  recordingDate?: string;
  durationSeconds?: number;
  samplingFrequencyHz?: number;
  totalBeats?: number;
  sourceFilename?: string;
  source?: "bluetooth_rr";
  deviceName?: string;
  posture?: string;
  preparationSeconds?: number;
  correctedIntervals?: number;
  artifactPercentage?: number;
  quality?: RecordingQuality;
  engineVersion?: string;
  protocolCompatible?: boolean;
};

export type MeasurementInput = {
  age: number;
  referenceSex: ReferenceSex;
  rmssd?: number;
  sdnn?: number;
  pnn50?: number;
  hfPower?: number;
  lfPower?: number;
  lfhfRatio?: number;
  lfhfSource?: LfhfSource;
  recording?: RecordingMetadata;
};

export type HrvFindings = {
  age: number;
  referenceSex: ReferenceSex;
  ageBand: string | null;
  referenceAvailable: boolean;
  referenceNote?: string;
  referenceCompatibility?: ReferenceCompatibility;

  rmssd: {
    value?: number;
    band: ReferenceBand;
    estimatedPercentile?: number;
    referencePercentiles?: number[];
    vagalStatus: VagalStatus;
  };

  sdnn: {
    value?: number;
    band: ReferenceBand;
    estimatedPercentile?: number;
    referencePercentiles?: number[];
    variabilityStatus: VariabilityStatus;
  };

  pnn50?: { value: number };

  frequencyDomain: {
    hfPower?: number;
    lfPower?: number;
    lfhfRatio?: number;
    lfhfSource?: LfhfSource;
    pattern: FrequencyDomainPattern;
    lfhfBand?: ReferenceBand;
  };

  autonomicProfile?: AutonomicProfile;
};

export type MetricResult = {
  key: "rmssd" | "sdnn" | "pnn50" | "hf" | "lf" | "lfhf";
  name: string;
  value: number;
  unit: string;
  category?: PercentileCategory;
  categoryLabel?: string;
  referencePercentiles?: number[];
  interpretation: string;
  limitation?: string;
  lfhfSource?: LfhfSource;
};

export type AutonomicConcordance =
  | "concordant_sympathetic_shift"
  | "concordant_parasympathetic_shift"
  | "single_axis_sympathetic_shift"
  | "single_axis_parasympathetic_shift"
  | "mixed"
  | "central";

export type AutonomicProfile = {
  score: number;
  label: string;

  vagal: {
    percentile: number;
    deviationZ: number;
    category: PercentileCategory;
  };

  spectral: {
    percentile: number;
    deviationZ: number;
    category: PercentileCategory;
  };

  totalVariability?: {
    percentile: number;
    category: PercentileCategory;
  };

  concordance: AutonomicConcordance;
  provisional: true;

  vagalWeighted: number;
  spectralWeighted: number;
  combinedDeviation: number;
};

export type HrvInterpretation = {
  summary: string;
  metrics: MetricResult[];
  overall: string;
  limitations: string[];
  clinicalNote: string;
  referenceAvailable: boolean;
  referenceNote?: string;
  referenceCompatibility?: ReferenceCompatibility;
  safetyMessage: string;
  engineVersion: string;
  referenceDatasetVersion: string;
  autonomicProfile?: AutonomicProfile;
  findings: HrvFindings;
};

export { type PercentileCategory };
