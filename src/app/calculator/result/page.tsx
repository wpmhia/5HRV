"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HrvInterpretation, MeasurementInput } from "@/lib/types";
import { ResultsView } from "@/components/ResultsView";

type StoredResult = {
  input: MeasurementInput;
  interpretation: HrvInterpretation;
};

export default function CalculatorResultPage() {
  const router = useRouter();
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("5hrv-result");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredResult;
        setStored(parsed);
      } catch {
        setStored(null);
      }
    }
    setLoading(false);
  }, []);

  const content = useMemo(() => {
    if (loading) return null;
    if (!stored) {
      return (
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">
            No calculation result is available.
          </p>
          <button
            type="button"
            onClick={() => router.push("/calculator")}
            className="mt-6 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors"
          >
            Back to calculator
          </button>
        </div>
      );
    }
    return (
      <div className="px-4 py-12 sm:px-6">
        <ResultsView
          interpretation={stored.interpretation}
          input={stored.input}
        />
      </div>
    );
  }, [loading, stored, router]);

  return content;
}
