"use client";

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

const hrvReferenceData = {
  male: {
    "18-29": { sdnn: [24.45, 39.33, 52.02, 69.71, 112.1], rmssd: [16.77, 34.43, 51.14, 73.9, 128.8] },
    "30-39": { sdnn: [23.5, 32.86, 42.71, 58.28, 95.73], rmssd: [17.87, 28.38, 39.96, 58.87, 105.8] },
    "40-49": { sdnn: [15.86, 24.8, 34.04, 45.83, 75.14], rmssd: [11.64, 19.92, 29.95, 43.84, 81.32] },
    "50-59": { sdnn: [11.18, 18.69, 26.09, 36.85, 56.43], rmssd: [7.44, 14.67, 22.74, 33.33, 59.92] },
    "60-72": { sdnn: [8.34, 14.73, 19.92, 27.72, 54.97], rmssd: [6.04, 11.93, 17.02, 25.18, 53.64] },
  },
  female: {
    "18-29": { sdnn: [22.5, 36.76, 52.54, 74.06, 123.49], rmssd: [18.88, 35.39, 57.19, 83.87, 171.26] },
    "30-39": { sdnn: [19.64, 30.7, 41.5, 55.67, 103.11], rmssd: [16.79, 28.95, 40.37, 62.52, 118.23] },
    "40-49": { sdnn: [16.13, 25.48, 34.16, 46.03, 73.9], rmssd: [13.27, 22.9, 32.77, 48.62, 83.03] },
    "50-59": { sdnn: [12.27, 20.75, 28.07, 37.38, 60.6], rmssd: [9.45, 17.94, 25.04, 35.73, 62.59] },
    "60-72": { sdnn: [9.0, 14.55, 20.2, 28.36, 47.01], rmssd: [6.79, 12.19, 17.89, 25.83, 51.77] },
  },
};

const ageBands = ["18-29", "30-39", "40-49", "50-59", "60-72"] as const;
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
