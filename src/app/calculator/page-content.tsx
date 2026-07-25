"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MeasurementInput } from "@/lib/types";
import { interpretHrv } from "@/lib/interpretHrv";
import { CalculatorForm } from "@/components/CalculatorForm";

export default function CalculatorPageContent() {
  const router = useRouter();

  const handleInterpret = useCallback((input: MeasurementInput) => {
    const payload = { version: 1, input };
    sessionStorage.setItem("5hrv-result", JSON.stringify(payload));
    router.push("/calculator/result");
  }, [router]);

  const handleClear = useCallback(() => {
    sessionStorage.removeItem("5hrv-result");
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Calculator
        </h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <CalculatorForm
          onInterpret={handleInterpret}
          onClear={handleClear}
        />
      </div>
    </div>
  );
}
