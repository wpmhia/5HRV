import type { Confidence } from "@/lib/types";

type Props = {
  confidence: Confidence;
  label: string;
  reasons: string[];
};

const styles: Record<Confidence, string> = {
  high: "border-primary/40 bg-accent",
  moderate: "border-border bg-muted",
  low: "border-border bg-muted",
  "not-valid": "border-destructive/40 bg-muted",
};

const badgeStyles: Record<Confidence, string> = {
  high: "bg-primary text-primary-foreground",
  moderate: "bg-foreground/80 text-background",
  low: "bg-foreground/80 text-background",
  "not-valid": "bg-destructive text-primary-foreground",
};

export function ConfidenceCard({ confidence, label, reasons }: Props) {
  return (
    <section
      aria-labelledby="confidence-heading"
      className={`rounded-lg border p-5 ${styles[confidence]}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="confidence-heading" className="text-base font-semibold text-foreground">
          Recording confidence
        </h2>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${badgeStyles[confidence]}`}
        >
          {label}
        </span>
      </div>
      {reasons.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {reasons.map((reason) => (
            <li
              key={reason}
              className="flex gap-2 text-sm leading-relaxed text-foreground/80"
            >
              <span aria-hidden="true" className="mt-0.5 shrink-0">
                &#x2022;
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
