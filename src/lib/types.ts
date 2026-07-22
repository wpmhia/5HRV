import type { PercentileCategory } from "@/data/hrvReferenceData";

export type ReferenceSex = "female" | "male" | "none";

export type MeasurementSource =
  | "ecg"
  | "ecg_chest_strap"
  | "ppg"
  | "smartwatch"
  | "unknown";

export type Position = "supine" | "seated" | "standing" | "unknown";

export type Rhythm =
  | "sinus"
  | "frequent_ectopy"
  | "af_flutter"
  | "paced"
  | "unknown";

export type ArtefactCorrection = "completed" | "not_completed" | "unknown";

export type Confidence = "high" | "moderate" | "low" | "not-valid";

export type MeasurementInput = {
  age: number;
  referenceSex: ReferenceSex;
  measurementSource: MeasurementSource;
  durationMinutes: number;
  position: Position;
  rhythm: Rhythm;
  artefactCorrection: ArtefactCorrection;
  meanHeartRate?: number;
  rmssd?: number;
  sdnn?: number;
  pnn50?: number;
  hfPower?: number;
  lfPower?: number;
  lfhfRatio?: number;
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
};

export type HrvInterpretation = {
  confidence: Confidence;
  confidenceLabel: string;
  confidenceReasons: string[];
  summary: string;
  metrics: MetricResult[];
  overall: string;
  limitations: string[];
  clinicalNote: string;
  referenceAvailable: boolean;
  referenceNote?: string;
  lfhfWarning?: string;
  safetyMessage: string;
};

export { type PercentileCategory };
