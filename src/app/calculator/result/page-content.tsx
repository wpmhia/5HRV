"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { interpretHrv } from "@/lib/interpretHrv";
import { ResultsView } from "@/components/ResultsView";

const referenceSexSchema = z.enum(["female", "male", "none"]);

const RecordingSchema = z.object({
  recordingDate: z.string().optional(),
  durationSeconds: z.number().optional(),
  samplingFrequencyHz: z.number().optional(),
  totalBeats: z.number().optional(),
  sourceFilename: z.string().optional(),
  source: z.literal("bluetooth_rr").optional(),
  deviceName: z.string().optional(),
  posture: z.string().optional(),
  preparationSeconds: z.number().optional(),
  correctedIntervals: z.number().optional(),
  artifactPercentage: z.number().optional(),
  quality: z.enum(["good", "acceptable", "poor"]).optional(),
  engineVersion: z.string().optional(),
});

const MeasurementInputSchema = z.object({
  age: z.number().finite().int().min(18).max(120),
  referenceSex: referenceSexSchema,
  rmssd: z.number().finite().positive().optional(),
  sdnn: z.number().finite().positive().optional(),
  pnn50: z.number().finite().min(0).max(100).optional(),
  hfPower: z.number().finite().positive().optional(),
  lfPower: z.number().finite().nonnegative().optional(),
  lfhfRatio: z.number().finite().nonnegative().optional(),
  lfhfSource: z.enum(["calculated", "manual", "imported"]).optional(),
  recording: RecordingSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.rmssd === undefined && data.sdnn === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least RMSSD or SDNN is required." });
  }
  const hasLfhfRatio = data.lfhfRatio !== undefined;
  if ((data.lfhfSource === "manual" || data.lfhfSource === "imported") && !hasLfhfRatio) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Manual or imported source requires a ratio value." });
  }
});

const StoredPayloadSchema = z.object({
  version: z.literal(1),
  input: MeasurementInputSchema,
});

type StoredPayload = z.infer<typeof StoredPayloadSchema>;

export default function CalculatorResultPageContent() {
  const router = useRouter();
  const [payload, setPayload] = useState<StoredPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("5hrv-result");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const result = StoredPayloadSchema.safeParse(parsed);
        if (result.success) {
          setPayload(result.data);
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
