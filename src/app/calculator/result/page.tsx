"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MeasurementInput } from "@/lib/types";
import { interpretHrv } from "@/lib/interpretHrv";
import { ResultsView } from "@/components/ResultsView";

const StoredSchema = {
  version: 1,
} as const;

type StoredPayload = { version: 1; input: MeasurementInput };

function isValidPayload(data: unknown): data is StoredPayload {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  const input = d.input as Record<string, unknown> | undefined;
  if (!input || typeof input !== "object") return false;
  if (typeof input.age !== "number" || typeof input.referenceSex !== "string") return false;
  return true;
}

export default function CalculatorResultPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<StoredPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("5hrv-result");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (isValidPayload(parsed)) {
          setPayload(parsed);
        }
      } catch {
        setPayload(null);
      }
    }
    setLoading(false);
  }, []);

  const content = useMemo(() => {
    if (loading) return null;
    if (!payload) {
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
    const interpretation = interpretHrv(payload.input);
    return (
      <div className="px-4 py-12 sm:px-6">
        <ResultsView
          interpretation={interpretation}
          input={payload.input}
        />
      </div>
    );
  }, [loading, payload, router]);

  return content;
}
