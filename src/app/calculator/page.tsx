"use client";

import { useCallback, useState } from "react";
import type { HrvInterpretation, MeasurementInput } from "@/lib/types";
import { interpretHrv } from "@/lib/interpretHrv";
import { CalculatorForm } from "@/components/CalculatorForm";
import { ResultsView } from "@/components/ResultsView";

export default function CalculatorPage() {
  const [interpretation, setInterpretation] = useState<HrvInterpretation | null>(null);
  const [lastInput, setLastInput] = useState<MeasurementInput | null>(null);

  const handleInterpret = useCallback((input: MeasurementInput) => {
    const result = interpretHrv(input);
    setLastInput(input);
    setInterpretation(result);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          HRV Calculator
        </h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <CalculatorForm onInterpret={handleInterpret} />
      </div>

      {interpretation && lastInput && (
        <ResultsView
          interpretation={interpretation}
          input={lastInput}
        />
      )}
    </div>
  );
}
