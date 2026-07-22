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
            Nelson MJ, Bahl JS, Buckley JD, Thomson RL, Davison K. Evidence of
            altered cardiac autonomic regulation in myalgic
            encephalomyelitis/chronic fatigue syndrome: a systematic review and
            meta-analysis. <em>Medicine (Baltimore)</em>. 2019;98(43):e17600.
            DOI: 10.1097/MD.0000000000017600.
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
            Swai J, Hu Z, Zhao X, Rugambwa T, Ming G. Heart rate and heart rate
            variability comparison between postural orthostatic tachycardia
            syndrome versus healthy participants: a systematic review and
            meta-analysis. <em>BMC Cardiovascular Disorders</em>.
            2019;19:320. DOI: 10.1186/s12872-019-01298-y.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Systematic review and meta-analysis documenting heart rate and HRV
            differences between POTS patients and healthy controls, supporting
            the use of short-term HRV as an objective autonomic measure in POTS
            research.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Pathophysiology of POTS
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
            Assessed autonomic function in post-COVID patients using the
            multiparameter NOL index rather than conventional direct RMSSD, SDNN,
            HF and LF analysis. The authors explicitly called for future studies
            using direct HRV measurement.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            ECG versus PPG validity for HRV
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Plews DJ, Scott B, Altini M, Wood M, Kilding AE, Laursen PB.
            Comparison of Heart-Rate-Variability Recording With Smartphone
            Photoplethysmography, Polar H7 Chest Strap, and
            Electrocardiography. <em>International Journal of Sports Physiology
            and Performance</em>. 2017;12(10):1324&ndash;1328. DOI:
            10.1123/ijspp.2016-0668.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Compares HRV metrics derived from ECG, chest strap and PPG,
            highlighting the methodological considerations required when using
            non-ECG recording devices.
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
