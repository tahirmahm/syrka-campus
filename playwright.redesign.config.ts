import { defineConfig } from "@playwright/test";
const remote = process.env.CAMPUS_BROWSER_BASE_URL;
export default defineConfig({
  testDir: "tests/redesign",
  timeout: 180000,
  expect: { timeout: 20000 },
  workers: 1,
  use: { baseURL: remote ?? "http://127.0.0.1:3003" },
  webServer: remote
    ? undefined
    : {
        command:
          "NODE_USE_ENV_PROXY=1 npm run start -- --hostname 127.0.0.1 --port 3003",
        url: "http://127.0.0.1:3003/cam/login",
        reuseExistingServer: false,
      },
  reporter: "list",
});
