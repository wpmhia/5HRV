"use client";

import { useRef, useState } from "react";
import type { MeasurementInput } from "@/lib/types";
import type { ParsedReportValues, BluetoothMeasurementMetadata } from "@/lib/parseHrvReport";
import { normalizeNumber } from "@/lib/interpretHrv";
import { ReportUpload } from "@/components/ReportUpload";
import { BluetoothMeasurement } from "@/components/BluetoothMeasurement";

type Props = {
  onInterpret: (input: MeasurementInput) => void;
  onClear: () => void;
};

type FormState = {
  age: string;
  referenceSex: string;
  rmssd: string;
  sdnn: string;
  pnn50: string;
  freqMode: "powers" | "ratio";
  hfPower: string;
  lfPower: string;
  lfhfRatio: string;
  lfhfSource: string;
  recordingDate?: string;
  durationSeconds?: number;
  samplingFrequencyHz?: number;
  totalBeats?: number;
  measurement?: BluetoothMeasurementMetadata;
};

const initialState: FormState = {
  age: "",
  referenceSex: "unselected",
  rmssd: "",
  sdnn: "",
  pnn50: "",
  freqMode: "powers",
  hfPower: "",
  lfPower: "",
  lfhfRatio: "",
  lfhfSource: "",
  measurement: undefined,
};

const inputClass =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

