import { devices } from "@playwright/test";

// The four project viewports shared by playwright.config.ts and playwright.db.config.ts.
export const viewports = [
  { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
  {
    name: "phone-large",
    use: { ...devices["iPhone 14"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    // WebKit hydrates slowly under full-matrix CPU load; only this project gets the longer expect timeout.
    expect: { timeout: 15_000 },
  },
  { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true } },
  { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
];
