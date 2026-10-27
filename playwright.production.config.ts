import { defineConfig } from "@playwright/test";
export default defineConfig({
  outputDir: "test-results/production",
  testDir: "tests/production",
  use: { baseURL: "https://www.syrka.co" },
  reporter: "list",
  workers: 1,
});
