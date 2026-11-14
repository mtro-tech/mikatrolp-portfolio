import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const locale of ["en", "de"]) {
  test(`/${locale}/ has no axe violations`, async ({ page }) => {
    // Without motion nothing is mid-fade, so axe checks every element at full contrast.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}/`);
    const results = await new AxeBuilder({ page })
      // Astro's dev toolbar is injected only in dev and is not part of the site.
      .exclude("astro-dev-toolbar")
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
