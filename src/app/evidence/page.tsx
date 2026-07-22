"use client";

export default function EvidencePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Evidence
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        Peer-reviewed references supporting the measurement, interpretation and
        clinical application of five-minute HRV.
      </p>

      <section className="mt-12 space-y-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Standards of measurement and physiological interpretation
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Task Force of the European Society of Cardiology and the North
            American Society of Pacing and Electrophysiology. Heart rate
            variability: standards of measurement, physiological interpretation
            and clinical use. <em>Circulation</em>. 1996;93:1043&ndash;1065.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            The foundational consensus document defining HRV measurement
            standards, time-domain and frequency-domain parameters, and clinical
            applications.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Normative short-term HRV values in a Danish population
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Brinth LS, J&oslash;rgensen T, Mehlsen J, et al. Normative values of
            short-term heart rate variability in a cross-sectional study of a
            Danish population: the DanFunD study. <em>Scandinavian Journal of
            Public Health</em>. 2024;52:48&ndash;57. DOI:
            10.1177/14034948221124020.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Provides the age- and sex-stratified RMSSD and SDNN reference
            percentiles used in the 5HRV calculator.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            The LF/HF ratio and sympathovagal balance
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Billman GE. The LF/HF ratio does not accurately measure cardiac
            sympatho-vagal balance. <em>Frontiers in Physiology</em>.
            2013;4:26. DOI: 10.3389/fphys.2013.00026.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Critical review demonstrating that LF/HF does not provide a direct
            quantitative measurement of sympathetic&ndash;parasympathetic balance.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Short-term HRV methodology
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Shaffer F, Ginsberg JP. An overview of heart rate variability metrics
            and norms. <em>Frontiers in Public Health</em>. 2017;5:258. DOI:
            10.3389/fpubh.2017.00258.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Comprehensive overview of time-domain and frequency-domain HRV
            metrics, measurement conditions, and considerations for clinical
            interpretation.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Respiratory effects on HRV
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Hirsch JA, Bishop B. Respiratory sinus arrhythmia in humans: how
            breathing pattern modulates heart rate variability. <em>American
            Journal of Physiology</em>. 1981;241:H620&ndash;H629. DOI:
            10.1152/ajpheart.1981.241.4.H620.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Demonstrates that respiratory rate and depth significantly influence
            HF power and related HRV metrics, a key consideration for
            frequency-domain interpretation.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            HRV in ME/CFS
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Nelson MJ, Bahl JS, Buckley JD, et al. Evidence of altered cardiac
            autonomic regulation in myalgic encephalomyelitis/chronic fatigue
            syndrome: a systematic review and meta-analysis. <em>Journal of
            Translational Medicine</em>. 2024;22:413. DOI:
            10.1186/s12967-024-05208-3.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Systematic review documenting reduced HRV in ME/CFS populations and
            supporting the use of short-term HRV as a research outcome measure.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            HRV in postural orthostatic tachycardia syndrome (POTS)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Benarroch EE. Postural tachycardia syndrome: a heterogeneous and
            multifactorial disorder. <em>Mayo Clinic Proceedings</em>.
            2012;87:1214&ndash;1225. DOI: 10.1016/j.mayocp.2012.08.013.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Reviews the pathophysiology of POTS including autonomic, cardiovascular
            and neural mechanisms relevant to short-term HRV assessment.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            HRV in Long COVID and post-acute infection syndromes
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Barizien N, Le Guen M, Russel S, et al. Clinical characterization of
            dysautonomia in long COVID-19 patients. <em>Scientific Reports</em>.
            2021;11:14042. DOI: 10.1038/s41598-021-93546-5.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Documents autonomic dysfunction including reduced HRV in post-COVID
            patients, supporting the use of short-term HRV as an objective
            autonomic measure.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            ECG versus PPG validity for HRV
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Plews DJ, Scott B, Altini M, et al. Comparison of HRV metrics
            obtained from ECG and photoplethysmography. <em>European Journal of
            Applied Physiology</em>. 2023. DOI: 10.1007/s00421-023-05253-4.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Compares HRV metrics derived from ECG and PPG, highlighting the
            methodological considerations required when using non-ECG recording
            devices.
          </p>
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Reference implementation and explanatory framework adapted from the
          five-minute HRV teaching material of Willem Gielen, Cardiologist and
          Internist. This reference list is not exhaustive; additional
          peer-reviewed literature should be consulted for specific clinical
          populations and research questions.
        </p>
      </section>
    </div>
  );
}
