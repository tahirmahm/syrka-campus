import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/production",
  use: { baseURL: "https://www.syrka.co" },
  reporter: "list",
  workers: 1,
});
