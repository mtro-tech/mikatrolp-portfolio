import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  // Two drawings exist (desktop and mobile); exactly one is shown per width.
  const scene = page.locator("svg.scene:visible");
  await expect(scene).toHaveCount(1);
  await expect(scene).toHaveAttribute("aria-hidden", "true");
  await expect(scene.locator(".skyline")).toHaveCSS("animation-name", "none");
  // Without motion the whole route is drawn and nothing gets pinned.
  await expect(scene.locator(".route-start")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(scene.getByText("St. Gallen")).toBeVisible();
});

test("the motion toggle switches motion off and remembers it", async ({
  page,
}) => {
  await page.goto("/en/");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: /Motion/ });
  await expect(html).toHaveAttribute("data-motion", "on");
  // The accessible name leaves out the hidden state, as a screen reader would.
  await expect(toggle).toHaveAccessibleName("Motion: on");

  await toggle.click();
  await expect(html).toHaveAttribute("data-motion", "off");
  await expect(toggle).toHaveAccessibleName("Motion: off");
  await expect(page.locator("svg.scene:visible .skyline")).toHaveCSS(
    "animation-name",
    "none",
  );

  await page.reload();
  await expect(html).toHaveAttribute("data-motion", "off");

  // The setting is the only thing the site stores, and no cookie is set.
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
    "motion",
  ]);
  expect(await page.context().cookies()).toEqual([]);
});

test("the header shows the chapter being read", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  const stage = page.locator("[data-stage]");
  await expect(stage).toHaveText("Arrival");
  await page.locator(".check-in").scrollIntoViewIfNeeded();
  await page.getByText("Languages").scrollIntoViewIfNeeded();
  await expect(stage).toHaveText("Check-in");
});

test("Check-in is complete and static without motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/de/");
  const chapter = page.locator("[data-check-in]");
  // Every part of the route is drawn and nothing is held or animated.
  for (const path of await chapter.locator(".route-line:visible").all()) {
    await expect(path).toHaveCSS("stroke-dashoffset", "0px");
    await expect(path).toHaveCSS("animation-name", "none");
  }
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(chapter.getByRole("heading", { level: 2 })).toHaveText(
    "Check-in",
  );
  // All ten lines of the copy are on the page at once.
  const lines = chapter.locator("[data-beat], [data-line]");
  await expect(lines).toHaveCount(10);
  for (const line of await lines.all()) {
    await expect(line).toBeVisible();
    await expect(line).toHaveCSS("opacity", "1");
  }
  await expect(chapter.getByRole("listitem")).toHaveCount(3);
});

// Scroll the held Check-in scene to a position on its timeline (0 to 13 units,
// see checkIn.at in src/lib/motion/tokens.ts).
async function playCheckIn(page: Page, position: number) {
  await page.evaluate(async (at) => {
    const frame = document.querySelector("[data-check-in] [data-stage-frame]")!;
    const spacer = frame.closest(".pin-spacer") ?? frame;
    const top =
      spacer.getBoundingClientRect().top +
      window.scrollY -
      document.querySelector("header")!.offsetHeight;
    const screens = window.matchMedia("(width >= 60rem)").matches ? 4 : 3.5;
    window.scrollTo(0, top + (at / 13) * window.innerHeight * screens);
  }, position);
}

test("Check-in plays as a held scene, one beat at a time", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-check-in]");
  const began = chapter.locator('[data-beat="began"]');
  const meaning = chapter.locator("[data-line]");

  // Nothing is written before its moment.
  await expect(began.first()).toHaveCSS("opacity", "0");

  await playCheckIn(page, 1);
  await expect(began.first()).toHaveCSS("opacity", "1");
  await expect(began.last()).toHaveCSS("opacity", "0");
  await expect(meaning.first()).toHaveCSS("opacity", "0");

  // The dark scene: the hospitality lines have gathered, the first beats are gone.
  await playCheckIn(page, 6.8);
  await expect(meaning.last()).toHaveCSS("opacity", "1");
  await expect(began.first()).toHaveCSS("opacity", "0");
  const dark = await new AxeBuilder({ page })
    .include("[data-check-in]")
    .withRules(["color-contrast"])
    .analyze();
  expect(dark.violations).toEqual([]);

  // The end: the map is drawn and the languages hang on their rail.
  await playCheckIn(page, 12.9);
  await expect(chapter.locator("[data-route]:visible")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await expect(chapter.locator("[data-tag]").last()).toHaveCSS("opacity", "1");
});

test("the route line keeps one thickness on screen", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  // Thickness on screen = the stroke width times the scale the path is drawn at.
  const thickness = (selector: string) =>
    page.evaluate((sel) => {
      const path = [...document.querySelectorAll<SVGPathElement>(sel)].find(
        (element) => element.getClientRects().length > 0,
      )!;
      const ctm = path.getScreenCTM()!;
      const width = Number.parseFloat(
        getComputedStyle(path).strokeWidth.replace("calc(", ""),
      );
      return width * Math.hypot(ctm.a, ctm.b);
    }, selector);

  const atLoad = await thickness(".skyline");
  // Scroll through the hero's zoom (held on desktop) and on into Check-in.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.9));
  await expect.poll(() => thickness(".skyline")).toBeCloseTo(atLoad, 1);
  await playCheckIn(page, 1);
  await expect
    .poll(() => thickness("[data-check-in] .route-line"))
    .toBeCloseTo(atLoad, 1);
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
