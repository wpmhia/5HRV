"use client";

import { useRef, useState } from "react";
import { parseHrvReport, hasHrvContent, type ParsedReportValues } from "@/lib/parseHrvReport";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

type Props = {
  onPrefill: (values: ParsedReportValues) => void;
  onClearImport: () => void;
  imported: boolean;
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

export function ReportUpload({ onPrefill, onClearImport, imported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

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

    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        setError("Could not extract values. Try again or enter manually.");
        return;
      }
      const values = parseHrvReport(text);
      const count = ["rmssd", "sdnn", "pnn50", "hfPower", "lfPower", "lfhfRatio"].filter(
        (k) => values[k as keyof ParsedReportValues] !== undefined
      ).length;
      if (count === 0) {
        setError("Could not extract values. Try again or enter manually.");
        return;
      }
      setImportedCount(count);
      onPrefill(values);
    } catch {
      setError("Could not extract values. Try again or enter manually.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChangeFile = () => {
    onClearImport();
    setImportedCount(0);
    fileInputRef.current?.click();
  };

  const handleUndo = () => {
    onClearImport();
    setImportedCount(0);
  };

  const handleUploadClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleTryAgain = () => {
    setError(null);
    fileInputRef.current?.click();
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
        <div className="flex items-center gap-2">
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
        <>
          <button
            type="button"
            onClick={handleUploadClick}
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
                onClick={handleTryAgain}
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
