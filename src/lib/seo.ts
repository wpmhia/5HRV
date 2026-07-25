export const siteConfig = {
  name: "5HRV",
  title: "5HRV – Five-minute heart rate variability analysis for clinicians and researchers",
  description:
    "A practical clinical and research framework for assessing autonomic function from a standardized five-minute HRV recording. Developed by Willem Gielen.",
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
    "clinical HRV interpretation",
    "autonomic function",
    "parasympathetic",
    "sympathetic",
    "HRV calculator",
    "DanFunD",
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
      "Clinical and scientific background of the five-minute HRV interpretation framework developed by Willem Gielen, Cardiologist and Internist.",
  },
  applications: {
    title: "Clinical Applications – 5HRV",
    description:
      "How standardized five-minute HRV assessment is applied in clinical practice and research across autonomic dysfunction, POTS, ME/CFS, Long COVID, and cardiometabolic conditions.",
  },
  calculator: {
    title: "HRV Calculator – 5HRV",
    description:
      "Enter RMSSD, SDNN, pNN50, HF and LF values to receive a structured clinical interpretation based on age- and sex-specific DanFunD reference percentiles.",
  },
  calculatorResult: {
    title: "HRV Interpretation Result – 5HRV",
    description:
      "Structured clinical interpretation of five-minute HRV measurements with autonomic score, percentile-based metric placement, and clinical summary.",
  },
  evidence: {
    title: "Evidence – 5HRV",
    description:
      "Peer-reviewed references supporting the measurement, interpretation and clinical application of five-minute heart rate variability analysis.",
  },
  interpretation: {
    title: "Clinical Interpretation Framework – 5HRV",
    description:
      "A structured framework for interpreting short-term HRV measurements using age- and sex-specific reference percentiles from the DanFunD population study.",
  },
  method: {
    title: "The 5-Minute Method – 5HRV",
    description:
      "A standardized clinical protocol for recording and interpreting short-term heart rate variability, covering ECG acquisition, NN intervals, artefact handling, and frequency-domain analysis.",
  },
  parameters: {
    title: "HRV Parameters – 5HRV",
    description:
      "Detailed guide to heart rate variability metrics used in standardized five-minute assessment: RMSSD, SDNN, pNN50, HF power, LF power, and LF/HF ratio.",
  },
};
