"use client";

import { useRef, useState } from "react";
import { parseHrvReport, buildExtractedFields, hasHrvContent, type ParsedReportValues, type ExtractedField } from "@/lib/parseHrvReport";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

type Props = {
  onPrefill: (values: ParsedReportValues) => void;
};

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
  if (ext === "pdf") return await extractTextFromPdf(file);
  if (ext === "jpg" || ext === "jpeg" || ext === "png") return await extractTextFromImage(file);
  throw new Error("Unsupported file type.");
}

export function ReportUpload({ onPrefill }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fields, setFields] = useState<ExtractedField[] | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFields(null);
    setEditedValues({});
    setReviewed(false);
    setError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "jpg", "jpeg", "png"].includes(ext)) {
      setError("Unsupported file type.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large (max 20 MB).");
      return;
    }

    setUploading(true);
    setError(null);
    reset();

    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        setError("Could not extract values. Try again or enter manually.");
        return;
      }
      const values = parseHrvReport(text);
      const extracted = buildExtractedFields(values);
      if (extracted.filter((f) => f.status === "found").length === 0) {
        setError("Could not extract values. Try again or enter manually.");
        return;
      }
      setFields(extracted);
      const edits: Record<string, string> = {};
      for (const f of extracted) {
        edits[f.key] = f.value !== undefined ? String(f.value) : "";
      }
      setEditedValues(edits);
    } catch {
      setError("Could not extract values. Try again or enter manually.");
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
      if (f.key === "sdnn" || f.key === "rmssd" || f.key === "pnn50" || f.key === "hfPower" || f.key === "lfPower" || f.key === "lfhfRatio" || f.key === "vlfPower" || f.key === "samplingFrequency" || f.key === "totalBeats") {
        const num = parseFloat(raw.replace(",", "."));
        if (Number.isFinite(num)) (values as any)[f.key] = num;
      } else {
        (values as any)[f.key] = raw;
      }
    }
    onPrefill(values);
    reset();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload HRV report"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        Upload report
      </button>
      {uploading && (
        <p className="mt-2 text-xs text-muted-foreground">Extracting values…</p>
      )}
      {error && (
        <div className="mt-2 space-y-2">
          <p role="alert" className="text-xs text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); fileInputRef.current?.click(); }}
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
      {fields && (
        <div className="mt-3 rounded-lg border border-border bg-card p-4">
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
              onClick={reset}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
