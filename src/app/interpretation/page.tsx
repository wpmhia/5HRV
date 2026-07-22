"use client";

import Link from "next/link";
import { hrvReferenceData, ageBands } from "@/data/hrvReferenceData";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const percentiles = ["P5", "P25", "P50", "P75", "P95"] as const;

function ReferenceTable({
  metric,
  title,
}: {
  metric: "rmssd" | "sdnn";
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          DanFunD population reference percentiles (ms)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Age band</TableHead>
              {percentiles.map((p) => (
                <TableHead key={p} className="text-right">
                  Female {p}
                </TableHead>
              ))}
              {percentiles.map((p) => (
                <TableHead key={p} className="text-right">
                  Male {p}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ageBands.map((band) => {
              const female = hrvReferenceData.female[band][metric];
              const male = hrvReferenceData.male[band][metric];
              return (
                <TableRow key={band}>
                  <TableCell className="font-medium">{band}</TableCell>
                  {female.map((v, i) => (
                    <TableCell key={`f-${i}`} className="text-right tabular-nums">
                      {v.toFixed(2)}
                    </TableCell>
                  ))}
                  {male.map((v, i) => (
                    <TableCell key={`m-${i}`} className="text-right tabular-nums">
                      {v.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function InterpretationPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Clinical Interpretation
        </h1>
        <p className="mt-2 text-muted-foreground">
          A structured framework for interpreting short-term HRV measurements.
        </p>
      </header>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Interpretation principles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              HRV must be interpreted in the context of the individual and the
              recording. The following factors should be considered:
            </p>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3 lg:grid-cols-5">
              {[
                "Age",
                "Reference sex",
                "Recording method",
                "Body position",
                "Heart rate",
                "Rhythm",
                "Artefacts",
                "Breathing",
                "Medication",
                "Clinical presentation",
              ].map((factor) => (
                <span
                  key={factor}
                  className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-center font-medium text-foreground"
                >
                  {factor}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age and sex</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              HRV generally decreases with age and differs between male and
              female reference populations. The DanFunD study provides RMSSD and
              SDNN reference percentiles for short-term recordings.
            </p>
            <div className="space-y-6">
              <ReferenceTable metric="rmssd" title="RMSSD reference percentiles" />
              <ReferenceTable metric="sdnn" title="SDNN reference percentiles" />
            </div>
            <p className="text-xs italic text-muted-foreground">
                These are population reference distributions, not disease
                thresholds.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Primary normative reference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The DanFunD study, based on 6,891 Danish adults aged 18–72
                years, provides the age- and sex-specific RMSSD and SDNN
                percentiles used by 5HRV. For HF, LF and LF/HF, cautious
                descriptive interpretation is recommended because spectral
                values are especially sensitive to breathing and analysis
                methodology.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                See the{" "}
                <Link
                  href="/evidence"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Evidence page
                </Link>{" "}
                for the full citation and supporting references.
              </p>
            </CardContent>
          </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interpretation patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Reduced RMSSD
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Reduced short-term beat-to-beat variability with reduced
                vagal-related modulation under the recording conditions.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Reduced SDNN
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Reduced overall variability during the five-minute recording.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Reduced RMSSD and SDNN
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                A combined reduction in rapid beat-to-beat variation and overall
                short-term variability.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Reduced RMSSD with preserved SDNN
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Relatively reduced beat-to-beat vagal-related variability with
                better-preserved total five-minute variability.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Preserved RMSSD with reduced SDNN
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Reduced overall short-term variability without a corresponding
                reduction in RMSSD.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">
                High HRV values
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Values above upper reference percentiles may be physiological
                but prompt review of: bradycardia, ectopic beats, rhythm
                irregularity, artefacts, breathing pattern, analysis quality.
              </p>
              <p className="mt-1.5 text-xs font-medium italic text-muted-foreground">
                Higher HRV is not automatically better.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spectral interpretation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Reduced RMSSD and reduced HF:
                                </span>{" "}
                may support reduced rapid and respiratory-frequency vagal-related
                variation.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Normal or central RMSSD with low HF:
                </span>{" "}
                may reflect breathing pattern, respiratory rate, spectral
                processing or methodological differences.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Elevated LF/HF:
                </span>{" "}
                describe as relative LF predominance only. Cannot independently
                establish sympathetic overactivity.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worked interpretation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "RMSSD", value: "30.40 ms" },
                { label: "SDNN", value: "47.63 ms" },
                { label: "HF", value: "125.95 ms²" },
                { label: "LF/HF", value: "3.28" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border bg-muted/30 p-3 text-center"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The LF/HF ratio demonstrates relative LF predominance. RMSSD and
              SDNN must be interpreted against age- and sex-specific reference
              percentiles. The result does not by itself prove sympathetic
              overactivity or vagal failure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
