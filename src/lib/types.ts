import type { PercentileCategory } from "@/data/hrvReferenceData";

export type ReferenceSex = "female" | "male" | "none";

export type LfhfSource = "calculated" | "manual" | "imported";

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
};

export { type PercentileCategory };
