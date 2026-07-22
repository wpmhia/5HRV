import type { Confidence } from "@/lib/types";

type Props = {
  confidence: Confidence;
  label: string;
  reasons: string[];
};

const styles: Record<Confidence, string> = {
  high: "border-[#286d6d]/40 bg-[#e8f4f4] dark:bg-[#1a3a3a]",
  moderate: "border-amber-500/40 bg-amber-50 dark:bg-amber-950/20",
  low: "border-amber-500/40 bg-amber-50 dark:bg-amber-950/20",
  "not-valid": "border-destructive/40 bg-muted",
};

const badgeStyles: Record<Confidence, string> = {
  high: "bg-[#286d6d] text-white",
  moderate: "bg-amber-600 text-white",
  low: "bg-amber-600 text-white",
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
          Methodological assessment
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
