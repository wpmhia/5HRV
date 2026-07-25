export const hrvReferenceData = {
  male: {
    "18-29": {
      sdnn: [24.45, 39.33, 52.02, 69.71, 112.10],
      rmssd: [16.77, 34.43, 51.14, 73.90, 128.80]
    },
    "30-39": {
      sdnn: [23.50, 32.86, 42.71, 58.28, 95.73],
      rmssd: [17.87, 28.38, 39.96, 58.87, 105.80]
    },
    "40-49": {
      sdnn: [15.86, 24.80, 34.04, 45.83, 75.14],
      rmssd: [11.64, 19.92, 29.95, 43.84, 81.32]
    },
    "50-59": {
      sdnn: [11.18, 18.69, 26.09, 36.85, 56.43],
      rmssd: [7.44, 14.67, 22.74, 33.33, 59.92]
    },
    "60-72": {
      sdnn: [8.34, 14.73, 19.92, 27.72, 54.97],
      rmssd: [6.04, 11.93, 17.02, 25.18, 53.64]
    }
  },
  female: {
    "18-29": {
      sdnn: [22.50, 36.76, 52.54, 74.06, 123.49],
      rmssd: [18.88, 35.39, 57.19, 83.87, 171.26]
    },
    "30-39": {
      sdnn: [19.64, 30.70, 41.50, 55.67, 103.11],
      rmssd: [16.79, 28.95, 40.37, 62.52, 118.23]
    },
    "40-49": {
      sdnn: [16.13, 25.48, 34.16, 46.03, 73.90],
      rmssd: [13.27, 22.90, 32.77, 48.62, 83.03]
    },
    "50-59": {
      sdnn: [12.27, 20.75, 28.07, 37.38, 60.60],
      rmssd: [9.45, 17.94, 25.04, 35.73, 62.59]
    },
    "60-72": {
      sdnn: [9.00, 14.55, 20.20, 28.36, 47.01],
      rmssd: [6.79, 12.19, 17.89, 25.83, 51.77]
    }
  }
} as const;

export type ReferenceSex = "male" | "female";

export const ageBands = ["18-29", "30-39", "40-49", "50-59", "60-72"] as const;
export type AgeBand = (typeof ageBands)[number];

export function getAgeBand(age: number): AgeBand | null {
  if (age >= 18 && age <= 29) return "18-29";
  if (age >= 30 && age <= 39) return "30-39";
  if (age >= 40 && age <= 49) return "40-49";
  if (age >= 50 && age <= 59) return "50-59";
  if (age >= 60 && age <= 72) return "60-72";
  return null;
}

export function classifyPercentile(value: number, percentiles: readonly number[]): PercentileCategory {
  const [p5, p25, _p50, p75, p95] = percentiles;

  if (value < p5) return "below_p5";
  if (value < p25) return "p5_to_p25";
  if (value <= p75) return "p25_to_p75";
  if (value <= p95) return "p75_to_p95";
  return "above_p95";
}

export type PercentileCategory =
  | "below_p5"
  | "p5_to_p25"
  | "p25_to_p75"
  | "p75_to_p95"
  | "above_p95";

export const percentileLabels: Record<PercentileCategory, string> = {
  below_p5: "Very low \u00B7 below P5",
  p5_to_p25: "Low \u00B7 P5\u2013P25",
  p25_to_p75: "Typical \u00B7 P25\u2013P75",
  p75_to_p95: "High \u00B7 P75\u2013P95",
  above_p95: "Very high \u00B7 above P95",
};

export const percentileExplanations: Record<PercentileCategory, string> = {
  below_p5:
    "The value is below the fifth percentile for the selected age and reference-sex group. This is a nonspecific finding and may reflect physiology, acute illness, medication, measurement conditions or recording quality.",
  p5_to_p25:
    "The value falls between the 5th and 25th percentiles of the selected age- and sex-specific reference distribution.",
  p25_to_p75:
    "The value falls within the central 50% of the selected age- and sex-specific reference distribution.",
  p75_to_p95:
    "The value falls between the 75th and 95th percentiles of the selected age- and sex-specific reference distribution.",
  above_p95:
    "The value is above the 95th percentile of the selected reference distribution. Higher HRV is not automatically better; rhythm, ectopy, breathing and artefact correction should be reviewed.",
};
