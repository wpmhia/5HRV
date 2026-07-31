export type PolarMeasurementMetadata = {
  source: "polar_h10";
  deviceName: string;
  posture: "supine";
  preparationSeconds: number;
  durationSeconds: number;
  totalBeats: number;
  correctedIntervals: number;
  artifactPercentage: number;
  quality: "good" | "acceptable" | "poor";
};

export type ParsedReportValues = {
  recordingDate?: string;
  durationSeconds?: number;
  samplingFrequency?: number;
  totalBeats?: number;
  sdnn?: number;
  rmssd?: number;
  pnn50?: number;
  hfPower?: number;
  lfPower?: number;
  lfhfRatio?: number;
  measurement?: PolarMeasurementMetadata;
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
    { re: /(?:sample\s*length|duration|recording\s*duration)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:min(?:ute)?s?)\b/i, multiplier: 60 },
    { re: /(?:sample\s*length|duration|recording\s*duration)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*s(?:ec(?:onds?)?)?\b/i, multiplier: 1 },
    { re: /(\d+(?:[.,]\d+)?)\s*(?:min(?:ute)?s?)\b/i, multiplier: 60 },
    { re: /(\d+)\s*s\b(?!hz)/i, multiplier: 1 },
  ];
  for (const { re, multiplier } of patterns) {
    const match = text.match(re);
    if (match) {
      const raw = match[1].replace(",", ".");
      const num = Number(raw);
      if (Number.isFinite(num) && num > 0) {
        return Math.round(num * multiplier);
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

    // Duration (must be before general number patterns)
    if (values.durationSeconds === undefined) {
      const dur = parseDurationSeconds(trimmed);
      if (dur !== null) values.durationSeconds = dur;
    }

    // Recording date
    if (!values.recordingDate) {
      const dateMatch = trimmed.match(
        /(?:recording\s*date|date\s*of\s*recording|acquired|recorded)\s*[:=]?\s*(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})/i
      );
      if (dateMatch) values.recordingDate = dateMatch[1];
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
        /(?:total\s*beats|total\s*rr\s*intervals?|aantal\s*rr\s*totaal)\s*[:=]?\s*(\d+)/i
      );
      if (beatsMatch) {
        const num = Number(beatsMatch[1]);
        if (Number.isFinite(num) && num > 0) values.totalBeats = num;
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
        /(?<![a-z/])hf\b(?!\s*\/\s*hf)(?!\s*power)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
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
        /(?<![a-z])lf\b(?!\s*\/\s*hf)(?!\s*power)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
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

  }

  return values;
}

export function hasHrvContent(text: string): boolean {
  const markers = [
    /\brmssd\s*[:=]?\s*\d/i,
    /\bsdnn\s*[:=]?\s*\d/i,
    /\bpnn50\s*[:=]?\s*\d/i,
    /\blf\s*\/\s*hf\s*[:=]?\s*\d/i,
    /(?<!\/)\bhf(?:\s+power)?\s*[:=]?\s*\d/i,
    /(?<!\/)\blf(?:\s+power)?\s*[:=]?\s*\d/i,
  ];
  return markers.filter((p) => p.test(text)).length >= 2;
}