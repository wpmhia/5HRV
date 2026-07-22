export type ParsedReportValues = {
  recordingDate?: string;
  durationMinutes?: number;
  samplingFrequency?: number;
  totalBeats?: number;
  meanHeartRate?: number;
  sdnn?: number;
  rmssd?: number;
  pnn50?: number;
  hfPower?: number;
  lfPower?: number;
  lfhfRatio?: number;
  vlfPower?: number;
  rhythm?: string;
  artefactInfo?: string;
};

export type ExtractedField = {
  key: keyof ParsedReportValues;
  label: string;
  value: number | string | undefined;
  unit: string;
  status: "found" | "not_found" | "verify";
};

function normalizeNum(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function parseDurationSeconds(text: string): number | null {
  const patterns = [
    /(?:sample\s*length|duration|recording\s*duration)\s*[:=]?\s*(\d+)\s*s(?:ec(?:onds?)?)?\b/i,
    /(?:sample\s*length|duration|recording\s*duration)\s*[:=]?\s*(\d+)\s*seconds\b/i,
    /(\d+(?:[.,]\d+)?)\s*(?:min(?:ute)?s?)\b/i,
    /(\d+)\s*s\b(?!hz)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].replace(",", ".");
      const num = Number(raw);
      if (Number.isFinite(num) && num > 0) {
        if (pattern.toString().includes("min")) return num;
        return num / 60;
      }
    }
  }
  return null;
}

export function parseHrvReport(text: string): ParsedReportValues {
  const values: ParsedReportValues = {};
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Recording date
    if (!values.recordingDate) {
      const dateMatch = trimmed.match(
        /(?:recording\s*date|date\s*of\s*recording|acquired|recorded)\s*[:=]?\s*(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})/i
      );
      if (dateMatch) values.recordingDate = dateMatch[1];
    }

    // Duration
    if (values.durationMinutes === undefined) {
      const dur = parseDurationSeconds(trimmed);
      if (dur !== null) values.durationMinutes = Math.round(dur * 100) / 100;
    }

    // Sampling frequency
    if (values.samplingFrequency === undefined) {
      const freqMatch = trimmed.match(
        /(?:sampling\s*freq|frequency|sample\s*rate|freq)\s*[:=]?\s*(\d+)\s*hz\b/i
      );
      if (freqMatch) {
        const num = Number(freqMatch[1]);
        if (Number.isFinite(num) && num > 0) values.samplingFrequency = num;
      }
    }

    // Total beats / RR intervals
    if (values.totalBeats === undefined) {
      const beatsMatch = trimmed.match(
        /(?:total\s*(?:beats|rr\s*intervals?)|beats|intervals?)\s*[:=]?\s*(\d+)/i
      );
      if (beatsMatch) {
        const num = Number(beatsMatch[1]);
        if (Number.isFinite(num) && num > 0) values.totalBeats = num;
      }
    }

    // Mean / Average heart rate
    if (values.meanHeartRate === undefined) {
      const hrPatterns = [
        /(?:average|mean)\s*hr\b\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /(?:average|mean)\s*heart\s*rate\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /hr\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*bpm/i,
      ];
      for (const pat of hrPatterns) {
        const m = trimmed.match(pat);
        if (m) {
          const num = normalizeNum(m[1]);
          if (num !== null && num > 0) {
            values.meanHeartRate = num;
            break;
          }
        }
      }
    }

    // SDNN
    if (values.sdnn === undefined) {
      const sdnnPatterns = [
        /sd\s*nn\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /sdnn\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
      ];
      for (const pat of sdnnPatterns) {
        const m = trimmed.match(pat);
        if (m) {
          const num = normalizeNum(m[1]);
          if (num !== null && num > 0) {
            values.sdnn = num;
            break;
          }
        }
      }
    }

    // RMSSD / rMSSD
    if (values.rmssd === undefined) {
      const rmssdPatterns = [
        /rms\s*sd\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /r?mssd\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
      ];
      for (const pat of rmssdPatterns) {
        const m = trimmed.match(pat);
        if (m) {
          const num = normalizeNum(m[1]);
          if (num !== null && num > 0) {
            values.rmssd = num;
            break;
          }
        }
      }
    }

    // pNN50 / PNN50
    if (values.pnn50 === undefined) {
      const pnnPatterns = [
        /pnn50\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /pnn50\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*%/i,
        /percent\s*of\s*nn\s*>\s*50\s*ms\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
      ];
      for (const pat of pnnPatterns) {
        const m = trimmed.match(pat);
        if (m && m[1]) {
          const val = normalizeNum(m[1]);
          if (val !== null) {
            values.pnn50 = val;
            break;
          }
        }
      }
    }

    // HF power
    if (values.hfPower === undefined) {
      const hfPatterns = [
        /hf\s*power\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /hf\b(?!\s*\/\s*hf)(?!\s*power)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /high\s*frequency\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
      ];
      for (const pat of hfPatterns) {
        const m = trimmed.match(pat);
        if (m) {
          const num = normalizeNum(m[1]);
          if (num !== null && num >= 0) {
            values.hfPower = num;
            break;
          }
        }
      }
    }

    // LF power
    if (values.lfPower === undefined) {
      const lfPatterns = [
        /lf\s*power\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /lf\b(?!\s*\/\s*hf)(?!\s*power)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /low\s*frequency\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
      ];
      for (const pat of lfPatterns) {
        const m = trimmed.match(pat);
        if (m) {
          const num = normalizeNum(m[1]);
          if (num !== null && num >= 0) {
            values.lfPower = num;
            break;
          }
        }
      }
    }

    // LF/HF ratio
    if (values.lfhfRatio === undefined) {
      const lfhfPatterns = [
        /lf\s*\/\s*hf\s*(?:ratio)?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /lf-hf\s*ratio\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /lf\/hf\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
      ];
      for (const pat of lfhfPatterns) {
        const m = trimmed.match(pat);
        if (m) {
          const num = normalizeNum(m[1]);
          if (num !== null && num >= 0) {
            values.lfhfRatio = num;
            break;
          }
        }
      }
    }

    // VLF power
    if (values.vlfPower === undefined) {
      const vlfPatterns = [
        /vlf\s*power\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /vlf\b\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
      ];
      for (const pat of vlfPatterns) {
        const m = trimmed.match(pat);
        if (m) {
          const num = normalizeNum(m[1]);
          if (num !== null && num >= 0) {
            values.vlfPower = num;
            break;
          }
        }
      }
    }

    // Rhythm information
    if (!values.rhythm) {
      const rhythmMatch = trimmed.match(
        /(?:rhythm|rhythm\s*analysis)\s*[:=]?\s*(sinus|af|atrial\s*fibrillation|paced|ectop)/i
      );
      if (rhythmMatch) values.rhythm = rhythmMatch[1];
    }

    // Artefact information
    if (!values.artefactInfo) {
      const artefactMatch = trimmed.match(
        /(?:artefact|artifact|ectopic)\s*(?:correction|removal|beats?)?\s*[:=]?\s*(completed|yes|no|not\s*completed|unknown|\d+)/i
      );
      if (artefactMatch) values.artefactInfo = artefactMatch[1];
    }
  }

  return values;
}

