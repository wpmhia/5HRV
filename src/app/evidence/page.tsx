import type { Metadata } from "next";
import { pages } from "@/lib/seo";

export const metadata: Metadata = {
  title: pages.evidence.title,
  description: pages.evidence.description,
};

export default function EvidencePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Evidence
      </h1>
      <p className="mt-2 text-base leading-7 text-muted-foreground">
        Peer-reviewed references supporting the measurement, interpretation and
        clinical application of five-minute HRV.
      </p>

      <section className="mt-8 space-y-4">
        <p className="text-base leading-7 text-foreground/85">
          The 5HRV method is built on a foundation of published research
          spanning measurement standards, population reference values,
          physiological interpretation and clinical applications. The following
          references are organized by topic area. This list is not exhaustive;
          additional peer-reviewed literature should be consulted for specific
          clinical populations and research questions.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Standards and methodology
        </h2>
        <ol className="mt-4 list-decimal space-y-5 pl-6 text-sm leading-6">
          <li>
            Task Force of the European Society of Cardiology and the North
            American Society of Pacing and Electrophysiology. Heart rate
            variability: standards of measurement, physiological interpretation
            and clinical use. <em>Circulation</em>. 1996;93:1043&ndash;1065.
            <span className="block text-muted-foreground">
              Foundational standard for HRV measurement and analysis.
            </span>
          </li>
          <li>
            Shaffer F, Ginsberg JP. An overview of heart rate variability
            metrics and norms. <em>Frontiers in Public Health</em>.
            2017;5:258.{" "}
            <a
              href="https://doi.org/10.3389/fpubh.2017.00258"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.3389/fpubh.2017.00258
            </a>
            <span className="block text-muted-foreground">
              Comprehensive overview of time-domain and frequency-domain HRV
              metrics, measurement conditions and considerations for clinical
              interpretation.
            </span>
          </li>
        </ol>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Population reference values
        </h2>
        <ol className="mt-4 list-decimal space-y-5 pl-6 text-sm leading-6" start={3}>
          <li>
            Brinth LS, J&oslash;rgensen T, Mehlsen J, et al. Normative values
            of short-term heart rate variability in a cross-sectional study of a
            Danish population: the DanFunD study. <em>Scandinavian Journal of
            Public Health</em>. 2024;52:48&ndash;57.{" "}
            <a
              href="https://doi.org/10.1177/14034948221124020"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.1177/14034948221124020
            </a>
            <span className="block text-muted-foreground">
              Provides the age- and sex-stratified RMSSD and SDNN reference
              percentiles used in the 5HRV calculator.
            </span>
          </li>
        </ol>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Physiological interpretation
        </h2>
        <ol className="mt-4 list-decimal space-y-5 pl-6 text-sm leading-6" start={4}>
          <li>
            Billman GE. The LF/HF ratio does not accurately measure cardiac
            sympatho-vagal balance. <em>Frontiers in Physiology</em>.
            2013;4:26.{" "}
            <a
              href="https://doi.org/10.3389/fphys.2013.00026"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.3389/fphys.2013.00026
            </a>
            <span className="block text-muted-foreground">
              Critical review demonstrating that LF/HF does not provide a
              direct quantitative measurement of sympathetic&ndash;parasympathetic
              balance.
            </span>
          </li>
          <li>
            Hirsch JA, Bishop B. Respiratory sinus arrhythmia in humans: how
            breathing pattern modulates heart rate variability. <em>American
            Journal of Physiology</em>. 1981;241:H620&ndash;H629.{" "}
            <a
              href="https://doi.org/10.1152/ajpheart.1981.241.4.H620"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.1152/ajpheart.1981.241.4.H620
            </a>
            <span className="block text-muted-foreground">
              Demonstrates that respiratory rate and depth significantly
              influence HF power and related HRV metrics.
            </span>
          </li>
        </ol>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Recording technology
        </h2>
        <ol className="mt-4 list-decimal space-y-5 pl-6 text-sm leading-6" start={6}>
          <li>
            Plews DJ, Scott B, Altini M, Wood M, Kilding AE, Laursen PB.
            Comparison of Heart-Rate-Variability Recording With Smartphone
            Photoplethysmography, Polar H7 Chest Strap, and
            Electrocardiography. <em>International Journal of Sports
            Physiology and Performance</em>. 2017;12(10):1324&ndash;1328.{" "}
            <a
              href="https://doi.org/10.1123/ijspp.2016-0668"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.1123/ijspp.2016-0668
            </a>
            <span className="block text-muted-foreground">
              Compares HRV metrics derived from ECG, chest strap and PPG.
            </span>
          </li>
        </ol>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Clinical and research applications
        </h2>
        <ol className="mt-4 list-decimal space-y-5 pl-6 text-sm leading-6" start={7}>
          <li>
            Nelson MJ, Bahl JS, Buckley JD, Thomson RL, Davison K. Evidence
            of altered cardiac autonomic regulation in myalgic
            encephalomyelitis/chronic fatigue syndrome: a systematic review
            and meta-analysis. <em>Medicine (Baltimore)</em>.
            2019;98(43):e17600.{" "}
            <a
              href="https://doi.org/10.1097/MD.0000000000017600"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.1097/MD.0000000000017600
            </a>
            <span className="block text-muted-foreground">
              Systematic review documenting reduced HRV in ME/CFS populations.
            </span>
          </li>
          <li>
            Swai J, Hu Z, Zhao X, Rugambwa T, Ming G. Heart rate and heart
            rate variability comparison between postural orthostatic tachycardia
            syndrome versus healthy participants: a systematic review and
            meta-analysis. <em>BMC Cardiovascular Disorders</em>.
            2019;19:320.{" "}
            <a
              href="https://doi.org/10.1186/s12872-019-01298-y"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.1186/s12872-019-01298-y
            </a>
            <span className="block text-muted-foreground">
              Systematic review and meta-analysis of HRV differences between
              POTS patients and healthy controls.
            </span>
          </li>
          <li>
            Benarroch EE. Postural tachycardia syndrome: a heterogeneous and
            multifactorial disorder. <em>Mayo Clinic Proceedings</em>.
            2012;87:1214&ndash;1225.{" "}
            <a
              href="https://doi.org/10.1016/j.mayocp.2012.08.013"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.1016/j.mayocp.2012.08.013
            </a>
            <span className="block text-muted-foreground">
              Reviews the pathophysiology of POTS including autonomic,
              cardiovascular and neural mechanisms.
            </span>
          </li>
          <li>
            Barizien N, Le Guen M, Russel S, et al. Clinical characterization
            of dysautonomia in long COVID-19 patients. <em>Scientific
            Reports</em>. 2021;11:14042.{" "}
            <a
              href="https://doi.org/10.1038/s41598-021-93546-5"
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOI: 10.1038/s41598-021-93546-5
            </a>
            <span className="block text-muted-foreground">
              Assessed autonomic function in post-COVID patients and called for
              future studies using direct HRV measurement.
            </span>
          </li>
        </ol>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <p className="text-sm leading-6 text-muted-foreground">
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
