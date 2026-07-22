"use client";

import { useMemo, useState } from "react";
import type { MeasurementInput } from "@/lib/types";
import type { ParsedReportValues } from "@/lib/parseHrvReport";
import { hasLfhfDiscrepancy, normalizeNumber } from "@/lib/interpretHrv";
import { ReportUpload } from "@/components/ReportUpload";

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
  hfPower: string;
  lfPower: string;
  vlfPower: string;
  lfhfRatio: string;
};

const initialState: FormState = {
  age: "",
  referenceSex: "unselected",
  rmssd: "",
  sdnn: "",
  pnn50: "",
  hfPower: "",
  lfPower: "",
  vlfPower: "",
  lfhfRatio: "",
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

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const lfhfLiveWarning = useMemo(() => {
    const lf = normalizeNumber(form.lfPower);
    const hf = normalizeNumber(form.hfPower);
    const ratio = normalizeNumber(form.lfhfRatio);
    if (lf === null || hf === null || ratio === null || hf <= 0) return null;
    if (hasLfhfDiscrepancy(ratio, lf, hf)) {
      return `Entered LF/HF differs by more than 10% from LF \u00F7 HF (${(lf / hf).toFixed(2)}).`;
    }
    return null;
  }, [form.lfPower, form.hfPower, form.lfhfRatio]);

  const validate = (): MeasurementInput | null => {
    const nextErrors: Record<string, string> = {};

    const age = normalizeNumber(form.age);
    if (age === null) {
      nextErrors.age = "Age is required.";
    } else if (age < 18 || age > 120) {
      nextErrors.age = "Age must be between 18 and 120 years.";
    }

    if (form.referenceSex === "unselected") {
      nextErrors.referenceSex = "Select a gender.";
    }

    const rmssd = normalizeNumber(form.rmssd);
    const sdnn = normalizeNumber(form.sdnn);
    if (rmssd === null && sdnn === null) {
      nextErrors.rmssd = "Enter at least RMSSD or SDNN.";
      nextErrors.sdnn = "Enter at least RMSSD or SDNN.";
    }
    if (form.rmssd.trim() !== "" && rmssd === null) {
      nextErrors.rmssd = "Enter a valid number.";
    } else if (rmssd !== null && rmssd <= 0) {
      nextErrors.rmssd = "RMSSD must be greater than zero.";
    }
    if (form.sdnn.trim() !== "" && sdnn === null) {
      nextErrors.sdnn = "Enter a valid number.";
    } else if (sdnn !== null && sdnn <= 0) {
      nextErrors.sdnn = "SDNN must be greater than zero.";
    }

    const pnn50 = normalizeNumber(form.pnn50);
    if (form.pnn50.trim() !== "" && pnn50 === null) {
      nextErrors.pnn50 = "Enter a valid number.";
    } else if (pnn50 !== null && (pnn50 < 0 || pnn50 > 100)) {
      nextErrors.pnn50 = "pNN50 must be between 0 and 100.";
    }

    const hfPower = normalizeNumber(form.hfPower);
    if (form.hfPower.trim() !== "" && hfPower === null) {
      nextErrors.hfPower = "Enter a valid number.";
    } else if (hfPower !== null && hfPower < 0) {
      nextErrors.hfPower = "HF power cannot be negative.";
    }
    const lfPower = normalizeNumber(form.lfPower);
    if (form.lfPower.trim() !== "" && lfPower === null) {
      nextErrors.lfPower = "Enter a valid number.";
    } else if (lfPower !== null && lfPower < 0) {
      nextErrors.lfPower = "LF power cannot be negative.";
    }
    const lfhfRatio = normalizeNumber(form.lfhfRatio);
    if (form.lfhfRatio.trim() !== "" && lfhfRatio === null) {
      nextErrors.lfhfRatio = "Enter a valid number.";
    } else if (lfhfRatio !== null && lfhfRatio < 0) {
      nextErrors.lfhfRatio = "LF/HF cannot be negative.";
    }

    const vlfPower = normalizeNumber(form.vlfPower);
    if (form.vlfPower.trim() !== "" && vlfPower === null) {
      nextErrors.vlfPower = "Enter a valid number.";
    } else if (vlfPower !== null && vlfPower < 0) {
      nextErrors.vlfPower = "VLF power cannot be negative.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;

    return {
      age: age!,
      referenceSex: form.referenceSex as MeasurementInput["referenceSex"],
      rmssd: rmssd ?? undefined,
      sdnn: sdnn ?? undefined,
      pnn50: pnn50 ?? undefined,
      hfPower: hfPower ?? undefined,
      lfPower: lfPower ?? undefined,
      lfhfRatio: lfhfRatio ?? undefined,
      vlfPower: vlfPower ?? undefined,
    };
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = validate();
    if (input) onInterpret(input);
  };

  const handleClear = () => {
    setForm(initialState);
    setErrors({});
    setImportedFromReport(false);
    onClear();
  };

  const handleClearImport = () => {
    setForm((prev) => ({
      ...prev,
      rmssd: "",
      sdnn: "",
      pnn50: "",
      hfPower: "",
      lfPower: "",
      vlfPower: "",
      lfhfRatio: "",
    }));
    setErrors({});
    setImportedFromReport(false);
  };

  const handlePrefill = (values: ParsedReportValues) => {
    const updates: Partial<FormState> = {};
    if (values.rmssd !== undefined) updates.rmssd = String(values.rmssd);
    if (values.sdnn !== undefined) updates.sdnn = String(values.sdnn);
    if (values.pnn50 !== undefined) updates.pnn50 = String(values.pnn50);
    if (values.hfPower !== undefined) updates.hfPower = String(values.hfPower);
    if (values.lfPower !== undefined) updates.lfPower = String(values.lfPower);
    if (values.lfhfRatio !== undefined) updates.lfhfRatio = String(values.lfhfRatio);
    if (values.vlfPower !== undefined) updates.vlfPower = String(values.vlfPower);
    setForm((prev) => ({ ...prev, ...updates }));
    setErrors({});
    setImportedFromReport(true);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <section aria-labelledby="section-person">
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
            <div>
              <label htmlFor="gender" className="text-sm font-medium text-foreground">
                Gender
              </label>
              <select
                id="gender"
                value={form.referenceSex}
                onChange={(e) => set("referenceSex", e.target.value)}
                className={`mt-1 ${inputClass}`}
              >
                <option value="unselected" disabled>Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
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
          <ReportUpload
            onPrefill={handlePrefill}
            onClearImport={handleClearImport}
            imported={importedFromReport}
          />
        </div>

        {importedFromReport && (
          <p className="mt-3 text-xs text-muted-foreground">
            Any values you enter manually will be replaced by imported values.
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
          <NumberField
            id="pnn50"
            label="pNN50"
            unit="%"
            value={form.pnn50}
            onChange={(v) => set("pnn50", v)}
            error={errors.pnn50}
          />
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
          <NumberField
            id="lfhfRatio"
            label="LF/HF ratio"
            value={form.lfhfRatio}
            onChange={(v) => set("lfhfRatio", v)}
            error={errors.lfhfRatio}
            helper="Calculated automatically when LF and HF are entered."
          />
          <NumberField
            id="vlfPower"
            label="VLF power"
            unit="ms²"
            value={form.vlfPower}
            onChange={(v) => set("vlfPower", v)}
            error={errors.vlfPower}
            helper="Slow oscillations (0.003–0.04 Hz). Auto-filled from report upload."
          />
        </div>
        {lfhfLiveWarning && (
          <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-muted px-3 py-2 text-xs text-foreground">
            {lfhfLiveWarning}
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
        >
          Interpret
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="w-full rounded-md border border-border bg-card px-6 py-3 text-base font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
        >
          Clear all
        </button>
      </div>
    </form>
  );
}
