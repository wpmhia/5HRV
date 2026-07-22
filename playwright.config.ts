import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.pw.ts",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:4000",
    headless: true,
  },
});
