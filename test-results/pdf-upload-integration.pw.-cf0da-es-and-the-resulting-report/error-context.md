# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pdf-upload-integration.pw.ts >> Caroline PDF upload >> uploads the Caroline PDF, verifies extracted values and the resulting report
- Location: tests/pdf-upload-integration.pw.ts:7:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('+55', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('+55', { exact: true })

```

```yaml
- banner:
  - link "5HRV":
    - /url: /
  - navigation "Main":
    - link "Method":
      - /url: /method
    - link "Methodology":
      - /url: /methodology
    - link "Applications":
      - /url: /applications
    - link "Evidence":
      - /url: /evidence
    - link "Calculator":
      - /url: /calculator
    - button "Switch to dark mode"
- main:
  - heading "5HRV Scientific Analysis" [level=2]
  - text: "Age: 33 years Reference: Female, 30-39 years Duration: 5:22 1000 Hz 24 August 2026"
  - button "Copy interpretation": Copy all
  - button "Print"
  - button "New calculation"
  - text: RMSSD 23.14 ms
  - paragraph: Short-term beat-to-beat variability strongly influenced by cardiac vagal modulation.
  - text: SDNN 39.33 ms
  - paragraph: SDNN reflects overall variability during this five-minute recording.
  - text: pNN50 3.28 %
  - paragraph: A vagal-related measure of successive NN-interval variation.
  - paragraph: No validated age- and sex-specific percentile dataset is implemented for pNN50, so no reference category is assigned.
  - text: HF power 70.55 ms²
  - paragraph: Respiratory-frequency variability influenced by cardiac vagal modulation and breathing.
  - paragraph: No universal reference range is applied to HF power; values depend strongly on breathing and analysis settings.
  - text: LF power 416.47 ms²
  - paragraph: LF power reflects mixed autonomic and baroreflex-related influences.
  - paragraph: LF power does not directly measure sympathetic activity and must not be interpreted as a pure sympathetic marker.
  - text: LF/HF 5.9
  - paragraph: Marked relative LF predominance. Calculated from LF and HF.
  - paragraph: LF/HF is not a direct measurement of sympathetic–parasympathetic balance.
  - paragraph: The recording does not match the five-minute supine DanFunD reference conditions, so the values are described without reference-percentile placement or an Autonomic Pattern Score. Interpret the HRV values descriptively and together with the clinical context.
  - paragraph: 5HRV is a scientific HRV calculator that analyses five-minute HRV recordings using peer-reviewed physiological research and published age- and sex-specific reference populations. Clinical interpretation remains the responsibility of the healthcare professional, who integrates these findings with the patient’s history, symptoms, examination, medications, recording conditions and other relevant clinical information. Interpretation assumes that the supplied values originate from a technically valid five-minute HRV analysis.
  - paragraph: The recording duration (5 minutes) does not match the five-minute analysis window of the DanFunD reference protocol.
- contentinfo:
  - heading "5HRV" [level=3]
  - paragraph: A scientific calculator that analyses standardized five-minute HRV recordings using peer-reviewed research and age- and sex-specific reference populations.
  - heading "Pages" [level=3]
  - list:
    - listitem:
      - link "Method":
        - /url: /method
    - listitem:
      - link "Methodology":
        - /url: /methodology
    - listitem:
      - link "Parameters":
        - /url: /parameters
    - listitem:
      - link "Analysis":
        - /url: /interpretation
    - listitem:
      - link "Applications":
        - /url: /applications
    - listitem:
      - link "Evidence":
        - /url: /evidence
    - listitem:
      - link "Calculator":
        - /url: /calculator
    - listitem:
      - link "About":
        - /url: /about
  - heading "Scientific framework" [level=3]
  - paragraph: Developed by Willem Gielen, Cardiologist and Internist, as a transparent approach to standardized five-minute HRV analysis in research and education.
  - paragraph: 5HRV provides contextual interpretation of HRV measurements for educational and professional reference. It does not diagnose disease, replace ECG review or substitute for clinical assessment.
  - text: © 2026 5HRV. All rights reserved.
- alert: HRV Interpretation Result – 5HRV | 5HRV
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { resolve } from "path";
  3  | 
  4  | const CAROLINE_PDF = resolve(__dirname, "fixtures/caroline-hrv-report.pdf");
  5  | 
  6  | test.describe("Caroline PDF upload", () => {
  7  |   test("uploads the Caroline PDF, verifies extracted values and the resulting report", async ({ page }) => {
  8  |     await page.goto("/calculator");
  9  | 
  10 |     const fileInput = page.locator('input[type="file"]');
  11 |     await fileInput.setInputFiles(CAROLINE_PDF);
  12 | 
  13 |     await expect(page.getByText(/values imported/)).toBeVisible({ timeout: 45000 });
  14 | 
  15 |     await expect(page.getByRole("textbox", { name: /RMSSD/ })).toHaveValue("23.14");
  16 |     await expect(page.getByRole("textbox", { name: /SDNN/ })).toHaveValue("39.33");
  17 |     await expect(page.getByRole("textbox", { name: /pNN50/ })).toHaveValue("3.28");
  18 |     await expect(page.getByRole("textbox", { name: /HF power/ })).toHaveValue("70.55");
  19 |     await expect(page.getByRole("textbox", { name: /LF power/ })).toHaveValue("416.47");
  20 |     await expect(page.getByText(/Calculated LF\/HF/)).toContainText("5.90");
  21 | 
  22 |     await page.getByRole("textbox", { name: /Age/ }).fill("33");
  23 |     await page.getByLabel("Reference sex").selectOption("female");
  24 | 
  25 |     await page.getByRole("button", { name: "Interpret" }).click();
  26 |     await expect(page).toHaveURL(/\/calculator\/result/);
  27 | 
  28 |     await expect(page.getByRole("heading", { name: "5HRV Scientific Analysis" })).toBeVisible();
> 29 |     await expect(page.getByText("+55", { exact: true })).toBeVisible();
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  30 |     await expect(page.getByText("Marked sympathetic-direction shift").first()).toBeVisible();
  31 |     await expect(page.getByText("low (P5–P25)", { exact: true })).toBeVisible();
  32 |     await expect(page.getByText("typical (P25–P75)", { exact: true })).toBeVisible();
  33 |     await expect(page.getByText(/Approximately 15th percentile/)).toBeVisible();
  34 |     await expect(page.getByText(/Approximately 45th percentile/)).toBeVisible();
  35 |   });
  36 | });
  37 | 
```