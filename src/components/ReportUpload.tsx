"use client";

import { useRef, useState } from "react";
import { parseHrvReport, buildExtractedFields, type ParsedReportValues, type ExtractedField } from "@/lib/parseHrvReport";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

type Props = {
  onPrefill: (values: ParsedReportValues) => void;
  onClose: () => void;
};

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

async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
}

async function ocrWithTesseract(image: string | HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    pages.push(text);
  }
  return pages.join("\n");
}

async function renderFirstPageToCanvas(buffer: ArrayBuffer): Promise<HTMLCanvasElement> {
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, viewport }).promise;
  return canvas;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const text = await extractPdfText(buffer);
  if (text.trim() && hasHrvContent(text)) return text;
  const canvas = await renderFirstPageToCanvas(buffer);
  return await ocrWithTesseract(canvas);
}

async function extractTextFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = await ocrWithTesseract(reader.result as string);
        resolve(text);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return await extractTextFromPdf(file);
  }

  if (ext === "jpg" || ext === "jpeg" || ext === "png") {
    return await extractTextFromImage(file);
  }

  throw new Error("Unsupported file type. Please upload a PDF, JPG, JPEG or PNG file.");
}

export function ReportUpload({ onPrefill, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fields, setFields] = useState<ExtractedField[] | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "jpg", "jpeg", "png"].includes(ext)) {
      setError("Unsupported file type. Please upload a PDF, JPG, JPEG or PNG file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 20 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    setFields(null);
    setReviewed(false);

    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        setError("We could not extract values from this report. Please try again or enter the values manually.");
        return;
      }

      const values = parseHrvReport(text);
      const extracted = buildExtractedFields(values);
      const foundCount = extracted.filter((f) => f.status === "found").length;

      if (foundCount === 0) {
        setError("We could not extract values from this report. Please try again or enter the values manually.");
        return;
      }

      setFields(extracted);
      const edits: Record<string, string> = {};
      for (const f of extracted) {
        edits[f.key] = f.value !== undefined ? String(f.value) : "";
      }
      setEditedValues(edits);
    } catch (err) {
      console.error("HRV report extraction failed:", err);
      setError("We could not extract values from this report. Please try again or enter the values manually.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFieldEdit = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleUseValues = () => {
    if (!fields) return;
    const values: ParsedReportValues = {};
    for (const f of fields) {
      const raw = editedValues[f.key]?.trim();
      if (raw === "") continue;
      if (f.key === "durationMinutes" || f.key === "meanHeartRate" || f.key === "sdnn" || f.key === "rmssd" || f.key === "pnn50" || f.key === "hfPower" || f.key === "lfPower" || f.key === "lfhfRatio" || f.key === "vlfPower" || f.key === "samplingFrequency" || f.key === "totalBeats") {
        const num = parseFloat(raw.replace(",", "."));
        if (Number.isFinite(num)) (values as any)[f.key] = num;
      } else {
        (values as any)[f.key] = raw;
      }
    }
    onPrefill(values);
    onClose();
  };

  const inputClass = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

  return (
    <div className="mt-3 rounded-lg border border-border bg-card p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload HRV report"
      />

      {!fields && !uploading && !error && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Upload a PDF or image of an HRV report. Accepted formats: PDF, JPG, JPEG, PNG.
            Reports are processed locally and are not retained.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Select file
          </button>
        </div>
      )}

      {uploading && (
        <p className="text-xs text-muted-foreground">Extracting values…</p>
      )}

      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); fileInputRef.current?.click(); }}
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Try another file
          </button>
        </div>
      )}

      {fields && (
        <div>
          <h4 className="text-xs font-semibold text-foreground">Values found in the report</h4>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fields.filter(f => f.status === "found" || f.value !== undefined).map((f) => (
              <div key={f.key} className="flex items-center gap-1.5">
                <span className="w-28 shrink-0 text-xs text-muted-foreground">{f.label}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editedValues[f.key] ?? ""}
                  onChange={(e) => handleFieldEdit(f.key, e.target.value)}
                  className="w-20 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground"
                />
                {f.unit && <span className="text-xs text-muted-foreground">{f.unit}</span>}
              </div>
            ))}
          </div>

          <label className="mt-3 flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border accent-[#286d6d]"
            />
            <span className="text-xs text-muted-foreground">
              I have reviewed the extracted values against the original report.
            </span>
          </label>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleUseValues}
              disabled={!reviewed}
              className="rounded-md bg-[#286d6d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f5555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use these values
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
