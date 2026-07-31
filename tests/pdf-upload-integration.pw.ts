import { test, expect } from "@playwright/test";
import { resolve } from "path";

const CAROLINE_PDF = resolve(__dirname, "fixtures/caroline-hrv-report.pdf");

test.describe("Caroline PDF upload", () => {
  test("uploads the Caroline PDF, verifies extracted values and the resulting report", async ({ page }) => {
    await page.goto("/calculator");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(CAROLINE_PDF);

    await expect(page.getByText(/values imported/)).toBeVisible({ timeout: 45000 });

    await expect(page.getByRole("textbox", { name: /RMSSD/ })).toHaveValue("23.14");
    await expect(page.getByRole("textbox", { name: /SDNN/ })).toHaveValue("39.33");
    await expect(page.getByRole("textbox", { name: /pNN50/ })).toHaveValue("3.28");
    await expect(page.getByRole("textbox", { name: /HF power/ })).toHaveValue("70.55");
    await expect(page.getByRole("textbox", { name: /LF power/ })).toHaveValue("416.47");
    await expect(page.getByText(/Calculated LF\/HF/)).toContainText("5.90");

    await page.getByRole("textbox", { name: /Age/ }).fill("33");
    await page.getByLabel("Reference sex").selectOption("female");

    await page.getByRole("button", { name: "Interpret" }).click();
    await expect(page).toHaveURL(/\/calculator\/result/);

    await expect(page.getByRole("heading", { name: "5HRV Scientific Analysis" })).toBeVisible();
    await expect(page.getByText("+55")).toBeVisible();
    await expect(page.getByText("Marked sympathetic-direction shift").first()).toBeVisible();
    await expect(page.getByText("low (P5–P25)")).toBeVisible();
    await expect(page.getByText("typical (P25–P75)")).toBeVisible();
    await expect(page.getByText(/15th percentile/).first()).toBeVisible();
    await expect(page.getByText(/45th percentile/).first()).toBeVisible();
  });
});
