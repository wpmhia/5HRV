import { test, expect } from "@playwright/test";
import { resolve } from "path";

const CAROLINE_PDF = resolve(__dirname, "fixtures/caroline-hrv-report.pdf");
const CALCULATOR_URL = "http://localhost:4000/calculator";

test.describe("Caroline PDF upload", () => {
  test("uploads the Caroline PDF and verifies all extracted values", async ({ page }) => {
    await page.goto(CALCULATOR_URL);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Upload HRV report" }).click();
    await expect(page.getByText("Select file")).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(CAROLINE_PDF);

    await expect(page.getByText("Values found in the report")).toBeVisible({ timeout: 45000 });

    async function getFieldValue(label: string): Promise<string> {
      const row = page.locator("div.flex.items-center").filter({ hasText: label });
      return await row.locator("input").inputValue();
    }

    expect(await getFieldValue("SDNN")).toBe("39.33");
    expect(await getFieldValue("RMSSD")).toBe("23.14");
    expect(await getFieldValue("pNN50")).toBe("3.28");
    expect(await getFieldValue("LF power")).toBe("416.47");
    expect(await getFieldValue("HF power")).toBe("70.55");
    expect(await getFieldValue("LF/HF ratio")).toBe("5.9");
    expect(await getFieldValue("Mean heart rate")).toBe("74");
    expect(await getFieldValue("Recording duration")).toBe("5.37");
  });
});
