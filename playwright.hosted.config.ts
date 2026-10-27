import { defineConfig } from "@playwright/test";
const remote = process.env.CAMPUS_BROWSER_BASE_URL;
export default defineConfig({
  testDir: "tests/hosted-browser",
  timeout: 120000,
  expect: { timeout: 15000 },
  use: { baseURL: remote ?? "http://127.0.0.1:3001" },
  workers: 1,
  reporter: "list",
  webServer: remote
    ? undefined
    : {
        command:
          "NODE_USE_ENV_PROXY=1 npm run start -- --hostname 127.0.0.1 --port 3001",
        url: "http://127.0.0.1:3001/cam/login",
        reuseExistingServer: false,
      },
});
