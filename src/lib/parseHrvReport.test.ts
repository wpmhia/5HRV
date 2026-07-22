import { describe, it, expect } from "vitest";
import { parseHrvReport, hasHrvContent } from "@/lib/parseHrvReport";

describe("parseHrvReport", () => {
  it("extracts all values from example report", () => {
    const text = `Sample Length 322s
Frequency: 1000Hz
Average HR: 74
SDNN: 39.33
rMSSD: 23.14
LF: 416.47
HF: 70.55
LF/HF: 5.90
pNN50 3.28%`;

    const result = parseHrvReport(text);
    expect(result.samplingFrequency).toBe(1000);
    expect(result.sdnn).toBeCloseTo(39.33, 1);
    expect(result.rmssd).toBeCloseTo(23.14, 1);
    expect(result.lfPower).toBeCloseTo(416.47, 1);
    expect(result.hfPower).toBeCloseTo(70.55, 1);
    expect(result.lfhfRatio).toBeCloseTo(5.90, 1);
    expect(result.pnn50).toBeCloseTo(3.28, 1);
  });

  it("maps rMSSD to RMSSD", () => {
    const result = parseHrvReport("rMSSD: 23.14");
    expect(result.rmssd).toBeCloseTo(23.14, 1);
  });

  it("maps RMS SD to RMSSD", () => {
    const result = parseHrvReport("RMS SD: 23.14");
    expect(result.rmssd).toBeCloseTo(23.14, 1);
  });

  it("maps PNN50 to pNN50", () => {
    const result = parseHrvReport("PNN50: 3.28%");
    expect(result.pnn50).toBeCloseTo(3.28, 1);
  });

  it("maps Percent of NN >50 ms", () => {
    const result = parseHrvReport("Percent of NN >50 ms: 3.28");
    expect(result.pnn50).toBeCloseTo(3.28, 1);
  });

  it("handles decimal commas", () => {
    const result = parseHrvReport("SDNN: 39,33");
    expect(result.sdnn).toBeCloseTo(39.33, 1);
  });

  it("handles SD NN label", () => {
    const result = parseHrvReport("SD NN: 39.33");
    expect(result.sdnn).toBeCloseTo(39.33, 1);
  });

  it("detects missing values when report has minimal data", () => {
    const result = parseHrvReport("Some random text without HRV values");
    expect(result.rmssd).toBeUndefined();
    expect(result.sdnn).toBeUndefined();
  });

  it("does not extract patient name", () => {
    const result = parseHrvReport("Patient: John Doe\nSDNN: 39.33");
    expect(result.sdnn).toBeCloseTo(39.33, 1);
  });

  it("extracts recording date", () => {
    const result = parseHrvReport("Recording date: 2024-03-15\nSDNN: 39.33");
    expect(result.recordingDate).toBe("2024-03-15");
  });

  it("extracts VLF power", () => {
    const result = parseHrvReport("VLF power: 150.5");
    expect(result.vlfPower).toBeCloseTo(150.5, 1);
  });

  it("extracts total beats", () => {
    const result = parseHrvReport("Total beats: 400");
    expect(result.totalBeats).toBe(400);
  });

  it("extracts sampling frequency", () => {
    const result = parseHrvReport("Sampling frequency: 1000 Hz");
    expect(result.samplingFrequency).toBe(1000);
  });

  it("handles LF / HF with space", () => {
    const result = parseHrvReport("LF / HF: 2.5");
    expect(result.lfhfRatio).toBe(2.5);
  });

  it("handles LF-HF ratio label", () => {
    const result = parseHrvReport("LF-HF ratio: 3.1");
    expect(result.lfhfRatio).toBe(3.1);
  });

  it("handles High Frequency label", () => {
    const result = parseHrvReport("High Frequency: 100.5");
    expect(result.hfPower).toBeCloseTo(100.5, 1);
  });

  it("handles Low Frequency label", () => {
    const result = parseHrvReport("Low Frequency: 350.2");
    expect(result.lfPower).toBeCloseTo(350.2, 1);
  });
});

describe("hasHrvContent", () => {
  it("returns true when two markers present (RMSSD + SDNN)", () => {
    expect(hasHrvContent("RMSSD: 23.14 SDNN: 39.33")).toBe(true);
  });
  it("returns true when two markers present (SDNN + pNN50)", () => {
    expect(hasHrvContent("SDNN: 39.33 pNN50: 3.28")).toBe(true);
  });
  it("returns false for a single marker alone", () => {
    expect(hasHrvContent("RMSSD: 23.14")).toBe(false);
  });
  it("returns false for a single marker (LF/HF)", () => {
    expect(hasHrvContent("LF/HF: 2.5")).toBe(false);
  });
  it("returns false for non-HRV text", () => {
    expect(hasHrvContent("Grocery list: milk, eggs, bread.")).toBe(false);
  });
  it("returns false for empty text", () => {
    expect(hasHrvContent("")).toBe(false);
  });
  it("accepts HF + SDNN together", () => {
    expect(hasHrvContent("HF: 70.55 SDNN: 39.33")).toBe(true);
  });
  it("accepts LF + RMSSD together", () => {
    expect(hasHrvContent("LF: 416.47 RMSSD: 23.14")).toBe(true);
  });
  it("still requires a numeric value after the label", () => {
    expect(hasHrvContent("SDNN was measured but no value given")).toBe(false);
  });
});

