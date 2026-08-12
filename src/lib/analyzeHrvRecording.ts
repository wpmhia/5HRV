import { correctRrIntervals, type CorrectionResult } from "@/lib/rrArtifactCorrection";
import { calculateHrv, type HrvMetrics } from "@/lib/calculateHrv";
import { assessReferenceCompatibility, ANALYSIS_ENGINE_VERSION } from "@/lib/interpretHrv";
import type { RecordingMetadata } from "@/lib/types";

export type HrvRecordingOptions = {
  /** Length of the exact analysis window in seconds (DanFunD uses 300). */
  analysisDurationSeconds: number;
  /** Minimum accepted sum of complete intervals, in milliseconds. */
  minAnalysedMs: number;
  source?: "bluetooth_rr" | "imported";
  preparationSeconds?: number;
  posture?: string;
  deviceName?: string;
  recordingDate?: string;
  samplingFrequencyHz?: number;
};

export type HrvRecordingAnalysis = {
  ok: boolean;
  rejectionReason?: string;
  metrics?: HrvMetrics;
  correction?: CorrectionResult;
  completeIntervals: number[];
  spectralIntervals: number[];
  analysedDurationMs: number;
  /** Whether the recording protocol matches the five-minute supine DanFunD conditions. */
  protocolCompatible: boolean;
  compatibilityReasons: string[];
  engineVersion: string;
};

export type AnalysisWindow = {
  completeIntervals: number[];
  spectralIntervals: number[];
};

export function extractWindow(rr: number[], windowMs: number): AnalysisWindow {
  const completeIntervals: number[] = [];
  const spectralIntervals: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < rr.length; i++) {
    const interval = rr[i];
    spectralIntervals.push(interval);
    if (cumulative + interval > windowMs) {
      if (i + 1 < rr.length) {
        spectralIntervals.push(rr[i + 1]);
      }
      break;
    }
    completeIntervals.push(interval);
    cumulative += interval;
  }
  return { completeIntervals, spectralIntervals };
}

const failure = (
  rejectionReason: string,
  protocolCompatible = false,
  compatibilityReasons: string[] = [],
): HrvRecordingAnalysis => ({
  ok: false,
  rejectionReason,
  completeIntervals: [],
  spectralIntervals: [],
  analysedDurationMs: 0,
  protocolCompatible,
  compatibilityReasons,
  engineVersion: ANALYSIS_ENGINE_VERSION,
});

export function analyzeHrvRecording(
  rr: number[],
  options: HrvRecordingOptions,
): HrvRecordingAnalysis {
  const analysisDurationMs = options.analysisDurationSeconds * 1000;

  for (const v of rr) {
    if (!Number.isFinite(v) || v <= 0) {
      return failure("Invalid RR interval data received. Please repeat the measurement.");
    }
  }

  const rawMs = rr.reduce((s, v) => s + v, 0);
  if (rawMs < analysisDurationMs) {
    return failure("The recording did not contain a complete five-minute analysis window. Please repeat.");
  }

  const correction = correctRrIntervals(rr);
  if (!correction.usable) {
    return failure(correction.reason ?? "Poor signal quality. Please repeat the measurement.");
  }

  const { completeIntervals, spectralIntervals } = extractWindow(correction.nn, analysisDurationMs);
  const analysedDurationMs = completeIntervals.reduce((s, v) => s + v, 0);
  if (analysedDurationMs < options.minAnalysedMs) {
    return failure("The recording did not contain a complete five-minute analysis window. Please repeat.");
  }

  const metrics = calculateHrv(completeIntervals, {
    analysisDurationMs,
    spectralIntervals,
  });

  const recordingMetadata: RecordingMetadata = {
    source: options.source === "imported" ? undefined : options.source,
    durationSeconds: options.analysisDurationSeconds,
    preparationSeconds: options.preparationSeconds,
    posture: options.posture,
    deviceName: options.deviceName,
    recordingDate: options.recordingDate,
    samplingFrequencyHz: options.samplingFrequencyHz,
  };
  const compatibility = assessReferenceCompatibility(recordingMetadata);

  return {
    ok: true,
    metrics,
    correction,
    completeIntervals,
    spectralIntervals,
    analysedDurationMs,
    protocolCompatible: compatibility.compatible,
    compatibilityReasons: compatibility.reasons,
    engineVersion: ANALYSIS_ENGINE_VERSION,
  };
}
