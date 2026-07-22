import type { MetricResult } from "@/lib/types";

export function MetricCard({ metric }: { metric: MetricResult }) {
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
