"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HrvInterpretation, MeasurementInput } from "@/lib/types";
import { buildClinicalParagraph } from "@/lib/interpretHrv";
import { getAgeBand } from "@/data/hrvReferenceData";

type Props = {
  interpretation: HrvInterpretation;
  input: MeasurementInput;
};

function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1: return `${value}st`;
    case 2: return `${value}nd`;
    case 3: return `${value}rd`;
    default: return `${value}th`;
  }
}

function approxPercentile(value: number, ref: number[]): number | null {
  if (ref.length !== 5) return null;
  const [p5, p25, p50, p75, p95] = ref;
  let percentile: number;
  if (value <= p5) {
    percentile = (value / p5) * 5;
  } else if (value <= p25) {
    percentile = 5 + ((value - p5) / (p25 - p5)) * 20;
  } else if (value <= p50) {
    percentile = 25 + ((value - p25) / (p50 - p25)) * 25;
  } else if (value <= p75) {
    percentile = 50 + ((value - p50) / (p75 - p50)) * 25;
  } else if (value <= p95) {
    percentile = 75 + ((value - p75) / (p95 - p75)) * 20;
  } else {
    percentile = 95 + ((value - p95) / p95) * 5;
  }
  return Math.round(Math.min(100, Math.max(0, percentile)));
}

function MetricCard({
  label,
  value,
  unit,
  category,
  categoryLabel,
  approxPct,
  description,
  percentiles,
}: {
  label: string;
  value: number;
  unit: string;
  category?: string;
  categoryLabel?: string;
  approxPct: number | null;
  description: string;
  percentiles?: number[];
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-foreground tabular-nums">
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        {categoryLabel && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
            {categoryLabel}
          </span>
        )}
        {approxPct !== null && (
          <span className="text-xs text-muted-foreground">
            Approximately {ordinal(approxPct)} percentile
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-foreground/80">{description}</p>
      {percentiles && percentiles.length === 5 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
            Reference details
          </summary>
          <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
            <span className="block">P5: {percentiles[0]} {unit}</span>
            <span className="block">P25: {percentiles[1]} {unit}</span>
            <span className="block">P50: {percentiles[2]} {unit}</span>
            <span className="block">P75: {percentiles[3]} {unit}</span>
            <span className="block">P95: {percentiles[4]} {unit}</span>
          </div>
        </details>
      )}
    </div>
  );
}

function AutonomicScoreDisplay({
  score,
}: {
  score: { value: number; label: string };
}) {
  const rawPosition = ((score.value + 100) / 200) * 100;
  const markerPosition = Math.min(98, Math.max(2, rawPosition));

  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        5HRV Autonomic Score
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Parasympathetic</span>
          <span>Sympathetic</span>
        </div>

        <div className="relative mt-2 h-9">
          <div className="absolute inset-x-0 top-0 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-stone-300 to-rose-400" />

          <div
            className="absolute top-1 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-card shadow-sm"
            style={{ left: `${markerPosition}%` }}
          />

          <div
            className="absolute top-4 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-foreground tabular-nums"
            style={{ left: `${markerPosition}%` }}
          >
            {score.value > 0 ? "+" : ""}
            {score.value}
          </div>
        </div>
      </div>

      <p className="mt-2 text-sm font-semibold text-foreground">
        {score.label}
      </p>
    </div>
  );
}

