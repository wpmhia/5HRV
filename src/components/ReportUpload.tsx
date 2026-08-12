"use client";

import { useRef, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { parseHrvReport, hasHrvContent, type ParsedReportValues } from "@/lib/parseHrvReport";
import { extractTextFromFileInWorker } from "@/lib/pdfProcessorClient";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const HRV_VALUE_KEYS = ["rmssd", "sdnn", "pnn50", "hfPower", "lfPower", "lfhfRatio"] as const;

function countParsedValues(values: ParsedReportValues): number {
  return HRV_VALUE_KEYS.filter((k) => values[k] !== undefined).length;
}

type Props = {
  onPrefill: (values: ParsedReportValues) => void;
  onClearImport: () => void;
  imported: boolean;
  importedCount: number;
  onBusyChange?: (busy: boolean) => void;
};

async function loadPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjsLib;
}

// Self-hosted Tesseract assets (worker, WASM core and language data) so OCR
// never depends on a third-party runtime download.
const TESSERACT_PATHS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/tesseract-core.wasm.js",
  langPath: "/tesseract/",
};

async function ocrWithTesseract(image: string | HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, TESSERACT_PATHS);
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
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
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
  if (ext === "pdf" || ext === "jpg" || ext === "jpeg" || ext === "png") {
    // Prefer the Web Worker so heavy extraction/OCR never blocks the UI thread.
    try {
      return await extractTextFromFileInWorker(file);
    } catch {
      // fall back to the main-thread implementation below
    }
  }
  if (ext === "pdf") return await extractTextFromPdf(file);
  if (ext === "jpg" || ext === "jpeg" || ext === "png") return await extractTextFromImage(file);
  throw new Error("Unsupported file type.");
}

export function ReportUpload({ onPrefill, onClearImport, imported, importedCount, onBusyChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const opCounter = useRef(0);

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

    opCounter.current += 1;
    const opId = opCounter.current;

    setUploading(true);
    onBusyChange?.(true);
    setError(null);

    try {
      const text = await extractTextFromFile(file);
      if (opId !== opCounter.current) return; // stale response
      if (!text.trim()) {
        setError("Could not extract values. Try again or enter manually.");
        return;
      }
      const values = parseHrvReport(text);
      if (countParsedValues(values) === 0) {
        setError("Could not extract values. Try again or enter manually.");
        return;
      }
      onPrefill(values);
    } catch {
      if (opId === opCounter.current) {
        setError("Could not extract values. Try again or enter manually.");
      }
    } finally {
      if (opId === opCounter.current) {
        setUploading(false);
        onBusyChange?.(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChangeFile = () => {
    opCounter.current += 1;
    onClearImport();
    setError(null);
    fileInputRef.current?.click();
  };

  const handleUndo = () => {
    onClearImport();
  };

  const handleUploadClick = () => {
    if (uploading) return;
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFillFields = () => {
    const values = parseHrvReport(pasteText);
    if (countParsedValues(values) === 0) {
      setPasteError("No recognised HRV values found. Check the pasted text and try again.");
      return;
    }
    onPrefill(values);
    setPasteOpen(false);
    setPasteText("");
    setPasteError(null);
  };

  const handleCancelPaste = () => {
    setPasteOpen(false);
    setPasteText("");
    setPasteError(null);
  };

  const handlePasteOpenChange = (open: boolean) => {
    setPasteOpen(open);
    if (open) {
      setPasteError(null);
    }
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
      {imported ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs text-muted-foreground">
            {importedCount} values imported — please review
          </span>
          <button
            type="button"
            onClick={handleChangeFile}
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Change file
          </button>
          <button
            type="button"
            onClick={handleUndo}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Undo import
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              aria-busy={uploading}
              className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-70"
            >
              {uploading ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
                  />
                  Extracting…
                </>
              ) : (
                "Upload report"
              )}
            </button>
            <Popover open={pasteOpen} onOpenChange={handlePasteOpenChange}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={uploading}
                  className="inline-flex min-w-[96px] items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-70"
                >
                  Paste values
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Paste values</p>
                    <p className="text-xs text-muted-foreground">
                      Paste copied values from an HRV report
                    </p>
                  </div>
                  <Textarea
                    value={pasteText}
                    onChange={(e) => {
                      setPasteText(e.target.value);
                      if (pasteError) setPasteError(null);
                    }}
                    placeholder={"SDNN: 39.33\nrMSSD: 23.14\npNN50: 3.28%\nLF: 416.47\nHF: 70.55\nLF/HF: 5.90"}
                    rows={6}
                    className="min-h-24 font-mono text-xs"
                    aria-label="Pasted HRV report values"
                    aria-invalid={pasteError !== null}
                  />
                  {pasteError && (
                    <p role="alert" className="text-xs text-destructive">{pasteError}</p>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelPaste}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleFillFields}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Fill fields
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">{error}</p>
          )}
        </div>
      )}
    </>
  );
}
