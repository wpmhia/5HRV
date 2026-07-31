"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ParsedReportValues } from "@/lib/parseHrvReport";
import { PolarH10Session, isBluetoothAvailable } from "@/lib/polarH10";
import {
  correctRrIntervals,
  detectArtifacts,
  type RecordingQuality,
} from "@/lib/rrArtifactCorrection";
import { calculateHrv, type HrvMetrics } from "@/lib/calculateHrv";

const SETTLING_SECONDS = 300;
const RECORDING_SECONDS = 300;
const RECORDING_MARGIN_SECONDS = 5;
const RECORDING_TOTAL_SECONDS = RECORDING_SECONDS + RECORDING_MARGIN_SECONDS;
const MIN_ANALYSED_MS = 296_000;

type AnalysisWindow = {
  completeIntervals: number[];
  spectralIntervals: number[];
};

function extractWindow(rr: number[], windowMs: number): AnalysisWindow {
  const completeIntervals: number[] = [];
  const spectralIntervals: number[] = [];
  let cumulative = 0;
  for (const v of rr) {
    spectralIntervals.push(v);
    if (cumulative + v > windowMs) break;
    completeIntervals.push(v);
    cumulative += v;
  }
  return { completeIntervals, spectralIntervals };
}

type Phase = "prepare" | "connecting" | "settling" | "recording" | "complete" | "error";

type MeasurementResult = HrvMetrics & {
  correctedIntervals: number;
  artifactPercentage: number;
  quality: RecordingQuality;
};

type Props = {
  onPrefill: (values: ParsedReportValues) => void;
};

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function qualityLabel(quality: RecordingQuality): string {
  switch (quality) {
    case "good": return "Good";
    case "acceptable": return "Acceptable";
    case "poor": return "Poor";
  }
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}

const actionButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted";

