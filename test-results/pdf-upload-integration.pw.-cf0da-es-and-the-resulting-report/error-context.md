# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pdf-upload-integration.pw.ts >> Caroline PDF upload >> uploads the Caroline PDF, verifies extracted values and the resulting report
- Location: tests/pdf-upload-integration.pw.ts:7:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4000/calculator
Call log:
  - navigating to "http://localhost:4000/calculator", waiting until "load"

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
> 8  |     await page.goto("/calculator");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4000/calculator
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
  29 |     await expect(page.getByText("+55", { exact: true })).toBeVisible();
  30 |     await expect(page.getByText("Marked sympathetic-direction shift").first()).toBeVisible();
  31 |     await expect(page.getByText("low (P5–P25)", { exact: true })).toBeVisible();
  32 |     await expect(page.getByText("typical (P25–P75)", { exact: true })).toBeVisible();
  33 |     await expect(page.getByText(/Approximately 15th percentile/)).toBeVisible();
  34 |     await expect(page.getByText(/Approximately 45th percentile/)).toBeVisible();
  35 |   });
  36 | });
  37 | 
```