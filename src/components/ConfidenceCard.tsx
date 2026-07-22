"use client";

import type { Confidence } from "@/lib/types";

type ConfidenceCardProps = {
  confidence: Confidence;
  reasons: string[];
};

const confidenceConfig: Record<
  Confidence,
  { label: string; bg: string; text: string }
> = {
  high: {
    label: "High confidence",
    bg: "bg-accent",
    text: "text-accent-foreground",
  },
  moderate: {
    label: "Moderate confidence",
    bg: "bg-accent/60",
    text: "text-accent-foreground",
  },
  low: {
    label: "Low confidence",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
  "not-interpretable": {
    label: "Not interpretable",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
};

export function ConfidenceCard({ confidence, reasons }: ConfidenceCardProps) {
  const config = confidenceConfig[confidence];

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`text-sm font-semibold px-3 py-1 rounded-md ${config.bg} ${config.text}`}
        >
          {config.label}
        </span>
      </div>
      {reasons.length > 0 && (
        <ul className="space-y-1">
          {reasons.map((reason, i) => (
            <li key={i} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-accent-foreground mt-0.5 shrink-0">&#x2022;</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