export function PolarMeasurement({ onPrefill }: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("prepare");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [rrDetected, setRrDetected] = useState(false);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [settlingRemaining, setSettlingRemaining] = useState(SETTLING_SECONDS);
  const [recordingRemaining, setRecordingRemaining] = useState(RECORDING_SECONDS);
  const [beatsReceived, setBeatsReceived] = useState(0);
  const [signal, setSignal] = useState<RecordingQuality>("good");
  const [result, setResult] = useState<MeasurementResult | null>(null);

  const sessionRef = useRef<PolarH10Session | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("prepare");
  phaseRef.current = phase;
  const openRef = useRef(false);
  openRef.current = open;
  const rrBufferRef = useRef<number[]>([]);
  const settlingStartedAtRef = useRef(0);
  const recordingStartedAtRef = useRef(0);
  const recordingEndsAtRef = useRef(0);
  const deviceNameRef = useRef("Polar H10");

  const startSettling = useCallback(() => {
    settlingStartedAtRef.current = Date.now();
    setSettlingRemaining(SETTLING_SECONDS);
    setPhase("settling");
  }, []);

  const startRecording = useCallback(() => {
    rrBufferRef.current = [];
    setBeatsReceived(0);
    setSignal("good");
    recordingStartedAtRef.current = Date.now();
    recordingEndsAtRef.current = Date.now() + RECORDING_TOTAL_SECONDS * 1000;
    setRecordingRemaining(RECORDING_TOTAL_SECONDS);
    setPhase("recording");
  }, []);

  const finishRecording = useCallback(() => {
    const elapsedSeconds = (Date.now() - recordingStartedAtRef.current) / 1000;
    if (elapsedSeconds < RECORDING_TOTAL_SECONDS - 0.5) {
      setPhase("error");
      setError("Recording stopped early. A complete five-minute recording is required.");
      return;
    }
    const raw = rrBufferRef.current;
    for (const v of raw) {
      if (!Number.isFinite(v) || v <= 0) {
        setPhase("error");
        setError("Invalid RR interval data received. Please repeat the measurement.");
        return;
      }
    }
    const rawMs = raw.reduce((s, v) => s + v, 0);
    if (rawMs < RECORDING_SECONDS * 1000) {
      setPhase("error");
      setError("The recording did not contain a complete five-minute analysis window. Please repeat.");
      return;
    }
    const correction = correctRrIntervals(raw);
    if (correction.quality === "poor") {
      setPhase("error");
      setError(correction.reason ?? "Poor signal quality. Please repeat the measurement.");
      return;
    }
    const { completeIntervals, spectralIntervals } = extractWindow(
      correction.nn,
      RECORDING_SECONDS * 1000,
    );
    const analysedMs = completeIntervals.reduce((s, v) => s + v, 0);
    if (analysedMs < MIN_ANALYSED_MS) {
      setPhase("error");
      setError("The recording did not contain a complete five-minute analysis window. Please repeat.");
      return;
    }
    const metrics = calculateHrv(completeIntervals, {
      analysisDurationMs: RECORDING_SECONDS * 1000,
      spectralIntervals,
    });
    setResult({
      ...metrics,
      correctedIntervals: correction.correctedIntervals,
      artifactPercentage: correction.artifactPercentage,
      quality: correction.quality,
    });
    setPhase("complete");
  }, []);

  const updateLiveSignal = useCallback(() => {
    const rr = rrBufferRef.current;
    if (rr.length < 10) return;
    const artifact = detectArtifacts(rr);
    const pct = (artifact.filter(Boolean).length / rr.length) * 100;
    if (pct > 5) setSignal("poor");
    else if (pct > 3) setSignal("acceptable");
    else setSignal("good");
  }, []);

  useEffect(() => {
    if (phase === "settling") {
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - settlingStartedAtRef.current) / 1000;
        const remaining = Math.max(0, Math.ceil(SETTLING_SECONDS - elapsed));
        setSettlingRemaining(remaining);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          startRecording();
        }
      }, 250);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      };
    }
    if (phase === "recording") {
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((recordingEndsAtRef.current - Date.now()) / 1000));
        setRecordingRemaining(remaining);
        updateLiveSignal();
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          finishRecording();
        }
      }, 250);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      };
    }
  }, [phase, startRecording, finishRecording, updateLiveSignal]);

  const handleConnect = useCallback(async () => {
    if (!isBluetoothAvailable()) {
      setPhase("error");
      setError("Web Bluetooth is not supported in this browser. Use Chrome or Edge.");
      return;
    }
    setPhase("connecting");
    setError(null);
    try {
      const session = await PolarH10Session.connect((event) => {
        if (event.heartRate > 0) setHeartRate(event.heartRate);
        if (event.rrIntervalsMs.length > 0) {
          setRrDetected(true);
          if (phaseRef.current === "recording") {
            rrBufferRef.current.push(...event.rrIntervalsMs);
            setBeatsReceived(rrBufferRef.current.length);
          }
        }
      });
      if (!openRef.current) {
        session.disconnect();
        return;
      }
      sessionRef.current = session;
      deviceNameRef.current = session.deviceName;
      setConnected(true);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Could not connect to the Polar H10.");
    }
  }, []);

  useEffect(() => {
    if (phase === "connecting" && connected && rrDetected) {
      startSettling();
    }
  }, [phase, connected, rrDetected, startSettling]);

  const handleStop = useCallback(() => {
    finishRecording();
  }, [finishRecording]);

  const closePanel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    sessionRef.current?.disconnect();
    sessionRef.current = null;
    setOpen(false);
    setPhase("prepare");
    setError(null);
    setConnected(false);
    setRrDetected(false);
    setHeartRate(null);
    setSettlingRemaining(SETTLING_SECONDS);
    setRecordingRemaining(RECORDING_TOTAL_SECONDS);
    setBeatsReceived(0);
    setSignal("good");
    setResult(null);
    rrBufferRef.current = [];
  }, []);

  const handleUseValues = useCallback(() => {
    if (!result) return;
    onPrefill({
      rmssd: round(result.rmssd, 2),
      sdnn: round(result.sdnn, 2),
      pnn50: round(result.pnn50, 1),
      hfPower: round(result.hfPower, 1),
      lfPower: round(result.lfPower, 1),
      lfhfRatio: round(result.lfhfRatio, 2),
      durationSeconds: RECORDING_SECONDS,
      totalBeats: result.totalBeats,
      measurement: {
        source: "polar_h10",
        deviceName: deviceNameRef.current,
        posture: "supine",
        preparationSeconds: SETTLING_SECONDS,
        durationSeconds: RECORDING_SECONDS,
        totalBeats: result.totalBeats,
        correctedIntervals: result.correctedIntervals,
        artifactPercentage: round(result.artifactPercentage, 1),
        quality: result.quality,
      },
    });
    closePanel();
  }, [onPrefill, result, closePanel]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      closePanel();
    } else {
      setError(null);
      setPhase("prepare");
      setOpen(true);
    }
  }, [closePanel]);

  const handleRetry = useCallback(() => {
    setError(null);
    setPhase("prepare");
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        Measure with Polar H10
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={phase !== "recording"}
          onInteractOutside={phase === "recording" ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={phase === "recording" ? (e) => e.preventDefault() : undefined}
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Polar H10 measurement</DialogTitle>
            <DialogDescription>5-minute supine HRV measurement</DialogDescription>
          </DialogHeader>

          {phase === "prepare" && (
            <div className="space-y-4">
              <ul className="space-y-1.5 text-sm text-foreground/85">
                <li>• Wear the Polar H10 chest strap</li>
                <li>• Lie flat on your back</li>
                <li>• Remain still</li>
                <li>• Breathe normally</li>
                <li>• Do not speak during the recording</li>
              </ul>
              <button type="button" onClick={handleConnect} className={actionButtonClass}>
                Connect Polar H10
              </button>
            </div>
          )}

          {phase === "connecting" && (
            <div className="space-y-2 text-sm">
              {!connected && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
                  />
                  Connecting to Polar H10…
                </p>
              )}
              {connected && <p className="font-medium text-foreground">Polar H10 connected</p>}
              {heartRate !== null && <p>Heart rate: {heartRate} bpm</p>}
              {rrDetected && <p>RR intervals detected</p>}
            </div>
          )}

          {phase === "settling" && (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-muted-foreground">Rest quietly while lying supine</p>
              <p className="text-6xl font-bold tabular-nums">{formatClock(settlingRemaining)}</p>
              <p className="text-xs text-muted-foreground">
                Measurement begins automatically after the settling period.
              </p>
            </div>
          )}

          {phase === "recording" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recording
                </p>
                <p className="mt-1 text-4xl font-bold tabular-nums">
                  {formatClock(recordingRemaining)}{" "}
                  <span className="text-lg font-medium text-muted-foreground">remaining</span>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-muted/50 p-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Heart rate</p>
                  <p className="text-lg font-semibold tabular-nums">{heartRate ?? "—"} bpm</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Signal</p>
                  <p className="text-lg font-semibold">{qualityLabel(signal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Beats received</p>
                  <p className="text-lg font-semibold tabular-nums">{beatsReceived}</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Remain still and breathe normally.
              </p>
              <button type="button" onClick={handleStop} className={secondaryButtonClass}>
                Stop measurement
              </button>
            </div>
          )}

          {phase === "complete" && result && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Measurement complete</p>
              <div className="space-y-1 rounded-md border border-border bg-muted/50 p-3 text-sm">
                <MetricRow label="RMSSD" value={`${result.rmssd.toFixed(2)} ms`} />
                <MetricRow label="SDNN" value={`${result.sdnn.toFixed(2)} ms`} />
                <MetricRow label="pNN50" value={`${result.pnn50.toFixed(1)}%`} />
                <MetricRow label="HF power" value={`${result.hfPower.toFixed(1)} ms²`} />
                <MetricRow label="LF power" value={`${result.lfPower.toFixed(1)} ms²`} />
                <MetricRow label="LF/HF" value={result.lfhfRatio.toFixed(2)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Recording quality: {qualityLabel(result.quality)}
                <br />
                Corrected intervals: {result.correctedIntervals} of {result.totalBeats} (
                {result.artifactPercentage.toFixed(1)}%)
              </p>
              {result.quality === "acceptable" && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Acceptable recording quality. Values are prefilled, but review the detected
                  artefact rate.
                </p>
              )}
              <button type="button" onClick={handleUseValues} className={actionButtonClass}>
                Use these values
              </button>
            </div>
          )}

          {phase === "error" && (
            <div className="space-y-4">
              <p role="alert" className="text-sm text-destructive">{error}</p>
              <div className="flex gap-2">
                <button type="button" onClick={handleRetry} className={secondaryButtonClass}>
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className={actionButtonClass}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
