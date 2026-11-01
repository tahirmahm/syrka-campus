import { defineConfig } from "@playwright/test";
const remote = process.env.CAMPUS_BROWSER_BASE_URL;
export default defineConfig({
  outputDir: "test-results/browser",
  testDir: "tests/browser",
  use: { baseURL: remote ?? "http://127.0.0.1:3000" },
  webServer: remote
    ? undefined
    : {
        command: "npm run start -- --hostname 127.0.0.1",
        url: "http://127.0.0.1:3000/cam/login",
        reuseExistingServer: false,
      },
  reporter: "list",
});
