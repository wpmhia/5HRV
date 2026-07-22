"use client";

import type { PercentileCategory } from "@/lib/types";

type PercentileBarProps = {
  value: number;
  percentiles: number[];
  unit: string;
  metricName: string;
};

export function PercentileBar({ value, percentiles, unit, metricName }: PercentileBarProps) {
  const [p5, p25, p50, p75, p95] = percentiles;
  const maxVal = Math.max(p95 * 1.2, value * 1.1);

  const valuePercent = (value / maxVal) * 100;
  const p5Percent = (p5 / maxVal) * 100;
  const p25Percent = (p25 / maxVal) * 100;
  const p50Percent = (p50 / maxVal) * 100;
  const p75Percent = (p75 / maxVal) * 100;
  const p95Percent = (p95 / maxVal) * 100;

  return (
    <div className="mt-3" role="img" aria-label={`${metricName} reference distribution: value ${value} ${unit}, P5=${p5}, P25=${p25}, P50=${p50}, P75=${p75}, P95=${p95}`}>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>0</span>
        <span>{maxVal.toFixed(0)} {unit}</span>
      </div>
      <div className="relative h-8 bg-muted rounded-md overflow-hidden">
        <div
          className="absolute inset-y-0 bg-accent/60"
          style={{ left: `${p5Percent}%`, width: `${p25Percent - p5Percent}%` }}
        />
        <div
          className="absolute inset-y-0 bg-accent/80"
          style={{ left: `${p25Percent}%`, width: `${p50Percent - p25Percent}%` }}
        />
        <div
          className="absolute inset-y-0 bg-accent"
          style={{ left: `${p50Percent}%`, width: `${p75Percent - p50Percent}%` }}
        />
        <div
          className="absolute inset-y-0 bg-accent/80"
          style={{ left: `${p75Percent}%`, width: `${p95Percent - p75Percent}%` }}
        />
        <div
          className="absolute inset-y-0 bg-muted-foreground/20"
          style={{ left: `${p95Percent}%`, width: `${100 - p95Percent}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground z-10"
          style={{ left: `${Math.min(valuePercent, 99.5)}%` }}
        />
        <div
          className="absolute -translate-x-1/2 text-[10px] font-medium text-foreground z-10"
          style={{
            left: `${Math.min(valuePercent, 98)}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {value} {unit}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>P5</span>
        <span>P25</span>
        <span>P50</span>
        <span>P75</span>
        <span>P95</span>
      </div>
    </div>
  );
}