describe("text-based PDF extraction path", () => {
  it("parser handles text from a text-based PDF", () => {
    const simulatedPdfText = `Sample Length 322s
Frequency: 1000Hz
Average HR: 74
SDNN: 39.33
rMSSD: 23.14
pNN50 3.28%
LF: 416.47
HF: 70.55
LF/HF: 5.90`;
    const result = parseHrvReport(simulatedPdfText);
    expect(result.sdnn).toBeCloseTo(39.33, 1);
    expect(result.rmssd).toBeCloseTo(23.14, 1);
    expect(result.pnn50).toBeCloseTo(3.28, 1);
    expect(result.lfPower).toBeCloseTo(416.47, 1);
    expect(result.hfPower).toBeCloseTo(70.55, 1);
    expect(result.lfhfRatio).toBeCloseTo(5.90, 1);
    expect(result.samplingFrequency).toBe(1000);
  });
});

describe("PDF OCR fallback path", () => {
  it("hasHrvContent returns false for scanned PDF text (no clear labels)", () => {
    expect(hasHrvContent("lorem ipsum dolor sit amet")).toBe(false);
  });
  it("hasHrvContent returns false for a single label from OCR", () => {
    expect(hasHrvContent("SDNN 39.33 ms")).toBe(false);
  });
  it("hasHrvContent returns true when OCR recovers two or more labels", () => {
    expect(hasHrvContent("SDNN 39.33 ms RMSSD 23.14 ms")).toBe(true);
  });
});

describe("JPG/PNG OCR path", () => {
  it("hasHrvContent detects two labels that OCR would produce from a report image", () => {
    const ocrText = `Sample Length 322s
SDNN 39.33
rMSSD 23.14`;
    expect(hasHrvContent(ocrText)).toBe(true);
    const result = parseHrvReport(ocrText);
    expect(result.sdnn).toBeCloseTo(39.33, 1);
    expect(result.rmssd).toBeCloseTo(23.14, 1);
  });
});

describe("worker termination preservation", () => {
  it("parser works correctly after simulated OCR extraction", () => {
    const result = parseHrvReport("SDNN: 39.33\nRMSSD: 23.14");
    expect(result.sdnn).toBeCloseTo(39.33, 1);
    expect(result.rmssd).toBeCloseTo(23.14, 1);
  });
  it("parser works after simulated OCR failure (empty text)", () => {
    const result = parseHrvReport("");
    expect(result.sdnn).toBeUndefined();
  });
});

describe("VLF / LF edge cases", () => {
  it("does not match LF inside VLF when VLF and LF are on the same line", () => {
    const result = parseHrvReport("VLF : 201.54 LF : 416.47 HF : 70.55");
    expect(result.vlfPower).toBeCloseTo(201.54, 1);
    expect(result.lfPower).toBeCloseTo(416.47, 1);
    expect(result.hfPower).toBeCloseTo(70.55, 1);
  });

  it("parses Caroline report line correctly (regression)", () => {
    const text = `Sample Length 322s
Frequency: 1000Hz
Average HR: 74
SDNN: 39.33
rMSSD: 23.14
VLF : 201.54 LF : 416.47 HF : 70.55
LF/HF: 5.90
pNN50 3.28%`;
    const result = parseHrvReport(text);
    expect(result.vlfPower).toBeCloseTo(201.54, 1);
    expect(result.lfPower).toBeCloseTo(416.47, 1);
    expect(result.hfPower).toBeCloseTo(70.55, 1);
    expect(result.lfhfRatio).toBeCloseTo(5.90, 1);
    expect(result.sdnn).toBeCloseTo(39.33, 1);
    expect(result.rmssd).toBeCloseTo(23.14, 1);
    expect(result.pnn50).toBeCloseTo(3.28, 1);
  });
});

describe("total beats edge cases", () => {
  it("does not extract total beats from chart axis labels", () => {
    const result = parseHrvReport("RR Intervals 200\nTotal beats: 400");
    expect(result.totalBeats).toBe(400);
  });

  it("extracts total beats from explicit 'Total RR intervals' label", () => {
    const result = parseHrvReport("Total RR intervals: 400");
    expect(result.totalBeats).toBe(400);
  });

  it("does not extract total beats from bare 'RR Intervals' chart label", () => {
    const result = parseHrvReport("RR Intervals 200");
    expect(result.totalBeats).toBeUndefined();
  });

  it("does not extract total beats from 'beats' in unrelated text", () => {
    const result = parseHrvReport("Average HR: 74 beats/min");
    expect(result.totalBeats).toBeUndefined();
  });
});
