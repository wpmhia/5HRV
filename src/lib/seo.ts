export const siteConfig = {
  name: "5HRV",
  title: "5HRV – Measure and interpret five-minute HRV with Polar H10",
  description:
    "Measure five-minute HRV directly with Polar H10 or analyse existing HRV values. 5HRV calculates RMSSD, SDNN, pNN50, LF, HF and LF/HF locally and interprets them using age- and sex-specific reference data.",
  url: "https://5hrv.com",
  ogImage: "/og-image.png",
  author: "Willem Gielen",
  keywords: [
    "HRV",
    "heart rate variability",
    "five-minute HRV",
    "autonomic nervous system",
    "RMSSD",
    "SDNN",
    "HRV interpretation framework",
    "autonomic function",
    "parasympathetic",
    "sympathetic",
    "HRV calculator",
    "DanFunD",
    "Polar H10",
    "Polar H10 HRV",
    "HRV measurement",
    "RR interval analysis",
    "supine HRV",
    "Bluetooth HRV",
  ],
};

export const pages = {
  home: {
    title: siteConfig.title,
    description: siteConfig.description,
  },
  about: {
    title: "About – 5HRV Framework",
    description:
      "Scientific background of the five-minute HRV interpretation framework developed by Willem Gielen, Cardiologist and Internist.",
  },
  applications: {
    title: "Applications – 5HRV",
    description:
      "How standardized five-minute HRV analysis is applied in research on autonomic function, POTS, ME/CFS, Long COVID, and cardiometabolic conditions.",
  },
  calculator: {
    title: "Polar H10 HRV Measurement and Calculator – 5HRV",
    description:
      "Connect a Polar H10 for a guided supine five-minute HRV measurement, or upload and enter existing values. HRV calculations run locally in the browser.",
  },
  calculatorResult: {
    title: "HRV Interpretation Result – 5HRV",
    description:
      "Structured scientific analysis of five-minute HRV measurements with Autonomic Pattern Score, percentile-based metric placement, and scientific summary.",
  },
  evidence: {
    title: "Evidence – 5HRV",
    description:
      "Peer-reviewed references supporting the measurement and scientific interpretation of five-minute heart rate variability analysis.",
  },
  interpretation: {
    title: "Scientific Analysis Framework – 5HRV",
    description:
      "A structured framework for interpreting short-term HRV measurements using age- and sex-specific reference percentiles from the DanFunD population study.",
  },
  methodology: {
    title: "Methodology – 5HRV",
    description:
      "How the 5HRV scientific calculator works: reference populations (DanFunD), percentile interpolation, the Autonomic Pattern Score algorithm, scope and limitations.",
  },
  method: {
    title: "The 5-Minute Method – 5HRV",
    description:
      "A standardized measurement protocol for recording and interpreting short-term heart rate variability, covering ECG acquisition, NN intervals, artefact handling, and frequency-domain analysis.",
  },
  parameters: {
    title: "HRV Parameters – 5HRV",
    description:
      "Detailed guide to heart rate variability metrics used in standardized five-minute HRV analysis: RMSSD, SDNN, pNN50, HF power, LF power, and LF/HF ratio.",
  },
};
