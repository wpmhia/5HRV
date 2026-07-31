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

Locator: getByText('+55')
Expected: visible
Error: strict mode violation: getByText('+55') resolved to 2 elements:
    1) <div ideavo-tag-name="div" ideavo-styles-editable="true" ideavo-content-editable="false" ideavo-tag-id="src/components/ResultsView.tsx:223:10" class="absolute top-4 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-foreground tabular-nums">+55</div> aka getByText('+55', { exact: true })
    2) <span ideavo-tag-name="span" ideavo-styles-editable="true" ideavo-content-editable="false" class="block font-medium text-foreground" ideavo-tag-id="src/components/ResultsView.tsx:275:12">Pattern score: +55</span> aka getByText('Pattern score: +')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('+55')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "5HRV" [ref=e4] [cursor=pointer]:
        - /url: /
      - navigation "Main" [ref=e5]:
        - link "Method" [ref=e6] [cursor=pointer]:
          - /url: /method
        - link "Methodology" [ref=e7] [cursor=pointer]:
          - /url: /methodology
        - link "Applications" [ref=e8] [cursor=pointer]:
          - /url: /applications
        - link "Evidence" [ref=e9] [cursor=pointer]:
          - /url: /evidence
        - link "Calculator" [ref=e10] [cursor=pointer]:
          - /url: /calculator
        - button "Switch to dark mode" [ref=e11]:
          - img [ref=e12]
  - main [ref=e14]:
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - heading "5HRV Scientific Analysis" [level=2] [ref=e20]
          - generic [ref=e21]:
            - generic [ref=e22]: "Age: 33 years"
            - generic [ref=e23]: "Reference: Female, 30-39 years"
            - generic [ref=e24]: 31 July 2026
        - generic [ref=e25]:
          - button "Copy interpretation" [ref=e26]: Copy all
          - button "Print" [ref=e27]
          - button "New calculation" [ref=e28]
      - generic [ref=e30]:
        - generic [ref=e31]: 5HRV Scientific Autonomic Pattern Score
        - generic [ref=e33]: Sympathetic-direction shift (concordant)
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]: Parasympathetic
            - generic [ref=e37]: Sympathetic
          - generic [ref=e41]: "+55"
        - paragraph [ref=e42]: Marked sympathetic-direction shift
        - group [ref=e43]:
          - generic "How this score was calculated" [ref=e44] [cursor=pointer]
      - generic [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]: RMSSD
          - generic [ref=e49]:
            - generic [ref=e50]: "23.14"
            - generic [ref=e51]: ms
          - generic [ref=e52]:
            - generic [ref=e53]: low (P5–P25)
            - generic [ref=e54]: Approximately 15th percentile
          - paragraph [ref=e55]: RMSSD is low relative to the selected reference population, consistent with reduced cardiac vagal modulation.
          - group [ref=e56]:
            - generic "Reference details" [ref=e57] [cursor=pointer]
        - generic [ref=e58]:
          - generic [ref=e59]: SDNN
          - generic [ref=e60]:
            - generic [ref=e61]: "39.33"
            - generic [ref=e62]: ms
          - generic [ref=e63]:
            - generic [ref=e64]: typical (P25–P75)
            - generic [ref=e65]: Approximately 45th percentile
          - paragraph [ref=e66]: SDNN is within the typical range for the selected reference population.
          - group [ref=e67]:
            - generic "Reference details" [ref=e68] [cursor=pointer]
      - generic [ref=e70]:
        - generic [ref=e71]:
          - generic [ref=e72]: pNN50
          - generic [ref=e73]:
            - generic [ref=e74]: "3.28"
            - generic [ref=e75]: "%"
          - paragraph [ref=e76]: A vagal-related measure of successive NN-interval variation.
          - paragraph [ref=e77]: No validated age- and sex-specific percentile dataset is implemented for pNN50, so no reference category is assigned.
        - generic [ref=e78]:
          - generic [ref=e79]: HF power
          - generic [ref=e80]:
            - generic [ref=e81]: "70.55"
            - generic [ref=e82]: ms²
          - paragraph [ref=e83]: Respiratory-frequency variability influenced by cardiac vagal modulation and breathing.
          - paragraph [ref=e84]: No universal reference range is applied to HF power; values depend strongly on breathing and analysis settings.
        - generic [ref=e85]:
          - generic [ref=e86]: LF power
          - generic [ref=e87]:
            - generic [ref=e88]: "416.47"
            - generic [ref=e89]: ms²
          - paragraph [ref=e90]: LF power reflects mixed autonomic and baroreflex-related influences.
          - paragraph [ref=e91]: LF power does not directly measure sympathetic activity and must not be interpreted as a pure sympathetic marker.
        - generic [ref=e92]:
          - generic [ref=e93]: LF/HF
          - generic [ref=e95]: "5.9"
          - generic [ref=e96]: very high (above P95)
          - paragraph [ref=e97]: Very high relative to the reference population, indicating marked LF predominance. Calculated from LF and HF.
          - paragraph [ref=e98]: LF/HF is not a direct measurement of sympathetic–parasympathetic balance.
      - paragraph [ref=e100]: SDNN 39.33 ms is within the typical (P25–P75) reference range for women aged 30-39, at approximately the 45th percentile. RMSSD 23.14 ms is within the low (P5–P25) reference range for women aged 30-39, at approximately the 15th percentile, indicating reduced short-term parasympathetic activity. The frequency-domain pattern shows marked relative LF predominance, with an LF/HF ratio of 5.9. The recording shows preserved overall variability, reduced parasympathetic activity and a marked sympathetic-direction shift. Serial measurements under standardised conditions are more informative than a single recording.
      - paragraph [ref=e102]: 5HRV is a scientific HRV calculator that analyses five-minute HRV recordings using peer-reviewed physiological research and published age- and sex-specific reference populations. Clinical interpretation remains the responsibility of the healthcare professional, who integrates these findings with the patient’s history, symptoms, examination, medications, recording conditions and other relevant clinical information. Interpretation assumes that the supplied values originate from a technically valid five-minute HRV analysis.
  - contentinfo [ref=e103]:
    - generic [ref=e104]:
      - generic [ref=e105]:
        - generic [ref=e106]:
          - heading "5HRV" [level=3] [ref=e107]
          - paragraph [ref=e108]: A scientific calculator that analyses standardized five-minute HRV recordings using peer-reviewed research and age- and sex-specific reference populations.
        - generic [ref=e109]:
          - heading "Pages" [level=3] [ref=e110]
          - list [ref=e111]:
            - listitem [ref=e112]:
              - link "Method" [ref=e113] [cursor=pointer]:
                - /url: /method
            - listitem [ref=e114]:
              - link "Methodology" [ref=e115] [cursor=pointer]:
                - /url: /methodology
            - listitem [ref=e116]:
              - link "Parameters" [ref=e117] [cursor=pointer]:
                - /url: /parameters
            - listitem [ref=e118]:
              - link "Analysis" [ref=e119] [cursor=pointer]:
                - /url: /interpretation
            - listitem [ref=e120]:
              - link "Applications" [ref=e121] [cursor=pointer]:
                - /url: /applications
            - listitem [ref=e122]:
              - link "Evidence" [ref=e123] [cursor=pointer]:
                - /url: /evidence
            - listitem [ref=e124]:
              - link "Calculator" [ref=e125] [cursor=pointer]:
                - /url: /calculator
            - listitem [ref=e126]:
              - link "About" [ref=e127] [cursor=pointer]:
                - /url: /about
        - generic [ref=e128]:
          - heading "Scientific framework" [level=3] [ref=e129]
          - paragraph [ref=e130]: Developed by Willem Gielen, Cardiologist and Internist, as a transparent approach to standardized five-minute HRV analysis in research and education.
          - paragraph [ref=e131]: 5HRV provides contextual interpretation of HRV measurements for educational and professional reference. It does not diagnose disease, replace ECG review or substitute for clinical assessment.
      - generic [ref=e132]: © 2026 5HRV. All rights reserved.
  - alert [ref=e133]: HRV Interpretation Result – 5HRV | 5HRV
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
> 29 |     await expect(page.getByText("+55")).toBeVisible();
     |                                         ^ Error: expect(locator).toBeVisible() failed
  30 |     await expect(page.getByText("Marked sympathetic-direction shift").first()).toBeVisible();
  31 |     await expect(page.getByText("low (P5–P25)")).toBeVisible();
  32 |     await expect(page.getByText("typical (P25–P75)")).toBeVisible();
  33 |     await expect(page.getByText(/15th percentile/).first()).toBeVisible();
  34 |     await expect(page.getByText(/45th percentile/).first()).toBeVisible();
  35 |   });
  36 | });
  37 | 
```