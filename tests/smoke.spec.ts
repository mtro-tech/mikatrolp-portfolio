import { expect, test } from "@playwright/test";

for (const [locale, other] of [
  ["en", "de"],
  ["de", "en"],
] as const) {
  test(`/${locale}/ loads and switches to /${other}/`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Mika Trolp",
    );
    // Arrival is the h1; the other seven chapters are h2s.
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(7);

    await page.locator(`a[hreflang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${other}/$`));
    await expect(page.locator("html")).toHaveAttribute("lang", other);
  });
}

test("/ redirects to /en/", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/$/);
});

test("the hero line is decorative and static under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  // Two drawings exist (desktop and mobile); exactly one is shown per width.
  const line = page.locator("svg.arrival-line:visible");
  await expect(line).toHaveCount(1);
  await expect(line).toHaveAttribute("aria-hidden", "true");
  await expect(line.locator(".route")).toHaveCSS("animation-name", "none");
  await expect(page.getByText("St. Gallen").first()).toBeVisible();
});

test("the hero does not scroll sideways", async ({ page }) => {
  await page.goto("/de/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const locale of ["en", "de"]) {
  test(`every stage name fits the header on /${locale}/`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    const stage = page.locator("[data-stage]");
    const stages = await page
      .getByRole("heading", { level: 2 })
      .allInnerTexts();
    const oneLine = await stage.evaluate((el) => el.clientHeight);

    for (const name of stages) {
      await stage.evaluate((el, text) => (el.textContent = text), name);
      const fit = await page.evaluate(() => {
        const header = document.querySelector("header")!;
        const el = document.querySelector("[data-stage]")!;
        return {
          overflow: header.scrollWidth - header.clientWidth,
          height: el.clientHeight,
        };
      });
      expect(fit.overflow, name).toBeLessThanOrEqual(0);
      // At both test widths (1440px and 390px) every name stays on one line.
      expect(fit.height, name).toBe(oneLine);
    }
  });
}

test("German copy uses Swiss spelling (no ß)", async ({ page }) => {
  await page.goto("/de/");
  expect(await page.locator("body").innerText()).not.toContain("ß");
});
