"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { HrvInterpretation, MeasurementInput } from "@/lib/types";
import { interpretHrv } from "@/lib/interpretHrv";
import { CalculatorForm } from "@/components/CalculatorForm";
import { ResultsView } from "@/components/ResultsView";

export default function CalculatorPage() {
  const [interpretation, setInterpretation] = useState<HrvInterpretation | null>(null);
  const [lastInput, setLastInput] = useState<MeasurementInput | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleInterpret = useCallback((input: MeasurementInput) => {
    const result = interpretHrv(input);
    setLastInput(input);
    setInterpretation(result);
    requestAnimationFrame(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleClear = useCallback(() => {
    setInterpretation(null);
    setLastInput(null);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          HRV Calculator
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Enter the results of a standardized five-minute HRV recording. The
          calculator places RMSSD and SDNN within age- and sex-specific reference
          distributions and provides a structured interpretation of the entered
          metrics.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <CalculatorForm onInterpret={handleInterpret} onClear={handleClear} />
      </div>

      <div ref={resultsRef}>
        {interpretation && lastInput && (
          <ResultsView
            interpretation={interpretation}
            input={lastInput}
            onClear={handleClear}
          />
        )}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
        <p>
          Results are labelled Protocol compatible only when the recording
          conditions have been explicitly confirmed. Without confirmation, the
          result is labelled Interpretation with methodological limitations.
          All results must be integrated with rhythm review, symptoms and other
          clinical findings. &nbsp;
          <Link href="/method" className="text-primary underline-offset-4 hover:underline">
            Learn more about the standardized method
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
