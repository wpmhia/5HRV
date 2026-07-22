"use client";

import { useMemo, useState } from "react";
import type { MeasurementInput } from "@/lib/types";
import { hasLfhfDiscrepancy, normalizeNumber } from "@/lib/interpretHrv";

type Props = {
  onInterpret: (input: MeasurementInput) => void;
  onClear: () => void;
};

type FormState = {
  age: string;
  referenceSex: "female" | "male" | "none";
  meanHeartRate: string;
  rmssd: string;
  sdnn: string;
  pnn50: string;
  hfPower: string;
  lfPower: string;
  lfhfRatio: string;
};

const initialState: FormState = {
  age: "",
  referenceSex: "female",
  meanHeartRate: "",
  rmssd: "",
  sdnn: "",
  pnn50: "",
  hfPower: "",
  lfPower: "",
  lfhfRatio: "",
};

const inputClass =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

function RadioGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  helper,
}: {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  helper?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {helper && (
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
              value === option.value
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={`h-3 w-3 rounded-full border ${
                value === option.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/50 bg-card"
              }`}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

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
  const [hrWarning, setHrWarning] = useState<string | null>(null);

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
    setHrWarning(null);

    const age = normalizeNumber(form.age);
    if (age === null) {
      nextErrors.age = "Age is required.";
    } else if (age < 18 || age > 120) {
      nextErrors.age = "Age must be between 18 and 120 years.";
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

    const meanHeartRate = normalizeNumber(form.meanHeartRate);
    if (form.meanHeartRate.trim() !== "" && meanHeartRate === null) {
      nextErrors.meanHeartRate = "Enter a valid number.";
    } else if (
      meanHeartRate !== null &&
      (meanHeartRate < 30 || meanHeartRate > 220)
    ) {
      setHrWarning(
        "The entered mean heart rate is outside the usual plausibility range (30\u2013220 bpm). Please verify the value."
      );
    }

    const hfPower = normalizeNumber(form.hfPower);
    if (form.hfPower.trim() !== "" && hfPower === null) {
      nextErrors.hfPower = "Enter a valid number.";
    }
    const lfPower = normalizeNumber(form.lfPower);
    if (form.lfPower.trim() !== "" && lfPower === null) {
      nextErrors.lfPower = "Enter a valid number.";
    }
    const lfhfRatio = normalizeNumber(form.lfhfRatio);
    if (form.lfhfRatio.trim() !== "" && lfhfRatio === null) {
      nextErrors.lfhfRatio = "Enter a valid number.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;

    return {
      age: age!,
      referenceSex: form.referenceSex,
      measurementSource: "unknown",
      durationMinutes: 5,
      position: "unknown",
      rhythm: "unknown",
      artefactCorrection: "unknown",
      meanHeartRate: meanHeartRate ?? undefined,
      rmssd: rmssd ?? undefined,
      sdnn: sdnn ?? undefined,
      pnn50: pnn50 ?? undefined,
      hfPower: hfPower ?? undefined,
      lfPower: lfPower ?? undefined,
      lfhfRatio: lfhfRatio ?? undefined,
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
    setHrWarning(null);
    onClear();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <section aria-labelledby="section-person">
        <h2
          id="section-person"
          className="border-b border-border pb-2 text-base font-semibold text-foreground"
        >
          1. Reference information
        </h2>
        <div className="mt-4 space-y-5">
          <div className="max-w-xs">
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
          </div>
          <RadioGroup
            legend="Reference sex"
            name="referenceSex"
            value={form.referenceSex}
            onChange={(v) => set("referenceSex", v)}
            helper="This selection is used only to select the corresponding published reference distribution."
            options={[
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
              { value: "none", label: "Do not use sex-specific reference values" },
            ]}
          />
        </div>
      </section>

      <section aria-labelledby="section-values">
        <h2
          id="section-values"
          className="border-b border-border pb-2 text-base font-semibold text-foreground"
        >
          2. HRV values
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Decimal points and decimal commas are both accepted. At least RMSSD
          or SDNN is required.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            id="meanHeartRate"
            label="Mean heart rate"
            unit="bpm"
            value={form.meanHeartRate}
            onChange={(v) => set("meanHeartRate", v)}
            error={errors.meanHeartRate}
          />
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
          />
          <NumberField
            id="lfPower"
            label="LF power"
            unit="ms²"
            value={form.lfPower}
            onChange={(v) => set("lfPower", v)}
            error={errors.lfPower}
          />
          <NumberField
            id="lfhfRatio"
            label="LF/HF ratio"
            value={form.lfhfRatio}
            onChange={(v) => set("lfhfRatio", v)}
            error={errors.lfhfRatio}
            helper="Calculated automatically when LF and HF are entered."
          />
        </div>
        {lfhfLiveWarning && (
          <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-muted px-3 py-2 text-xs text-foreground">
            {lfhfLiveWarning}
          </p>
        )}
        {hrWarning && (
          <p role="alert" className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-xs text-foreground">
            {hrWarning}
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
        >
          Interpret HRV
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="w-full rounded-md border border-border bg-card px-6 py-3 text-base font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
        >
          Clear values
        </button>
      </div>
    </form>
  );
}
