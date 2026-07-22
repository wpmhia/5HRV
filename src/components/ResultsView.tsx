"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { HrvInterpretation, MeasurementInput } from "@/lib/types";
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

function AutonomicScoreDisplay({ score }: { score: { value: number; label: string } }) {
  const pct = ((score.value + 100) / 200) * 100;

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
        <div className="relative mt-1 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-stone-300 to-rose-400">
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-card shadow-sm"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="mt-1 text-center text-xs font-semibold text-foreground tabular-nums">
          {score.value > 0 ? "+" : ""}{score.value}
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{score.label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Directional pattern derived from RMSSD and LF/HF. SDNN is reported separately as total short-term variability.
      </p>
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
  lines.push(interpretation.summary);
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
      lines.push(`${m.key === "lfhf" ? "LF/HF" : m.name}: ${m.value}${m.unit ? ` ${m.unit}` : ""}`);
      lines.push(m.interpretation);
      if (m.limitation) lines.push(m.limitation);
      lines.push("");
    }
  }

  lines.push("Interpret HRV together with the ECG, symptoms and clinical context.");
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
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        try {
          textarea.select();
          const successful = document.execCommand("copy");
          if (!successful) throw new Error("Copy command failed");
        } finally {
          document.body.removeChild(textarea);
        }
      }
      setCopied(true);
      setCopyError(false);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
        setCopyError(false);
      }, 2500);
    } catch {
      setCopyError(true);
      setCopied(false);
    }
  }, [interpretation, input]);

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

        {/* Conclusion */}
        {interpretation.summary && (
          <div className="border-b border-border px-6 py-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Conclusion
            </h3>
            <p className="mt-2 text-base leading-relaxed text-foreground">
              {interpretation.summary}
            </p>
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

        {/* Secondary metrics table */}
        {secondaryMetrics.length > 0 && (
          <div className="border-b border-border px-6 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Metric</th>
                  <th className="pb-2 text-right font-medium">Result</th>
                  <th className="pb-2 pl-4 font-medium">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {secondaryMetrics.map((m) => (
                  <tr key={m.key} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-sm font-medium text-foreground">
                      {m.key === "lfhf" ? "LF/HF" : m.name}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">
                      {m.value}
                      {m.unit && <span className="ml-0.5 text-xs text-muted-foreground">{m.unit}</span>}
                      {m.key === "lfhf" && m.interpretation.includes("Calculated") && (
                        <span className="ml-1.5 text-[11px] text-[#286d6d]">Calculated</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-4 text-sm text-muted-foreground">
                      {m.interpretation.replace(/\.$/, "")}
                      {m.limitation && (
                        <span className="block text-xs text-muted-foreground/70">
                          {m.limitation}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Clinical note */}
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {interpretation.clinicalNote}
          </p>
          {interpretation.referenceNote && (
            <p className="mt-2 text-sm text-muted-foreground/70">
              {interpretation.referenceNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
