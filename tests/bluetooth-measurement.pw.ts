import { test, expect } from "@playwright/test";

test.describe("Bluetooth HRV measurement", () => {
  test("opens the measurement panel with preparation instructions", async ({ page }) => {
    await page.goto("/calculator");

    await page.getByRole("button", { name: "Measure with Polar H10" }).click();

    await expect(page.getByText("Polar H10 HRV measurement")).toBeVisible();
    await expect(page.getByText("Wear the Polar H10 chest strap")).toBeVisible();
    await expect(page.getByText("Lie flat on your back")).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect Polar H10" })).toBeVisible();
    await expect(page.getByText("Select your heart-rate sensor from the Bluetooth device list.")).toBeVisible();
  });

  test("shows the error phase when the device cannot be connected", async ({ page }) => {
    await page.goto("/calculator");

    await page.getByRole("button", { name: "Measure with Polar H10" }).click();
    await page.getByRole("button", { name: "Connect Polar H10" }).click();

    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});