function SecondaryMetricCard({
  label,
  value,
  unit,
  description,
  limitation,
}: {
  label: string;
  value: number;
  unit: string;
  description: string;
  limitation?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <p className="mt-2 text-sm text-foreground/80">{description}</p>
      {limitation && (
        <p className="mt-2 text-xs italic text-muted-foreground/70">
          {limitation}
        </p>
      )}
    </div>
  );
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function buildPlainText(
  interpretation: HrvInterpretation,
  input: MeasurementInput
): string {
  const lines: string[] = [];
  lines.push("5HRV Interpretation");
  lines.push("");
  const ageBand = getAgeBand(input.age);
  lines.push(`Age: ${input.age} years`);
  lines.push(
    `Reference: ${input.referenceSex === "none" ? "No sex-specific reference" : input.referenceSex === "female" ? "Female" : "Male"}${ageBand ? `, ${ageBand} years` : ""}`
  );
  lines.push(`Date: ${formatDate()}`);

  if (interpretation.autonomicScore) {
    lines.push("");
    lines.push(`5HRV Autonomic Score: ${interpretation.autonomicScore.value > 0 ? "+" : ""}${interpretation.autonomicScore.value} (${interpretation.autonomicScore.label})`);
  }

  lines.push("");
  for (const m of interpretation.metrics) {
    if (m.key === "rmssd" || m.key === "sdnn") {
      const ref = m.referencePercentiles;
      const pct = ref ? approxPercentile(m.value, ref) : null;
      lines.push(`${m.name}: ${m.value} ${m.unit}`);
      if (m.categoryLabel) lines.push(`${m.categoryLabel}${pct !== null ? ` — approximately ${ordinal(pct)} percentile` : ""}`);
      lines.push(m.interpretation);
      if (ref) {
        lines.push(`Reference details: P5: ${ref[0]} · P25: ${ref[1]} · P50: ${ref[2]} · P75: ${ref[3]} · P95: ${ref[4]} ${m.unit}`);
      }
      lines.push("");
    } else {
      const src = m.lfhfSource === "calculated" ? " (calculated)" : m.lfhfSource === "manual" ? " (entered)" : m.lfhfSource === "imported" ? " (reported)" : "";
      lines.push(`${m.key === "lfhf" ? "LF/HF" : m.name}: ${m.value}${m.unit ? ` ${m.unit}` : ""}${src}`);
      lines.push(m.interpretation);
      if (m.limitation) lines.push(m.limitation);
      lines.push("");
    }
  }

  const clinicalPara = buildClinicalParagraph(interpretation.metrics, interpretation.autonomicScore);
  if (clinicalPara) lines.push(clinicalPara);

  lines.push("Interpret HRV together with the ECG, symptoms and clinical context.");
  lines.push("Interpretation assumes an artefact-corrected five-minute NN recording in sinus rhythm under standardised resting conditions.");
  if (interpretation.referenceNote) {
    lines.push("");
    lines.push(interpretation.referenceNote);
  }
  return lines.join("\n");
}

export function ResultsView({ interpretation, input }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const ageBand = useMemo(() => getAgeBand(input.age), [input.age]);

  const handleCopy = useCallback(async () => {
    const text = buildPlainText(interpretation, input);

    const fallbackToTextarea = (): boolean => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      try {
        textarea.select();
        return document.execCommand("copy");
      } finally {
        document.body.removeChild(textarea);
      }
    };

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ok = fallbackToTextarea();
      if (!ok) {
        setCopyError(true);
        setCopied(false);
        return;
      }
    }

    setCopied(true);
    setCopyError(false);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
      setCopyError(false);
    }, 2500);
  }, [interpretation, input]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleNewCalculation = () => {
    sessionStorage.removeItem("5hrv-result");
    window.location.href = "/calculator";
  };

  const primaryMetrics = interpretation.metrics.filter(
    (m) => m.key === "rmssd" || m.key === "sdnn"
  );
  const secondaryMetrics = interpretation.metrics.filter(
    (m) => m.key !== "rmssd" && m.key !== "sdnn"
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-lg border border-border bg-card print:border-none" aria-live="polite">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">5HRV Interpretation</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Age: {input.age} years</span>
              <span>
                Reference: {input.referenceSex === "none" ? "No sex-specific reference" : input.referenceSex === "female" ? "Female" : "Male"}
                {ageBand ? `, ${ageBand} years` : ""}
              </span>
              <span>{formatDate()}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              aria-label="Copy interpretation"
            >
              {copied ? "Copied" : "Copy all"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Print
            </button>
            <button
              type="button"
              onClick={handleNewCalculation}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors"
            >
              New calculation
            </button>
          </div>
        </div>

        {/* Copy status messages */}
        {copied && (
          <div
            role="status"
            aria-live="polite"
            className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-800"
          >
            <span className="mr-1.5" aria-hidden="true">&#10003;</span>
            Interpretation copied to clipboard
          </div>
        )}
        {copyError && (
          <div
            role="alert"
            className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-800"
          >
            Could not copy the interpretation.
          </div>
        )}

        {/* Autonomic score */}
        {interpretation.autonomicScore && (
          <div className="border-b border-border px-6 py-5">
            <AutonomicScoreDisplay score={interpretation.autonomicScore} />
          </div>
        )}

        {/* Primary metrics: RMSSD + SDNN */}
        {primaryMetrics.length > 0 && (
          <div className="border-b border-border px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {primaryMetrics.map((m) => (
                <MetricCard
                  key={m.key}
                  label={m.name}
                  value={m.value}
                  unit={m.unit}
                  category={m.category}
                  categoryLabel={m.categoryLabel}
                  approxPct={m.referencePercentiles ? approxPercentile(m.value, m.referencePercentiles) : null}
                  description={m.interpretation}
                  percentiles={m.referencePercentiles}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other HRV parameters */}
        {secondaryMetrics.length > 0 && (
          <div className="border-b border-border px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {secondaryMetrics.map((m) => (
                <SecondaryMetricCard
                  key={m.key}
                  label={m.key === "lfhf" ? "LF/HF" : m.name}
                  value={m.value}
                  unit={m.unit}
                  description={m.interpretation}
                  limitation={m.limitation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Clinical summary paragraph */}
        {(() => {
          const paragraph = buildClinicalParagraph(interpretation.metrics, interpretation.autonomicScore);
          if (!paragraph) return null;
          return (
            <div className="border-t border-border px-6 py-6">
              <p className="text-base leading-relaxed text-foreground">
                {paragraph}
              </p>
            </div>
          );
        })()}

        {/* Clinical note */}
        <div className="border-t border-border px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {interpretation.clinicalNote}
          </p>
          {interpretation.referenceNote && (
            <p className="mt-2 text-sm text-muted-foreground/70">
              {interpretation.referenceNote}
            </p>
          )}
          <p className="mt-3 text-xs italic text-muted-foreground/60">
            Interpretation assumes an artefact-corrected five-minute NN recording in sinus rhythm under standardised resting conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
