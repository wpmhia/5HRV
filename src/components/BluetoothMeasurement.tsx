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
import { BleHeartRateSession, isBluetoothAvailable } from "@/lib/bluetoothHeartRate";
import {
  detectArtifacts,
  type RecordingQuality,
} from "@/lib/rrArtifactCorrection";
import type { HrvMetrics } from "@/lib/calculateHrv";
import { analyzeHrvRecording } from "@/lib/analyzeHrvRecording";
import { ANALYSIS_ENGINE_VERSION } from "@/lib/interpretHrv";

const SETTLING_SECONDS = 120;
const RECORDING_SECONDS = 300;
const MIN_ANALYSED_MS = 296_000;
const RR_DETECTION_TIMEOUT_MS = 15_000;
const RR_LOSS_TIMEOUT_MS = 6_000;
const ROLLING_WINDOW_BEATS = 60;

type Phase = "prepare" | "connecting" | "settling" | "recording" | "complete" | "error";

type LiveSignal = "waiting" | "good" | "acceptable" | "poor";

type MeasurementResult = HrvMetrics & {
  correctedIntervals: number;
  artifactPercentage: number;
  quality: RecordingQuality;
  protocolCompatible: boolean;
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

export function BluetoothMeasurement({ onPrefill }: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("prepare");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [rrDetected, setRrDetected] = useState(false);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [settlingRemaining, setSettlingRemaining] = useState(SETTLING_SECONDS);
  const [recordingRemaining, setRecordingRemaining] = useState(RECORDING_SECONDS);
  const [beatsReceived, setBeatsReceived] = useState(0);
  const [signal, setSignal] = useState<LiveSignal>("waiting");
  const [result, setResult] = useState<MeasurementResult | null>(null);

  const sessionRef = useRef<BleHeartRateSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rrTimeoutRef = useRef<number | null>(null);
  const rrDetectedRef = useRef(false);
  const phaseRef = useRef<Phase>("prepare");
  phaseRef.current = phase;
  const openRef = useRef(false);
  openRef.current = open;
  const rrBufferRef = useRef<number[]>([]);
  const settlingStartedAtRef = useRef(0);
  const recordingDurationMsRef = useRef(0);
  const recordingFlushUntilRef = useRef(0);
  const recordingCompleteRef = useRef(false);
  const deviceNameRef = useRef("Polar H10");
  const lastRrReceivedAtRef = useRef<number | null>(null);
  const preparationSecondsRef = useRef(0);
  const autoPrefilledResultRef = useRef<MeasurementResult | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestScreenWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    if (wakeLockRef.current && !wakeLockRef.current.released) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Screen Wake Lock is optional; capture can continue without it.
    }
  }, []);

  const releaseScreenWakeLock = useCallback(() => {
    const lock = wakeLockRef.current;
    wakeLockRef.current = null;
    if (lock) void lock.release().catch(() => undefined);
  }, []);

  const startSettling = useCallback(() => {
    settlingStartedAtRef.current = Date.now();
    setSettlingRemaining(SETTLING_SECONDS);
    setPhase("settling");
  }, []);

  const startRecording = useCallback(() => {
    const lastRrAt = lastRrReceivedAtRef.current;
    if (!lastRrAt || Date.now() - lastRrAt > 5_000) {
      setPhase("error");
      setError(
        "No live RR-interval signal is available. Check the sensor connection and try again.",
      );
      sessionRef.current?.disconnect();
      sessionRef.current = null;
      setConnected(false);
      return;
    }
    rrBufferRef.current = [];
    setBeatsReceived(0);
    setSignal("waiting");
    recordingDurationMsRef.current = 0;
    recordingCompleteRef.current = false;
    recordingFlushUntilRef.current = Date.now() + 5_000;
    setRecordingRemaining(RECORDING_SECONDS);
    setPhase("recording");
  }, []);

  const finishRecording = useCallback(() => {
    if (recordingDurationMsRef.current < MIN_ANALYSED_MS) {
      sessionRef.current?.disconnect();
      sessionRef.current = null;
      setConnected(false);
      setPhase("error");
      setError("The recording did not contain a complete five-minute RR sequence.");
      return;
    }
    const analysis = analyzeHrvRecording(rrBufferRef.current, {
      analysisDurationSeconds: RECORDING_SECONDS,
      minAnalysedMs: MIN_ANALYSED_MS,
      source: "bluetooth_rr",
         // This convenience capture does not claim to document the preceding
         // DanFunD rest period; unknown metadata must not block calculator use.
         preparationSeconds: undefined,
      posture: "supine",
      deviceName: deviceNameRef.current,
    });
    if (!analysis.ok || !analysis.metrics || !analysis.correction) {
      sessionRef.current?.disconnect();
      sessionRef.current = null;
      setConnected(false);
      setPhase("error");
      setError(analysis.rejectionReason ?? "Poor signal quality. Please repeat the measurement.");
      return;
    }
    setResult({
      ...analysis.metrics,
      correctedIntervals: analysis.correction.correctedIntervals,
      artifactPercentage: analysis.correction.artifactPercentage,
      quality: analysis.correction.quality,
      protocolCompatible: analysis.protocolCompatible,
    });
    setPhase("complete");
  }, []);

  const abortRecording = useCallback((message: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    sessionRef.current?.disconnect();
    sessionRef.current = null;
    setConnected(false);
    setRrDetected(false);
    setHeartRate(null);
    rrBufferRef.current = [];
    recordingDurationMsRef.current = 0;
    recordingCompleteRef.current = false;
    lastRrReceivedAtRef.current = null;
    releaseScreenWakeLock();
    setBeatsReceived(0);
    setPhase("error");
    setError(message);
  }, [releaseScreenWakeLock]);

  const updateLiveSignal = useCallback(() => {
    const rr = rrBufferRef.current;
    if (rr.length < 10) return;
    const window = rr.slice(-ROLLING_WINDOW_BEATS);
    const artifact = detectArtifacts(window);
    const pct = (artifact.filter(Boolean).length / window.length) * 100;
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
          preparationSecondsRef.current = SETTLING_SECONDS;
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
        const lastRrAt = lastRrReceivedAtRef.current;
        if (!lastRrAt || Date.now() - lastRrAt > RR_LOSS_TIMEOUT_MS) {
          abortRecording(
            "RR signal lost. The sensor stopped transmitting beat-to-beat intervals; repeat the measurement.",
          );
          return;
        }
        const remaining = Math.max(
          0,
          Math.ceil((RECORDING_SECONDS * 1000 - recordingDurationMsRef.current) / 1000),
        );
        setRecordingRemaining(remaining);
        updateLiveSignal();
      }, 250);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      };
    }
  }, [phase, startSettling, startRecording, finishRecording, updateLiveSignal, abortRecording]);

  const handleConnect = useCallback(async () => {
    if (!isBluetoothAvailable()) {
      setPhase("error");
      setError("Web Bluetooth is not supported in this browser. Use Chrome or Edge.");
      return;
    }
    setPhase("connecting");
    setError(null);
    lastRrReceivedAtRef.current = null;
    void requestScreenWakeLock();
    try {
      const session = await BleHeartRateSession.connect(
        (event) => {
          if (event.heartRate > 0) setHeartRate(event.heartRate);
          if (event.contactSupported && !event.contactDetected) {
            if (phaseRef.current === "settling" || phaseRef.current === "recording") {
              abortRecording(
                "Sensor contact lost. Check the electrode contact and repeat the measurement.",
              );
            }
            return;
          }
          if (event.rrIntervalsMs.length > 0) {
            lastRrReceivedAtRef.current = Date.now();
            if (!rrDetectedRef.current) {
              rrDetectedRef.current = true;
              if (rrTimeoutRef.current) {
                window.clearTimeout(rrTimeoutRef.current);
                rrTimeoutRef.current = null;
              }
            }
            setRrDetected(true);
            if (phaseRef.current === "recording" && Date.now() >= recordingFlushUntilRef.current) {
              rrBufferRef.current.push(...event.rrIntervalsMs);
              recordingDurationMsRef.current += event.rrIntervalsMs.reduce((sum, rr) => sum + rr, 0);
              setBeatsReceived(rrBufferRef.current.length);
              setRecordingRemaining(
                Math.max(0, Math.ceil((RECORDING_SECONDS * 1000 - recordingDurationMsRef.current) / 1000)),
              );
              if (
                recordingDurationMsRef.current >= RECORDING_SECONDS * 1000 &&
                !recordingCompleteRef.current
              ) {
                recordingCompleteRef.current = true;
                finishRecording();
              }
            }
          }
        },
        () => {
          if (phaseRef.current === "settling" || phaseRef.current === "recording") {
            abortRecording(
              "Sensor disconnected. The connection was lost; repeat the measurement.",
            );
          }
        },
      );
      if (!openRef.current) {
        session.disconnect();
        return;
      }
      sessionRef.current = session;
      deviceNameRef.current = session.deviceName;
      setConnected(true);
      rrDetectedRef.current = false;
      if (rrTimeoutRef.current) window.clearTimeout(rrTimeoutRef.current);
      rrTimeoutRef.current = window.setTimeout(() => {
        if (!rrDetectedRef.current) {
          sessionRef.current?.disconnect();
          sessionRef.current = null;
          setConnected(false);
          setPhase("error");
          setError(
            "This device sends heart rate but no RR intervals. A sensor that transmits beat-to-beat RR intervals is required.",
          );
        }
      }, RR_DETECTION_TIMEOUT_MS);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Could not connect to the Polar H10.");
    }
  }, [abortRecording, requestScreenWakeLock]);

  useEffect(() => {
    if (phase === "connecting" && connected && rrDetected) {
      startSettling();
    }
  }, [phase, connected, rrDetected, startSettling]);

  useEffect(() => {
    return () => {
      if (rrTimeoutRef.current) window.clearTimeout(rrTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      sessionRef.current?.disconnect();
      sessionRef.current = null;
      releaseScreenWakeLock();
    };
  }, [releaseScreenWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        (phaseRef.current === "settling" || phaseRef.current === "recording")
      ) {
        void requestScreenWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [requestScreenWakeLock]);

  const closePanel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (rrTimeoutRef.current) {
      window.clearTimeout(rrTimeoutRef.current);
      rrTimeoutRef.current = null;
    }
    sessionRef.current?.disconnect();
    sessionRef.current = null;
    releaseScreenWakeLock();
    setOpen(false);
    setPhase("prepare");
    setError(null);
    setConnected(false);
    setRrDetected(false);
    setHeartRate(null);
    setSettlingRemaining(SETTLING_SECONDS);
    setRecordingRemaining(RECORDING_SECONDS);
    setBeatsReceived(0);
    setSignal("waiting");
    setResult(null);
    autoPrefilledResultRef.current = null;
    rrBufferRef.current = [];
    lastRrReceivedAtRef.current = null;
    preparationSecondsRef.current = 0;
  }, [releaseScreenWakeLock]);

  const handleStop = useCallback(() => {
    closePanel();
  }, [closePanel]);

  const prefillValues = useCallback(() => {
    if (!result) return;
    onPrefill({
      rmssd: round(result.rmssd, 2),
      sdnn: round(result.sdnn, 2),
      pnn50: round(result.pnn50, 1),
      hfPower: round(result.hfPower, 1),
      lfPower: round(result.lfPower, 1),
      ...(result.lfhfRatio !== undefined ? { lfhfRatio: round(result.lfhfRatio, 2) } : {}),
      durationSeconds: RECORDING_SECONDS,
      totalBeats: result.totalBeats,
      measurement: {
        source: "bluetooth_rr",
        deviceName: deviceNameRef.current,
        posture: "supine",
         preparationSeconds: undefined,
        durationSeconds: RECORDING_SECONDS,
        totalBeats: result.totalBeats,
        correctedIntervals: result.correctedIntervals,
        artifactPercentage: round(result.artifactPercentage, 1),
        quality: result.quality,
        engineVersion: ANALYSIS_ENGINE_VERSION,
        protocolCompatible: result.protocolCompatible,
        },
      });
  }, [onPrefill, result]);

  useEffect(() => {
    if (phase === "complete" && result && autoPrefilledResultRef.current !== result) {
      autoPrefilledResultRef.current = result;
      prefillValues();
    }
  }, [phase, result, prefillValues]);

  const handleUseValues = useCallback(() => {
    prefillValues();
    closePanel();
  }, [prefillValues, closePanel]);

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
    closePanel();
    setOpen(true);
  }, [closePanel]);

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
            <DialogTitle>Polar H10 HRV measurement</DialogTitle>
            <DialogDescription>
              Connect your Polar H10 to capture beat-to-beat RR intervals.
            </DialogDescription>
          </DialogHeader>

          {phase === "prepare" && (
            <div className="space-y-4">
              <ul className="space-y-1.5 text-sm text-foreground/85">
                 <li>• Wear the Polar H10 chest strap</li>
                <li>• Lie flat on your back</li>
                <li>• Remain still</li>
                <li>• Breathe normally</li>
                <li>• Do not speak during rest, stabilization, or recording</li>
              </ul>
              <button type="button" onClick={handleConnect} className={actionButtonClass}>
                 Connect Polar H10
              </button>
              <p className="text-xs text-muted-foreground">
                Select <strong>Polar H10</strong> from the Bluetooth device list. The strap must be
                worn with the electrodes moistened and not connected to another app.
              </p>
              <p className="text-xs text-muted-foreground/80">
                Compatibility requires the standard Bluetooth Heart Rate Service
                with RR-interval transmission. Devices that provide heart rate
                only cannot calculate HRV.
              </p>
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
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">Stabilization — remain quietly supine</p>
              {heartRate !== null && (
                <p className="text-3xl font-bold tabular-nums">
                  {heartRate}
                  <span className="ml-1 text-base font-medium text-muted-foreground">bpm</span>
                </p>
              )}
              <p className="text-6xl font-bold tabular-nums">{formatClock(settlingRemaining)}</p>
              <p className="text-xs text-muted-foreground">
                Keep still and breathe normally during the two-minute stabilization.
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
                  <p className="text-xs text-muted-foreground">RR plausibility</p>
                  <p className="text-lg font-semibold">
                    <span>
                      {signal === "waiting" ? "Waiting" : qualityLabel(signal)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">RR intervals received</p>
                  <p className="text-lg font-semibold tabular-nums">{beatsReceived}</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Remain still and breathe normally.
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Keep this page open. The phone screen will be kept awake when supported.
              </p>
              <button type="button" onClick={handleStop} className={secondaryButtonClass}>
                Cancel measurement
              </button>
            </div>
          )}

          {phase === "complete" && result && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Measurement complete</p>
              <p className="text-sm text-muted-foreground">
                The calculated values have been transferred to the calculator.
              </p>
              <div className="space-y-1 rounded-md border border-border bg-muted/50 p-3 text-sm">
                <MetricRow label="RMSSD" value={`${result.rmssd.toFixed(2)} ms`} />
                <MetricRow label="SDNN" value={`${result.sdnn.toFixed(2)} ms`} />
                <MetricRow label="pNN50" value={`${result.pnn50.toFixed(1)}%`} />
                <MetricRow label="HF power" value={`${result.hfPower.toFixed(1)} ms²`} />
                <MetricRow label="LF power" value={`${result.lfPower.toFixed(1)} ms²`} />
                <MetricRow label="LF/HF" value={result.lfhfRatio === undefined ? "Undefined (HF = 0)" : result.lfhfRatio.toFixed(2)} />
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
              {!result.protocolCompatible && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This recording does not match the five-minute supine reference protocol, so the
                  values will be interpreted descriptively without reference-percentile placement
                  or an Autonomic Pattern Score.
                </p>
              )}
              <button type="button" onClick={handleUseValues} className={actionButtonClass}>
                Done
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
