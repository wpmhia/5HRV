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

export type RecordingMetadata = {
  recordingDate?: string;
  durationSeconds?: number;
  samplingFrequencyHz?: number;
  totalBeats?: number;
  sourceFilename?: string;
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
  };

  autonomicScore?: {
    value: number;
    label: string;
    rmssdComponent: number;
    lfhfComponent: number;
  };
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

export type AutonomicScore = {
  value: number;
  label: string;
  rmssdComponent: number;
  lfhfComponent: number;
};

export type HrvInterpretation = {
  summary: string;
  metrics: MetricResult[];
  overall: string;
  limitations: string[];
  clinicalNote: string;
  referenceAvailable: boolean;
  referenceNote?: string;
  safetyMessage: string;
  autonomicScore?: AutonomicScore;
  findings: HrvFindings;
};

export { type PercentileCategory };
