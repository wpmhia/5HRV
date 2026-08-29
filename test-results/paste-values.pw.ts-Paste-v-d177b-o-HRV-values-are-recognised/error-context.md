# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: paste-values.pw.ts >> Paste values >> shows an error when no HRV values are recognised
- Location: tests/paste-values.pw.ts:38:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4000/calculator
Call log:
  - navigating to "http://localhost:4000/calculator", waiting until "load"

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
  29 |       .fill("SDNN: 39,33\nrMSSD: 23,14\nLF/HF: 5,90");
  30 |     await page.getByRole("button", { name: "Fill fields" }).click();
  31 | 
  32 |     await expect(page.getByText(/values imported/)).toBeVisible();
  33 |     await expect(page.getByRole("textbox", { name: /RMSSD/ })).toHaveValue("23.14");
  34 |     await expect(page.getByRole("textbox", { name: /SDNN/ })).toHaveValue("39.33");
  35 |     await expect(page.getByRole("textbox", { name: /LF\/HF ratio/ })).toHaveValue("5.9");
  36 |   });
  37 | 
  38 |   test("shows an error when no HRV values are recognised", async ({ page }) => {
> 39 |     await page.goto("/calculator");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4000/calculator
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