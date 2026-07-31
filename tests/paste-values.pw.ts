import { test, expect } from "@playwright/test";

const EXAMPLE_TEXT = `SDNN: 39.33\nrMSSD: 23.14\npNN50: 3.28%\nLF: 416.47\nHF: 70.55\nLF/HF: 5.90`;

test.describe("Paste values", () => {
  test("pastes HRV values and fills the calculator fields", async ({ page }) => {
    await page.goto("/calculator");

    await page.getByRole("button", { name: "Paste values" }).click();
    await page.getByRole("textbox", { name: "Pasted HRV report values" }).fill(EXAMPLE_TEXT);
    await page.getByRole("button", { name: "Fill fields" }).click();

    await expect(page.getByText(/values imported/)).toBeVisible();

    await expect(page.getByRole("textbox", { name: /RMSSD/ })).toHaveValue("23.14");
    await expect(page.getByRole("textbox", { name: /SDNN/ })).toHaveValue("39.33");
    await expect(page.getByRole("textbox", { name: /pNN50/ })).toHaveValue("3.28");
    await expect(page.getByRole("textbox", { name: /HF power/ })).toHaveValue("70.55");
    await expect(page.getByRole("textbox", { name: /LF power/ })).toHaveValue("416.47");
    await expect(page.getByText(/Calculated LF\/HF/)).toContainText("5.90");
  });

  test("accepts decimal commas and ratio-only input", async ({ page }) => {
    await page.goto("/calculator");

    await page.getByRole("button", { name: "Paste values" }).click();
    await page
      .getByRole("textbox", { name: "Pasted HRV report values" })
      .fill("SDNN: 39,33\nrMSSD: 23,14\nLF/HF: 5,90");
    await page.getByRole("button", { name: "Fill fields" }).click();

    await expect(page.getByText(/values imported/)).toBeVisible();
    await expect(page.getByRole("textbox", { name: /RMSSD/ })).toHaveValue("23.14");
    await expect(page.getByRole("textbox", { name: /SDNN/ })).toHaveValue("39.33");
    await expect(page.getByRole("textbox", { name: /LF\/HF ratio/ })).toHaveValue("5.9");
  });

  test("shows an error when no HRV values are recognised", async ({ page }) => {
    await page.goto("/calculator");

    await page.getByRole("button", { name: "Paste values" }).click();
    await page
      .getByRole("textbox", { name: "Pasted HRV report values" })
      .fill("Some random text without any HRV values.");
    await page.getByRole("button", { name: "Fill fields" }).click();

    await expect(page.getByText(/No recognised HRV values found/)).toBeVisible();
    await expect(page.getByText(/values imported/)).not.toBeVisible();
  });
});
