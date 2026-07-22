"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AboutModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-card p-6 shadow-lg sm:rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="about-title" className="text-lg font-semibold text-foreground">
            About this calculator
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-5 text-sm leading-relaxed text-foreground/90">
          <section>
            <h3 className="font-semibold text-foreground">What 5HRV does</h3>
            <p className="mt-1">
              5HRV places RMSSD and SDNN from a single resting five-minute HRV
              recording within age- and sex-stratified reference distributions
              reported by the Danish DanFunD population study. It describes
              spectral metrics (HF, LF and LF/HF) cautiously and assesses how
              closely the recording conditions match the reference protocol.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">What HRV measures</h3>
            <p className="mt-1">
              Heart rate variability describes the variation in time between
              successive normal heartbeats, not the heart rate itself. RMSSD is
              the preferred short-term metric because it captures
              beat-to-beat variation that is strongly influenced by cardiac
              vagal modulation. SDNN reflects overall variability during the
              recording; five-minute SDNN values must not be compared with
              24-hour Holter reference values.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">
              Why LF/HF is interpreted cautiously
            </h3>
            <p className="mt-1">
              LF power reflects mixed autonomic and baroreflex-related
              influences, and HF power is strongly affected by breathing. The
              LF/HF ratio is therefore only a description of the relative
              spectral distribution; it is not a direct measurement of
              sympathetic&#x2013;parasympathetic balance.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">Clinical boundaries</h3>
            <p className="mt-1">
              5HRV does not diagnose POTS, dysautonomia, autonomic neuropathy,
              cardiac autonomic failure, ME/CFS, Long COVID, cardiovascular
              disease, psychological stress or overtraining, and it does not
              recommend medication, supplements, fluid or salt intake, exercise
              or any other treatment. POTS and other orthostatic disorders
              require dedicated supine and upright heart-rate and
              blood-pressure measurements; a resting five-minute HRV recording
              cannot establish the diagnosis.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">Privacy</h3>
            <p className="mt-1">
              All calculations run locally in your browser. Entered values are
              processed locally and are not transmitted to a server. They are
              temporarily retained in this browser tab so the result page can
              be displayed. Do not enter names, identification numbers, exact
              dates of birth or other directly identifiable patient information.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground">References</h3>
            <ol className="mt-1 list-decimal space-y-2 pl-5">
              <li>
                Task Force of the European Society of Cardiology and the North
                American Society of Pacing and Electrophysiology. Heart rate
                variability: standards of measurement, physiological
                interpretation and clinical use. Circulation.
                1996;93:1043&#x2013;1065.
              </li>
              <li>
                Brinth LS, J&#x00F8;rgensen T, Mehlsen J, et al. Normative values
                of short-term heart rate variability in a cross-sectional study
                of a Danish population: the DanFunD study. Scandinavian Journal
                of Public Health. 2024;52:48&#x2013;57. DOI:
                10.1177/14034948221124020.
              </li>
              <li>
                Billman GE. The LF/HF ratio does not accurately measure cardiac
                sympatho-vagal balance. Frontiers in Physiology. 2013;4:26.
                DOI: 10.3389/fphys.2013.00026.
              </li>
            </ol>
            <p className="mt-2">
              Reference implementation and explanatory framework adapted from
              the five-minute HRV teaching material of Willem Gielen,
              Cardiologist and Internist.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
