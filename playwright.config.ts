import { chromium, defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
export const PAYWALL_PORT = PORT + 1;
// Locally (cloud sandbox) a Chromium is preinstalled at a fixed path; CI installs its own.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
// The app's server-side PDF renderer uses the same Chromium in tests.
const serverChromium = executablePath ?? chromium.executablePath();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `npm run start -- -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { E2E_MOCK_AI: "1", RATE_LIMIT_DISABLED: "1" },
    },
    {
      // Same build with the (fake) Stripe paywall switched on.
      command: `npm run start -- -p ${PAYWALL_PORT}`,
      url: `http://localhost:${PAYWALL_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        E2E_MOCK_AI: "1",
        RATE_LIMIT_DISABLED: "1",
        STRIPE_SECRET_KEY: "sk_test_mock",
        DEMO_ENABLED: "1",
        KOFI_URL: "https://ko-fi.com/cvecko-example",
        CHROMIUM_PATH: serverChromium,
        PORT: String(PAYWALL_PORT),
      },
    },
  ],
});
