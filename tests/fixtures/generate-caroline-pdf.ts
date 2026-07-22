import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "fs";
import { resolve } from "path";

async function generate() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const lines = [
    "HRV Report - Caroline",
    "",
    "Sample Length 322s",
    "Frequency: 1000Hz",
    "Average HR: 74",
    "",
    "SDNN: 39.33",
    "rMSSD: 23.14",
    "pNN50 3.28%",
    "",
    "LF: 416.47",
    "HF: 70.55",
    "LF/HF: 5.90",
    "",
    "Patient: Caroline Smith",
    "DOB: 1985-06-12",
  ];

  let y = height - 50;
  for (const line of lines) {
    page.drawText(line, {
      x: 50,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 18;
  }

  const pdfBytes = await doc.save();
  const outPath = resolve(__dirname, "caroline-hrv-report.pdf");
  writeFileSync(outPath, pdfBytes);
  console.log(`Generated ${outPath}`);
}

generate().catch(console.error);
