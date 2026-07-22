"use client";

import type { MetricInterpretation, PercentileCategory } from "@/lib/types";
import { PercentileBar } from "@/components/PercentileBar";

type MetricCardProps = {
  metricName: string;
  interpretation: MetricInterpretation;
  percentiles?: number[];
};

export function MetricCard({ metricName, interpretation, percentiles }: MetricCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">{metricName}</h3>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">{interpretation.value}</span>
          {interpretation.unit && (
            <span className="text-sm text-muted-foreground ml-1">{interpretation.unit}</span>
          )}
        </div>
      </div>

      <div className="mb-2">
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
          interpretation.percentileCategory
            ? "bg-accent text-accent-foreground"
            : "bg-muted text-muted-foreground"
        }`}>
          {interpretation.label}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-2">{interpretation.explanation}</p>

      {interpretation.limitation && (
        <p className="text-xs text-muted-foreground/80 italic">{interpretation.limitation}</p>
      )}

      {percentiles && (
        <PercentileBar
          value={interpretation.value}
          percentiles={percentiles}
          unit={interpretation.unit}
          metricName={metricName}
        />
      )}
    </div>
  );
}
