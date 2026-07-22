import type { MetricResult } from "@/lib/types";

type Props = { metric: MetricResult };

export function MetricCard({ metric }: Props) {
  const ageSexLabel = metric.referencePercentiles
    ? formatPercentileLabel(metric)
    : null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{metric.name}</h3>
        <p className="text-lg font-bold text-foreground">
          {metric.value}
          {metric.unit && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {metric.unit}
            </span>
          )}
        </p>
      </div>
      {metric.categoryLabel && (
        <span className="mt-2 inline-block rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
          {metric.categoryLabel}
        </span>
      )}
      {ageSexLabel && (
        <p className="mt-1 text-xs text-muted-foreground/80">{ageSexLabel}</p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {metric.interpretation}
      </p>
      {metric.limitation && (
        <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground/80">
          {metric.limitation}
        </p>
      )}
    </div>
  );
}

function formatPercentileLabel(metric: MetricResult): string {
  if (!metric.referencePercentiles) return "";
  const [p5, p25, p50, p75, p95] = metric.referencePercentiles;
  return `Reference: P5 ${p5} \u00B7 P25 ${p25} \u00B7 P50 ${p50} \u00B7 P75 ${p75} \u00B7 P95 ${p95} ${metric.unit}`;
}
