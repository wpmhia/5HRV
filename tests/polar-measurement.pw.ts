import { test, expect } from "@playwright/test";

test.describe("Polar H10 measurement", () => {
  test("opens the measurement panel with preparation instructions", async ({ page }) => {
    await page.goto("/calculator");

    await page.getByRole("button", { name: "Measure with Polar H10" }).click();

    await expect(page.getByText("Five-minute supine HRV analysis")).toBeVisible();
    await expect(page.getByText("Approximately 10 minutes including the resting period.")).toBeVisible();
    await expect(page.getByText("Wear the Polar H10 chest strap")).toBeVisible();
    await expect(page.getByText("Lie flat on your back")).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect Polar H10" })).toBeVisible();
  });

  test("shows the error phase when the device cannot be connected", async ({ page }) => {
    await page.goto("/calculator");

    await page.getByRole("button", { name: "Measure with Polar H10" }).click();
    await page.getByRole("button", { name: "Connect Polar H10" }).click();

    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});
