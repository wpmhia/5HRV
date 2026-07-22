export type ReferenceSex = "male" | "female" | "none";

export type MeasurementSource =
  | "ecg"
  | "ecg_chest_strap"
  | "ppg"
  | "smartwatch"
  | "unknown";

export type Position = "supine" | "seated" | "standing" | "unknown";

export type BreathingType =
  | "spontaneous"
  | "paced"
  | "irregular"
  | "unknown";

export type RestBefore =
  | "at_least_5"
  | "less_than_5"
  | "unknown";

export type ArtefactCorrection =
  | "completed"
  | "not_completed"
  | "unknown";

export type Confidence = "high" | "moderate" | "low" | "not-interpretable";

export type PercentileCategory =
  | "below_p5"
  | "p5_to_p25"
  | "p25_to_p75"
  | "p75_to_p95"
  | "above_p95";

export type MetricInterpretation = {
  value: number;
  unit: string;
  percentileCategory?: PercentileCategory;
  label: string;
  explanation: string;
  limitation?: string;
};

export type HrvInterpretation = {
  confidence: Confidence;
  confidenceReasons: string[];
  summary: string;
  rmssdInterpretation?: MetricInterpretation;
  sdnnInterpretation?: MetricInterpretation;
  pnn50Interpretation?: MetricInterpretation;
  hfInterpretation?: MetricInterpretation;
  lfInterpretation?: MetricInterpretation;
  lfhfInterpretation?: MetricInterpretation;
  spectralInterpretation?: string;
  trendInterpretation?: string;
  limitations: string[];
  safetyMessage: string;
  notInterpretableReason?: string;
};

export type MeasurementInput = {
  age: number;
  referenceSex: ReferenceSex;

  symptoms: string[];
  medications: string[];

  measurementSource: MeasurementSource;
  recordingDuration: number;
  position: Position;
  breathing: BreathingType;
  respiratoryRate?: number;
  restBefore: RestBefore;
  artefactCorrection: ArtefactCorrection;
  rhythmConditions: string[];
  samplingRate?: number;
  comparableRecording: boolean;

  meanHeartRate?: number;
  rmssd?: number;
  sdnn?: number;
  pnn50?: number;
  hfPower?: number;
  lfPower?: number;
  lfhfRatio?: number;

  baselineRmssd?: number;
};

export type StoredMeasurement = {
  id: string;
  date: string;
  input: MeasurementInput;
  interpretation: HrvInterpretation;
};
