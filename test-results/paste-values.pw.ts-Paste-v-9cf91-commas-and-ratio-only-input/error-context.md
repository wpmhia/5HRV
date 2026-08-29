# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: paste-values.pw.ts >> Paste values >> accepts decimal commas and ratio-only input
- Location: tests/paste-values.pw.ts:23:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('textbox', { name: 'Pasted HRV report values' })

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
  - main [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - heading "Calculator" [level=1] [ref=e15]
        - paragraph [ref=e16]: Enter HRV values manually or import them from an existing report.
      - generic [ref=e18]:
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]:
              - text: Age*
              - generic [ref=e24]: (years)
            - textbox "Age*(years)" [ref=e25]
            - paragraph [ref=e26]: Age-specific reference percentiles cover 18–72 years.
          - generic [ref=e27]:
            - text: Reference sex
            - combobox "Reference sex" [ref=e28]:
              - option "Select reference sex" [disabled] [selected]
              - option "Female"
              - option "Male"
              - option "No sex-specific reference"
        - region "HRV values" [ref=e29]:
          - heading "HRV values" [level=2] [ref=e31]
          - generic "Optional ways to fill HRV values" [ref=e32]:
            - generic [ref=e33]: "Optional:"
            - generic [ref=e34]:
              - generic [ref=e36]:
                - button "Upload report" [ref=e37]
                - button "Paste values" [active] [ref=e38]
              - button "Measure with Polar H10" [ref=e39]
          - paragraph [ref=e40]: Decimal points and decimal commas are both accepted. At least RMSSD or SDNN is required.
          - generic [ref=e41]:
            - generic [ref=e42]:
              - generic [ref=e43]:
                - text: RMSSD
                - generic [ref=e44]: (ms)
              - textbox "RMSSD(ms)" [ref=e45]
              - paragraph [ref=e46]: Primary five-minute HRV metric.
            - generic [ref=e47]:
              - generic [ref=e48]:
                - text: SDNN
                - generic [ref=e49]: (ms)
              - textbox "SDNN(ms)" [ref=e50]
              - paragraph [ref=e51]: Overall variability during the five-minute recording.
            - generic [ref=e53]:
              - generic [ref=e54]:
                - text: pNN50
                - generic [ref=e55]: (%)
              - textbox "pNN50(%)" [ref=e56]
            - group "Frequency-domain data" [ref=e58]:
              - generic [ref=e59]: Frequency-domain data
              - radiogroup "Frequency input mode" [ref=e60]:
                - generic [ref=e61] [cursor=pointer]:
                  - radio "LF and HF power" [checked] [ref=e62]
                  - text: LF and HF power
                - generic [ref=e63] [cursor=pointer]:
                  - radio "LF/HF ratio only" [ref=e64]
                  - text: LF/HF ratio only
            - generic [ref=e65]:
              - generic [ref=e66]:
                - text: HF power
                - generic [ref=e67]: (ms²)
              - textbox "HF power(ms²)" [ref=e68]
              - paragraph [ref=e69]: Enter absolute spectral power in ms². Do not enter normalized units, percentages or log-transformed values.
            - generic [ref=e70]:
              - generic [ref=e71]:
                - text: LF power
                - generic [ref=e72]: (ms²)
              - textbox "LF power(ms²)" [ref=e73]
              - paragraph [ref=e74]: Enter absolute spectral power in ms². Do not enter normalized units, percentages or log-transformed values.
        - generic [ref=e75]:
          - button "Interpret" [ref=e76]
          - button "Clear all" [ref=e77]
  - contentinfo [ref=e78]:
    - generic [ref=e79]:
      - generic [ref=e80]:
        - generic [ref=e81]:
          - heading "5HRV" [level=3] [ref=e82]
          - paragraph [ref=e83]: A scientific calculator that analyses standardized five-minute HRV recordings using peer-reviewed research and age- and sex-specific reference populations.
        - generic [ref=e84]:
          - heading "Pages" [level=3] [ref=e85]
          - list [ref=e86]:
            - listitem [ref=e87]:
              - link "Method" [ref=e88] [cursor=pointer]:
                - /url: /method
            - listitem [ref=e89]:
              - link "Methodology" [ref=e90] [cursor=pointer]:
                - /url: /methodology
            - listitem [ref=e91]:
              - link "Parameters" [ref=e92] [cursor=pointer]:
                - /url: /parameters
            - listitem [ref=e93]:
              - link "Analysis" [ref=e94] [cursor=pointer]:
                - /url: /interpretation
            - listitem [ref=e95]:
              - link "Applications" [ref=e96] [cursor=pointer]:
                - /url: /applications
            - listitem [ref=e97]:
              - link "Evidence" [ref=e98] [cursor=pointer]:
                - /url: /evidence
            - listitem [ref=e99]:
              - link "Calculator" [ref=e100] [cursor=pointer]:
                - /url: /calculator
            - listitem [ref=e101]:
              - link "About" [ref=e102] [cursor=pointer]:
                - /url: /about
        - generic [ref=e103]:
          - heading "Scientific framework" [level=3] [ref=e104]
          - paragraph [ref=e105]: Developed by Willem Gielen, Cardiologist and Internist, as a transparent approach to standardized five-minute HRV analysis in research and education.
          - paragraph [ref=e106]: 5HRV provides contextual interpretation of HRV measurements for educational and professional reference. It does not diagnose disease, replace ECG review or substitute for clinical assessment.
      - generic [ref=e107]: © 2026 5HRV. All rights reserved.
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const EXAMPLE_TEXT = `SDNN: 39.33\nrMSSD: 23.14\npNN50: 3.28%\nLF: 416.47\nHF: 70.55\nLF/HF: 5.90`;
  4  | 
  5  | test.describe("Paste values", () => {
  6  |   test("pastes HRV values and fills the calculator fields", async ({ page }) => {
  7  |     await page.goto("/calculator");
  8  | 
  9  |     await page.getByRole("button", { name: "Paste values" }).click();
  10 |     await page.getByRole("textbox", { name: "Pasted HRV report values" }).fill(EXAMPLE_TEXT);
  11 |     await page.getByRole("button", { name: "Fill fields" }).click();
  12 | 
  13 |     await expect(page.getByText(/values imported/)).toBeVisible();
  14 | 
  15 |     await expect(page.getByRole("textbox", { name: /RMSSD/ })).toHaveValue("23.14");
  16 |     await expect(page.getByRole("textbox", { name: /SDNN/ })).toHaveValue("39.33");
  17 |     await expect(page.getByRole("textbox", { name: /pNN50/ })).toHaveValue("3.28");
  18 |     await expect(page.getByRole("textbox", { name: /HF power/ })).toHaveValue("70.55");
  19 |     await expect(page.getByRole("textbox", { name: /LF power/ })).toHaveValue("416.47");
  20 |     await expect(page.getByText(/Calculated LF\/HF/)).toContainText("5.90");
  21 |   });
  22 | 
  23 |   test("accepts decimal commas and ratio-only input", async ({ page }) => {
  24 |     await page.goto("/calculator");
  25 | 
  26 |     await page.getByRole("button", { name: "Paste values" }).click();
  27 |     await page
  28 |       .getByRole("textbox", { name: "Pasted HRV report values" })
> 29 |       .fill("SDNN: 39,33\nrMSSD: 23,14\nLF/HF: 5,90");
     |        ^ Error: locator.fill: Test timeout of 60000ms exceeded.
  30 |     await page.getByRole("button", { name: "Fill fields" }).click();
  31 | 
  32 |     await expect(page.getByText(/values imported/)).toBeVisible();
  33 |     await expect(page.getByRole("textbox", { name: /RMSSD/ })).toHaveValue("23.14");
  34 |     await expect(page.getByRole("textbox", { name: /SDNN/ })).toHaveValue("39.33");
  35 |     await expect(page.getByRole("textbox", { name: /LF\/HF ratio/ })).toHaveValue("5.9");
  36 |   });
  37 | 
  38 |   test("shows an error when no HRV values are recognised", async ({ page }) => {
  39 |     await page.goto("/calculator");
  40 | 
  41 |     await page.getByRole("button", { name: "Paste values" }).click();
  42 |     await page
  43 |       .getByRole("textbox", { name: "Pasted HRV report values" })
  44 |       .fill("Some random text without any HRV values.");
  45 |     await page.getByRole("button", { name: "Fill fields" }).click();
  46 | 
  47 |     await expect(page.getByText(/No recognised HRV values found/)).toBeVisible();
  48 |     await expect(page.getByText(/values imported/)).not.toBeVisible();
  49 |   });
  50 | });
  51 | 
```