"use client";

import { useCallback, useRef, useState } from "react";
import type { HrvInterpretation, MeasurementInput } from "@/lib/types";
import { interpretHrv } from "@/lib/interpretHrv";
import { CalculatorForm } from "@/components/CalculatorForm";
import { ResultsView } from "@/components/ResultsView";
import { AboutModal } from "@/components/AboutModal";

export default function Home() {
  const [interpretation, setInterpretation] = useState<HrvInterpretation | null>(null);
  const [lastInput, setLastInput] = useState<MeasurementInput | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-6 sm:px-6">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              5HRV
            </h1>
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="rounded-md px-2 py-1 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              About this calculator
            </button>
          </div>
          <p className="text-sm font-medium text-primary">
            Interpretation of five-minute heart rate variability.
          </p>
          <p className="text-sm text-muted-foreground">
            Enter the measurements from a resting five-minute HRV recording.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-8 print:hidden">
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
      </main>

      <footer className="border-t border-border print:hidden">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            5HRV provides contextual interpretation of five-minute HRV
            measurements for educational and professional reference. It does
            not diagnose disease, replace ECG review or substitute for clinical
            assessment. Calculations run entirely in your browser; entered
            values are not transmitted or stored. Do not enter names,
            identification numbers, exact dates of birth or other directly
            identifiable patient information.
          </p>
        </div>
      </footer>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
