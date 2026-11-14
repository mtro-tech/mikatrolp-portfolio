import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  forbidOnly: !!process.env.CI,
  use: { baseURL: "http://localhost:4321" },
  // The two widths every chapter is reviewed at (CLAUDE.md §9).
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  // Tests run against the dev server: the Vercel adapter does not support `astro preview`.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321/en/",
    reuseExistingServer: !process.env.CI,
  },
});
