"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HrvInterpretation, MeasurementInput } from "@/lib/types";
import { estimatePercentile } from "@/lib/interpretHrv";
import { getAgeBand } from "@/data/hrvReferenceData";
import type { AutonomicProfile } from "@/lib/types";

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

function formatDuration(seconds?: number): string {
  if (seconds === undefined) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(input?: string): string {
  if (!input) {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
  }
  const parts = input.split(/[/-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return new Date(+parts[0], +parts[1] - 1, +parts[2]).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      });
    }
    return new Date(+parts[2], +parts[1] - 1, +parts[0]).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
  }
  return input;
}

function MetricCard({
  label,
  value,
  unit,
  categoryLabel,
  approxPct,
  description,
  percentiles,
}: {
  label: string;
  value: number;
  unit: string;
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

function ConcordanceBadge({ concordance }: { concordance: string }) {
  const colors: Record<string, string> = {
    concordant_sympathetic_shift: "bg-rose-100 text-rose-800 border-rose-200",
    concordant_parasympathetic_shift: "bg-emerald-100 text-emerald-800 border-emerald-200",
    mixed: "bg-amber-100 text-amber-800 border-amber-200",
    central: "bg-stone-100 text-stone-800 border-stone-200",
  };
  const labels: Record<string, string> = {
    concordant_sympathetic_shift: "Sympathetic-direction shift",
    concordant_parasympathetic_shift: "Parasympathetic-direction shift",
    mixed: "Mixed autonomic pattern",
    central: "Central autonomic pattern",
  };
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${colors[concordance] ?? ""}`}>
      {labels[concordance] ?? concordance}
    </span>
  );
}

function AutonomicScoreDisplay({
  score: { value, label, rmssdComponent, lfhfComponent },
  profile,
}: {
  score: { value: number; label: string; rmssdComponent: number; lfhfComponent: number };
  profile?: AutonomicProfile;
}) {
  const rawPosition = ((value + 100) / 200) * 100;
  const markerPosition = Math.min(98, Math.max(2, rawPosition));

  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        5HRV Autonomic Score
      </div>

      {profile && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ConcordanceBadge concordance={profile.concordance} />
          {profile.provisional && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              Provisional
            </span>
          )}
        </div>
      )}

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
            {value > 0 ? "+" : ""}
            {value}
          </div>
        </div>
      </div>

      <p className="mt-2 text-sm font-semibold text-foreground">
        {label}
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
          How this score was calculated
        </summary>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <p>
            The 5HRV Autonomic Score is a directional composite derived from RMSSD and LF/HF. Positive values indicate a shift toward the sympathetic side; negative values indicate a shift toward the parasympathetic side.
          </p>
          {profile && (
            <div className="mt-2 space-y-0.5">
              <span className="block">
                Vagal modulation (RMSSD): {profile.vagal.percentile}th percentile (Z = {profile.vagal.deviationZ.toFixed(2)})
              </span>
              <span className="block">
                Spectral pattern (LF/HF): {profile.spectral.percentile}th percentile (Z = {profile.spectral.deviationZ.toFixed(2)})
              </span>
              <span className="block">
                Concordance: {profile.concordance.replace(/_/g, " ")}
              </span>
            </div>
          )}
          <div className="mt-2 space-y-0.5">
            <span className="block">
              RMSSD component: {rmssdComponent > 0 ? "+" : ""}{rmssdComponent}
            </span>
            <span className="block">
              LF/HF component: {lfhfComponent > 0 ? "+" : ""}{lfhfComponent}
            </span>
            <span className="block font-medium text-foreground">
              Combined score: {value > 0 ? "+" : ""}{value}
            </span>
            <span className="block font-medium text-foreground">
              Classification: {label}
            </span>
          </div>
        </div>
      </details>
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

function buildPlainText(
  interpretation: HrvInterpretation,
  input: MeasurementInput
): string {
  const lines: string[] = [];
  lines.push("5HRV Interpretation");
  lines.push("");
  const ageBand = getAgeBand(input.age);
  const rec = input.recording;
  lines.push(`Age: ${input.age} years`);
  lines.push(
    `Reference: ${input.referenceSex === "none" ? "No sex-specific reference" : input.referenceSex === "female" ? "Female" : "Male"}${ageBand ? `, ${ageBand} years` : ""}`
  );
  if (rec?.recordingDate) {
    lines.push(`Recording date: ${formatDate(rec.recordingDate)}`);
  }
  if (rec?.durationSeconds) {
    lines.push(`Recording duration: ${formatDuration(rec.durationSeconds)}`);
  }
  if (rec?.samplingFrequencyHz) {
    lines.push(`Sampling frequency: ${rec.samplingFrequencyHz} Hz`);
  }
  if (rec?.totalBeats) {
    lines.push(`Analysed intervals: ${rec.totalBeats}`);
  }
  lines.push(`Report generated: ${formatDate()}`);

  if (interpretation.autonomicScore) {
    lines.push("");
    const s = interpretation.autonomicScore;
    lines.push(`5HRV Autonomic Score: ${s.value > 0 ? "+" : ""}${s.value} (${s.label})`);
    lines.push(`  RMSSD component: ${s.rmssdComponent > 0 ? "+" : ""}${s.rmssdComponent}`);
    lines.push(`  LF/HF component: ${s.lfhfComponent > 0 ? "+" : ""}${s.lfhfComponent}`);
  }

  lines.push("");
  for (const m of interpretation.metrics) {
    if (m.key === "rmssd" || m.key === "sdnn") {
      const ref = m.referencePercentiles;
      const pct = ref ? estimatePercentile(m.value, ref) : null;
      lines.push(`${m.name}: ${m.value} ${m.unit}`);
      if (m.categoryLabel) lines.push(`${m.categoryLabel}${pct !== null ? ` \u2014 approximately ${ordinal(pct)} percentile` : ""}`);
      lines.push(m.interpretation);
      if (ref) {
        lines.push(`Reference details: P5: ${ref[0]} \u00B7 P25: ${ref[1]} \u00B7 P50: ${ref[2]} \u00B7 P75: ${ref[3]} \u00B7 P95: ${ref[4]} ${m.unit}`);
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

  lines.push(interpretation.overall);

  lines.push("Interpret HRV together with the ECG, symptoms and clinical context.");
  lines.push("Interpretation assumes an artefact-corrected five-minute NN recording in sinus rhythm under standardised resting conditions.");
  if (hasFrequencyData(input) && !hasRecordingMetadata(input)) {
    lines.push("Frequency-domain interpretation assumes a standardised five-minute recording in sinus rhythm with appropriate artefact correction and spontaneous resting respiration.");
  }
  if (interpretation.referenceNote) {
    lines.push("");
    lines.push(interpretation.referenceNote);
  }
  return lines.join("\n");
}

function hasFrequencyData(input: MeasurementInput): boolean {
  return input.lfPower !== undefined || input.hfPower !== undefined || input.lfhfRatio !== undefined;
}

function hasRecordingMetadata(input: MeasurementInput): boolean {
  const rec = input.recording;
  return rec?.durationSeconds !== undefined || rec?.samplingFrequencyHz !== undefined || rec?.totalBeats !== undefined;
}

export function ResultsView({ interpretation, input }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const ageBand = useMemo(() => getAgeBand(input.age), [input.age]);
  const findings = interpretation.findings;
  const rec = input.recording;

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
              {rec?.recordingDate && (
                <span>Recording: {formatDate(rec.recordingDate)}</span>
              )}
              {rec?.durationSeconds !== undefined && (
                <span>Duration: {formatDuration(rec.durationSeconds)}</span>
              )}
              {rec?.samplingFrequencyHz && (
                <span>{rec.samplingFrequencyHz} Hz</span>
              )}
              {rec?.totalBeats && (
                <span>{rec.totalBeats} intervals</span>
              )}
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
            <AutonomicScoreDisplay score={interpretation.autonomicScore} profile={interpretation.autonomicProfile} />
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
                  categoryLabel={m.categoryLabel}
                  approxPct={m.referencePercentiles ? estimatePercentile(m.value, m.referencePercentiles) : null}
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
        <div className="border-t border-border px-6 py-6">
          <p className="text-base leading-relaxed text-foreground">
            {interpretation.overall}
          </p>
        </div>

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
          {hasFrequencyData(input) && !hasRecordingMetadata(input) && (
            <p className="mt-2 text-xs italic text-muted-foreground/60">
              Frequency-domain interpretation assumes a standardised five-minute recording in sinus rhythm with appropriate artefact correction and spontaneous resting respiration.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