export function buildExtractedFields(values: ParsedReportValues): ExtractedField[] {
  const fields: ExtractedField[] = [
    {
      key: "durationMinutes",
      label: "Recording duration",
      value: values.durationMinutes,
      unit: "min",
      status: values.durationMinutes !== undefined ? "found" : "not_found",
    },
    {
      key: "meanHeartRate",
      label: "Mean heart rate",
      value: values.meanHeartRate,
      unit: "bpm",
      status: values.meanHeartRate !== undefined ? "found" : "not_found",
    },
    {
      key: "rmssd",
      label: "RMSSD",
      value: values.rmssd,
      unit: "ms",
      status: values.rmssd !== undefined ? "found" : "not_found",
    },
    {
      key: "sdnn",
      label: "SDNN",
      value: values.sdnn,
      unit: "ms",
      status: values.sdnn !== undefined ? "found" : "not_found",
    },
    {
      key: "pnn50",
      label: "pNN50",
      value: values.pnn50,
      unit: "%",
      status: values.pnn50 !== undefined ? "found" : "not_found",
    },
    {
      key: "hfPower",
      label: "HF power",
      value: values.hfPower,
      unit: "ms²",
      status: values.hfPower !== undefined ? "found" : "not_found",
    },
    {
      key: "lfPower",
      label: "LF power",
      value: values.lfPower,
      unit: "ms²",
      status: values.lfPower !== undefined ? "found" : "not_found",
    },
    {
      key: "lfhfRatio",
      label: "LF/HF ratio",
      value: values.lfhfRatio,
      unit: "",
      status: values.lfhfRatio !== undefined ? "found" : "not_found",
    },
    {
      key: "samplingFrequency",
      label: "Sampling frequency",
      value: values.samplingFrequency,
      unit: "Hz",
      status: values.samplingFrequency !== undefined ? "found" : "not_found",
    },
    {
      key: "vlfPower",
      label: "VLF power",
      value: values.vlfPower,
      unit: "ms²",
      status: values.vlfPower !== undefined ? "found" : "not_found",
    },
    {
      key: "totalBeats",
      label: "Total beats",
      value: values.totalBeats,
      unit: "",
      status: values.totalBeats !== undefined ? "found" : "not_found",
    },
    {
      key: "recordingDate",
      label: "Recording date",
      value: values.recordingDate,
      unit: "",
      status: values.recordingDate !== undefined ? "found" : "not_found",
    },
    {
      key: "rhythm",
      label: "Rhythm",
      value: values.rhythm,
      unit: "",
      status: values.rhythm !== undefined ? "found" : "not_found",
    },
    {
      key: "artefactInfo",
      label: "Artefact correction",
      value: values.artefactInfo,
      unit: "",
      status: values.artefactInfo !== undefined ? "found" : "not_found",
    },
  ];
  return fields;
}