function NumberField({
  id,
  label,
  value,
  onChange,
  unit,
  helper,
  error,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  helper?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
        {unit && (
          <span className="ml-1 font-normal text-muted-foreground">
            ({unit})
          </span>
        )}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${id}-error` : helper ? `${id}-helper` : undefined
        }
        className={`mt-1 ${inputClass} ${error ? "border-destructive" : ""}`}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${id}-helper`} className="mt-1 text-xs text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}

export function CalculatorForm({ onInterpret, onClear }: Props) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [importedFromReport, setImportedFromReport] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [extracting, setExtracting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (prev[key as string]) {
        const next = { ...prev };
        delete next[key as string];
        return next;
      }
      return prev;
    });
  };

  const collectErrors = (nextErrors: Record<string, string>): MeasurementInput | null => {

    const age = normalizeNumber(form.age);
    if (age === null) {
      nextErrors.age = "Age is required.";
    } else if (!Number.isInteger(age) || age < 18 || age > 120) {
      nextErrors.age = "Age must be a whole number between 18 and 120 years.";
    }

    if (form.referenceSex === "unselected") {
      nextErrors.referenceSex = "Select a reference sex.";
    }

    const rmssd = normalizeNumber(form.rmssd);
    const sdnn = normalizeNumber(form.sdnn);
    const rmssdError = form.rmssd.trim() !== "" && rmssd === null
      ? "Enter a valid number."
      : rmssd !== null && rmssd <= 0
        ? "RMSSD must be greater than zero."
        : undefined;
    const sdnnError = form.sdnn.trim() !== "" && sdnn === null
      ? "Enter a valid number."
      : sdnn !== null && sdnn <= 0
        ? "SDNN must be greater than zero."
        : undefined;
    if (rmssd === null && sdnn === null) {
      nextErrors.rmssd = "Enter at least RMSSD or SDNN.";
    } else {
      if (rmssdError) nextErrors.rmssd = rmssdError;
      if (sdnnError) nextErrors.sdnn = sdnnError;
    }

    const pnn50 = normalizeNumber(form.pnn50);
    if (form.pnn50.trim() !== "" && pnn50 === null) {
      nextErrors.pnn50 = "Enter a valid number.";
    } else if (pnn50 !== null && (pnn50 < 0 || pnn50 > 100)) {
      nextErrors.pnn50 = "pNN50 must be between 0 and 100.";
    }

    const hfPower = normalizeNumber(form.hfPower);
    const lfPower = normalizeNumber(form.lfPower);
    if (form.freqMode === "powers") {
      if (form.hfPower.trim() !== "" && hfPower === null) {
        nextErrors.hfPower = "Enter a valid number.";
      } else if (hfPower !== null && hfPower < 0) {
        nextErrors.hfPower = "HF power cannot be negative.";
      } else if (hfPower !== null && hfPower === 0) {
        nextErrors.hfPower = "HF power must be greater than zero.";
      }
      if (form.lfPower.trim() !== "" && lfPower === null) {
        nextErrors.lfPower = "Enter a valid number.";
      } else if (lfPower !== null && lfPower < 0) {
        nextErrors.lfPower = "LF power cannot be negative.";
      }
      if (hfPower !== null && lfPower === null) {
        nextErrors.lfPower = "LF power is required when HF power is entered.";
      } else if (lfPower !== null && hfPower === null) {
        nextErrors.hfPower = "HF power is required when LF power is entered.";
      }
    } else {
      if (form.hfPower.trim() !== "" && hfPower === null) {
        nextErrors.hfPower = "Enter a valid number.";
      } else if (hfPower !== null && hfPower < 0) {
        nextErrors.hfPower = "HF power cannot be negative.";
      }
      if (form.lfPower.trim() !== "" && lfPower === null) {
        nextErrors.lfPower = "Enter a valid number.";
      } else if (lfPower !== null && lfPower < 0) {
        nextErrors.lfPower = "LF power cannot be negative.";
      }
    }

    const ratio = normalizeNumber(form.lfhfRatio);
    if (form.freqMode === "ratio") {
      if (ratio === null) {
        nextErrors.lfhfRatio = "LF/HF ratio is required in ratio-only mode.";
      } else if (ratio < 0) {
        nextErrors.lfhfRatio = "LF/HF cannot be negative.";
      }
    } else {
      if (form.lfhfRatio.trim() !== "" && ratio === null) {
        nextErrors.lfhfRatio = "Enter a valid number.";
      } else if (ratio !== null && ratio < 0) {
        nextErrors.lfhfRatio = "LF/HF cannot be negative.";
      }
    }

    if (Object.keys(nextErrors).length > 0) return null;

    const result: MeasurementInput = {
      age: age!,
      referenceSex: form.referenceSex as MeasurementInput["referenceSex"],
      rmssd: rmssd ?? undefined,
      sdnn: sdnn ?? undefined,
      pnn50: pnn50 ?? undefined,
    };

    if (form.measurement) {
      result.recording = { ...form.measurement };
    } else if (
      form.recordingDate ||
      form.durationSeconds !== undefined ||
      form.samplingFrequencyHz !== undefined ||
      form.totalBeats !== undefined
    ) {
      result.recording = {
        recordingDate: form.recordingDate,
        durationSeconds: form.durationSeconds,
        samplingFrequencyHz: form.samplingFrequencyHz,
        totalBeats: form.totalBeats,
      };
    }

    if (form.freqMode === "powers") {
      if (lfPower !== null && hfPower !== null) {
        result.hfPower = hfPower;
        result.lfPower = lfPower;
        if (hfPower > 0) {
          result.lfhfSource = "calculated";
        }
      }
    } else {
      if (ratio !== null && !isNaN(ratio) && ratio >= 0) {
        result.lfhfRatio = ratio;
        result.lfhfSource = form.lfhfSource === "imported" ? "imported" : "manual";
      }
    }

    return result;
  };

  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const localErrors: Record<string, string> = {};
    const input = collectErrors(localErrors);
    setErrors(localErrors);
    if (input) {
      onInterpret(input);
    } else {
      const firstKey = Object.keys(localErrors)[0];
      if (firstKey) {
        const errorFieldIds: Record<string, string> = {
          referenceSex: "reference-sex",
        };
        const fieldId = errorFieldIds[firstKey] ?? firstKey;
        requestAnimationFrame(() => {
          document.getElementById(fieldId)?.focus();
        });
      }
    }
  };

  const handleClear = () => {
    setForm(initialState);
    setErrors({});
    setImportedFromReport(false);
    onClear();
  };

  const switchFreqMode = (mode: "powers" | "ratio") => {
    setForm((prev) => {
      const next = { ...prev, freqMode: mode, lfhfSource: "" };
      if (mode === "powers") {
        next.lfhfRatio = "";
      } else {
        next.hfPower = "";
        next.lfPower = "";
      }
      return next;
    });
    setErrors({});
  };

  const handleClearImport = () => {
    setForm((prev) => ({
      ...prev,
      rmssd: "",
      sdnn: "",
      pnn50: "",
      hfPower: "",
      lfPower: "",
      lfhfRatio: "",
      lfhfSource: "",
      freqMode: "powers",
      recordingDate: undefined,
      durationSeconds: undefined,
      samplingFrequencyHz: undefined,
      totalBeats: undefined,
      measurement: undefined,
    }));
    setErrors({});
    setImportedFromReport(false);
  };

  const handlePrefill = (values: ParsedReportValues) => {
    const base: FormState = {
      ...initialState,
      freqMode: "powers",
      age: form.age,
      referenceSex: form.referenceSex,
    };
    if (values.rmssd !== undefined) base.rmssd = String(values.rmssd);
    if (values.sdnn !== undefined) base.sdnn = String(values.sdnn);
    if (values.pnn50 !== undefined) base.pnn50 = String(values.pnn50);
    const hasLfAndHf = values.lfPower !== undefined && values.hfPower !== undefined;
    if (hasLfAndHf) {
      base.hfPower = String(values.hfPower!);
      base.lfPower = String(values.lfPower!);
      base.freqMode = "powers";
    } else if (values.lfhfRatio !== undefined) {
      base.freqMode = "ratio";
      base.lfhfRatio = String(values.lfhfRatio);
      base.lfhfSource = "imported";
    } else if (values.lfPower !== undefined) {
      base.lfPower = String(values.lfPower);
      base.freqMode = "powers";
    } else if (values.hfPower !== undefined) {
      base.hfPower = String(values.hfPower);
      base.freqMode = "powers";
    }
    if (values.measurement) base.measurement = values.measurement;
    if (values.recordingDate) base.recordingDate = values.recordingDate;
    if (values.durationSeconds !== undefined) base.durationSeconds = values.durationSeconds;
    if (values.samplingFrequency !== undefined) base.samplingFrequencyHz = values.samplingFrequency;
    if (values.totalBeats !== undefined) base.totalBeats = values.totalBeats;
    setForm(base);
    setErrors({});
    const fieldKeys: (keyof FormState)[] = ["rmssd", "sdnn", "pnn50", "hfPower", "lfPower", "lfhfRatio"];
    const actualCount = fieldKeys.filter((k) => base[k] !== "").length;
    setImportedCount(actualCount);
    setImportedFromReport(true);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-8">
      <section>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              id="age"
              label="Age"
              unit="years"
              required
              value={form.age}
              onChange={(v) => set("age", v)}
              error={errors.age}
              helper="Age-specific reference percentiles cover 18–72 years."
            />
            {(() => {
              const age = normalizeNumber(form.age);
              if (age !== null && age > 72) {
                return (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    No matching age-specific reference percentile is available above 72 years.
                  </p>
                );
              }
              return null;
            })()}
            <div>
              <label htmlFor="reference-sex" className="text-sm font-medium text-foreground">
                Reference sex
              </label>
              <select
                id="reference-sex"
                value={form.referenceSex}
                onChange={(e) => set("referenceSex", e.target.value)}
                className={`mt-1 ${inputClass}`}
              >
                <option value="unselected" disabled>Select reference sex</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="none">No sex-specific reference</option>
              </select>
              {errors.referenceSex && (
                <p role="alert" className="mt-1 text-xs text-destructive">{errors.referenceSex}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="section-values">
        <div className="flex items-center justify-between pb-2">
          <h2
            id="section-values"
            className="text-base font-semibold text-foreground"
          >
            HRV values
          </h2>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ReportUpload
              onPrefill={handlePrefill}
              onClearImport={handleClearImport}
              imported={importedFromReport}
              importedCount={importedCount}
              onBusyChange={setExtracting}
            />
            <BluetoothMeasurement onPrefill={handlePrefill} />
          </div>
        </div>

        {importedFromReport && (
          <p className="mt-3 text-xs text-muted-foreground">
            Report values are prefilled. Editing fields will update the values for this calculation only.
          </p>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          Decimal points and decimal commas are both accepted. At least RMSSD
          or SDNN is required.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            id="rmssd"
            label="RMSSD"
            unit="ms"
            value={form.rmssd}
            onChange={(v) => set("rmssd", v)}
            error={errors.rmssd}
            helper="Primary five-minute HRV metric."
          />
          <NumberField
            id="sdnn"
            label="SDNN"
            unit="ms"
            value={form.sdnn}
            onChange={(v) => set("sdnn", v)}
            error={errors.sdnn}
            helper="Overall variability during the five-minute recording."
          />
          <div className="sm:col-span-2">
            <NumberField
              id="pnn50"
              label="pNN50"
              unit="%"
              value={form.pnn50}
              onChange={(v) => set("pnn50", v)}
              error={errors.pnn50}
            />
          </div>
          <div className="sm:col-span-2">
            <fieldset>
              <legend className="text-sm font-medium text-foreground mb-2">Frequency-domain data</legend>
              <div className="flex gap-2" role="radiogroup" aria-label="Frequency input mode">
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    form.freqMode === "powers"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="freqMode"
                    value="powers"
                    checked={form.freqMode === "powers"}
                    onChange={() => switchFreqMode("powers")}
                    className="sr-only"
                  />
                  LF and HF power
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    form.freqMode === "ratio"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="freqMode"
                    value="ratio"
                    checked={form.freqMode === "ratio"}
                    onChange={() => switchFreqMode("ratio")}
                    className="sr-only"
                  />
                  LF/HF ratio only
                </label>
              </div>
            </fieldset>
          </div>
          {form.freqMode === "powers" ? (
            <>
              <NumberField
                id="hfPower"
                label="HF power"
                unit="ms²"
                value={form.hfPower}
                onChange={(v) => set("hfPower", v)}
                error={errors.hfPower}
                helper="Enter absolute spectral power in ms². Do not enter normalized units, percentages or log-transformed values."
              />
              <NumberField
                id="lfPower"
                label="LF power"
                unit="ms²"
                value={form.lfPower}
                onChange={(v) => set("lfPower", v)}
                error={errors.lfPower}
                helper="Enter absolute spectral power in ms². Do not enter normalized units, percentages or log-transformed values."
              />
              {(() => {
                const lf = normalizeNumber(form.lfPower);
                const hf = normalizeNumber(form.hfPower);
                if (lf !== null && hf !== null && hf > 0) {
                  return (
                    <p className="-mt-2 sm:col-span-2 text-xs text-muted-foreground">
                      Calculated LF/HF: <span className="font-mono font-medium text-foreground">{(lf / hf).toFixed(2)}</span>
                    </p>
                  );
                }
                return null;
              })()}
            </>
          ) : (
            <div className="sm:col-span-2">
              <NumberField
                id="lfhfRatio"
                label="LF/HF ratio"
                value={form.lfhfRatio}
                onChange={(v) => {
                  set("lfhfRatio", v);
                  if (form.lfhfSource === "imported") {
                    set("lfhfSource", "manual");
                  }
                }}
                error={errors.lfhfRatio}
                helper="Use this when the source report provides only the LF/HF ratio and not the separate LF and HF powers."
              />
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={extracting}
          className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {extracting ? "Extracting…" : "Interpret"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={extracting}
          className="w-full rounded-md border border-border bg-card px-6 py-3 text-base font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Clear all
        </button>
      </div>
    </form>
  );
}
