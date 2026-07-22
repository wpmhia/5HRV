"use client";

import { useRef, useState } from "react";
import { parseHrvReport, buildExtractedFields, type ParsedReportValues, type ExtractedField } from "@/lib/parseHrvReport";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

type Props = {
  onPrefill: (values: ParsedReportValues) => void;
};

async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    const buffer = await file.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      pages.push(text);
    }
    return pages.join("\n");
  }

  if (ext === "jpg" || ext === "jpeg" || ext === "png") {
    const Tesseract = await import("tesseract.js");
    const dataUrl = await fileToDataUrl(file);
    const { data } = await Tesseract.recognize(dataUrl, "eng");
    return data.text;
  }

  throw new Error("Unsupported file type. Please upload a PDF, JPG, JPEG or PNG file.");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReportUpload({ onPrefill }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fields, setFields] = useState<ExtractedField[] | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyWarning, setPrivacyWarning] = useState(true);

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
    setPrivacyWarning(false);

    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        setError("We could not reliably extract the HRV values from this report. Enter the values manually or upload a clearer PDF or image.");
        return;
      }

      const values = parseHrvReport(text);
      const extracted = buildExtractedFields(values);
      const foundCount = extracted.filter((f) => f.status === "found").length;

      if (foundCount === 0) {
        setError("We could not reliably extract the HRV values from this report. Enter the values manually or upload a clearer PDF or image.");
        return;
      }

      setFields(extracted);
      const edits: Record<string, string> = {};
      for (const f of extracted) {
        edits[f.key] = f.value !== undefined ? String(f.value) : "";
      }
      setEditedValues(edits);
    } catch (err) {
      setError("We could not reliably extract the HRV values from this report. Enter the values manually or upload a clearer PDF or image.");
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
  };

  const handleCancel = () => {
    setFields(null);
    setEditedValues({});
    setReviewed(false);
    setError(null);
  };

  return (
    <div className="space-y-4">
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
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card px-6 py-4 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
      >
        {uploading ? (
          "Extracting values..."
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload HRV report
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground">
        Accepted formats: PDF, JPG, JPEG, PNG
      </p>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {privacyWarning && (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          Uploaded reports are used only to extract HRV values and are not retained.
          Uploaded reports may contain patient names, dates of birth, identification
          numbers or clinical identifiers. Review and remove any identifying
          information before interpretation.
        </p>
      )}

      {fields && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Values found in the report</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="flex items-center gap-2">
                <label className="w-36 shrink-0 text-xs font-medium text-muted-foreground">
                  {f.label}
                </label>
                <input
                  type="text"
                  inputMode={f.unit === "min" || f.unit === "bpm" || f.unit === "ms" || f.unit === "%" || f.unit === "ms²" || f.unit === "Hz" ? "decimal" : "text"}
                  value={editedValues[f.key] ?? ""}
                  onChange={(e) => handleFieldEdit(f.key, e.target.value)}
                  className="w-24 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                />
                {f.unit && (
                  <span className="text-xs text-muted-foreground">{f.unit}</span>
                )}
                <span
                  className={`ml-auto text-xs font-medium ${
                    f.status === "found"
                      ? "text-green-600"
                      : f.status === "verify"
                        ? "text-amber-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {f.status === "found"
                    ? "Found"
                    : f.status === "verify"
                      ? "Please verify"
                      : "Not found"}
                </span>
              </div>
            ))}
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-[#286d6d]"
            />
            <div>
              <p className="text-xs font-medium text-foreground">
                I have reviewed the extracted values against the original ECG report.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Text extraction can be imperfect. Verify all values before use.
              </p>
            </div>
          </label>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleUseValues}
              disabled={!reviewed}
              className="rounded-md bg-[#286d6d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1f5555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use these values
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
