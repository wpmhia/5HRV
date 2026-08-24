export type BluetoothMeasurementMetadata = {
  source: "bluetooth_rr";
  deviceName: string;
  posture: "supine";
  preparationSeconds?: number;
  durationSeconds: number;
  totalBeats: number;
  correctedIntervals: number;
  artifactPercentage: number;
  quality: "good" | "acceptable" | "poor";
  engineVersion?: string;
  protocolCompatible?: boolean;
};

export type PowerUnit = "ms2" | "nu" | "percent" | "log";

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
  /** Units detected for the reported LF/HF powers, if not absolute ms². */
  lfhfUnits?: PowerUnit;
  measurement?: BluetoothMeasurementMetadata;
};

function normalizeNum(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function detectPowerUnit(line: string, match: RegExpMatchArray, groupIndex: number): PowerUnit {
  const valueStart = (match.index ?? 0) + match[0].indexOf(match[groupIndex]);
  const valueEnd = valueStart + match[groupIndex].length;
  const label = match[0].slice(0, match[0].indexOf(match[groupIndex])).toLowerCase();
  if (/\b(ln|log)\b/.test(label)) return "log";
  const tail = line.slice(valueEnd, valueEnd + 16).toLowerCase();
  if (/^\s*n\.?\s*u\b/.test(tail) || /^\s*nu\b/.test(tail)) return "nu";
  if (/^\s*%/.test(tail)) return "percent";
  if (/^\s*(ln|log)\b/.test(tail)) return "log";
  return "ms2";
}

export function parseDurationSeconds(text: string): number | null {
  const patterns = [
    { re: /(?:sample\s*length|duration|recording\s*duration)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:min(?:ute)?s?)\b/i, multiplier: 60 },
    { re: /(?:sample\s*length|duration|recording\s*duration)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*s(?:ec(?:onds?)?)?\b/i, multiplier: 1 },
    { re: /(?:sample\s*length|duration|recording\s*duration)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*h(?:ours?)?\b/i, multiplier: 3600 },
    { re: /(\d+(?:[.,]\d+)?)\s*(?:min(?:ute)?s?)\b/i, multiplier: 60 },
    { re: /(\d+(?:[.,]\d+)?)\s*h(?:ours?)?\b/i, multiplier: 3600 },
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

  let hfRaw: number | undefined;
  let lfRaw: number | undefined;
  let hfUnit: PowerUnit | undefined;
  let lfUnit: PowerUnit | undefined;

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
        /(?:sampling\s*freq|frequency|sample\s*rate|freq)\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+)\s*hz\b/i
      );
      if (freqMatch) {
        const num = Number(freqMatch[1]);
        if (Number.isFinite(num) && num > 0) values.samplingFrequency = num;
      }
    }

    // Total beats / RR intervals
    if (values.totalBeats === undefined) {
      const beatsMatch = trimmed.match(
        /(?:total\s*beats|total\s*rr\s*intervals?|aantal\s*rr\s*totaal)\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+)/i
      );
      if (beatsMatch) {
        const num = Number(beatsMatch[1]);
        if (Number.isFinite(num) && num > 0) values.totalBeats = num;
      }
    }

    // SDNN
    if (values.sdnn === undefined) {
      const sdnnPatterns = [
        /sd\s*nn\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /sdnn\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
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
        /rms\s*sd\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /r?mssd\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
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
        /pnn50\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /pnn50\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*%/i,
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
        /hf\s*power\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /(?<![a-z/])hf\b(?!\s*\/\s*hf)(?!\s*power)\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /high\s*frequency\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
      ];
      for (const pat of hfPatterns) {
        const m = trimmed.match(pat);
        if (m) {
          const num = normalizeNum(m[1]);
          if (num !== null && num >= 0) {
            const unit = detectPowerUnit(trimmed, m, 1);
            hfUnit = unit;
            if (unit === "ms2") {
              values.hfPower = num;
            } else {
              hfRaw = num;
            }
            break;
          }
        }
      }
    }

    // LF power
    if (values.lfPower === undefined) {
      const lfPatterns = [
        /lf\s*power\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /(?<![a-z])lf\b(?!\s*\/\s*hf)(?!\s*power)\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /low\s*frequency\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
      ];
      for (const pat of lfPatterns) {
        const m = trimmed.match(pat);
        if (m) {
          const num = normalizeNum(m[1]);
          if (num !== null && num >= 0) {
            const unit = detectPowerUnit(trimmed, m, 1);
            lfUnit = unit;
            if (unit === "ms2") {
              values.lfPower = num;
            } else {
              lfRaw = num;
            }
            break;
          }
        }
      }
    }

    // LF/HF ratio
    if (values.lfhfRatio === undefined) {
      const lfhfPatterns = [
        /lf\s*\/\s*hf\s*(?:ratio)?\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /lf-hf\s*ratio\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
        /lf\/hf\s*(?:\([^)]*\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
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

  // When LF and HF are both reported in a shared normalized unit (n.u. or %),
  // the ratio is still meaningful even though the absolute powers are not.
  if (
    values.lfhfRatio === undefined &&
    hfRaw !== undefined &&
    lfRaw !== undefined &&
    hfRaw > 0 &&
    hfUnit !== undefined &&
    hfUnit === lfUnit &&
    (hfUnit === "nu" || hfUnit === "percent")
  ) {
    values.lfhfRatio = Math.round((lfRaw / hfRaw) * 100) / 100;
    values.lfhfUnits = hfUnit;
  } else if (hfUnit !== undefined && hfUnit !== "ms2") {
    values.lfhfUnits = hfUnit;
  } else if (lfUnit !== undefined && lfUnit !== "ms2") {
    values.lfhfUnits = lfUnit;
  }

  return values;
}

export function hasHrvContent(text: string): boolean {
  const markers = [
    /\brmssd\s*(?:\([^)]*\))?\s*[:=]?\s*\d/i,
    /\bsdnn\s*(?:\([^)]*\))?\s*[:=]?\s*\d/i,
    /\bpnn50\s*(?:\([^)]*\))?\s*[:=]?\s*\d/i,
    /\blf\s*\/\s*hf\s*(?:\([^)]*\))?\s*[:=]?\s*\d/i,
    /(?<!\/)\bhf(?:\s+power)?\s*(?:\([^)]*\))?\s*[:=]?\s*\d/i,
    /(?<!\/)\blf(?:\s+power)?\s*(?:\([^)]*\))?\s*[:=]?\s*\d/i,
  ];
  return markers.filter((p) => p.test(text)).length >= 2;
}
