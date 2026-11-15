import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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
  await page
    .locator('[data-foundations] [data-group="carry"]')
    .scrollIntoViewIfNeeded();
  await expect(stage).toHaveText("Foundations");
  await page
    .locator('[data-bar] [data-group="learning"]')
    .scrollIntoViewIfNeeded();
  await expect(stage).toHaveText("Behind the bar");
  await page
    .locator("[data-academy] [data-module]")
    .last()
    .scrollIntoViewIfNeeded();
  await expect(stage).toHaveText("The academy");
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

// Scroll a held scene to a share (0 to 1) of its timeline. `screens` is how long the
// scene is held, as in src/lib/motion/tokens.ts.
async function playStage(
  page: Page,
  chapter: string,
  share: number,
  screens: { desktop: number; phone: number },
) {
  await page.evaluate(
    ({ chapter, share, screens }) => {
      const frame = document.querySelector(`${chapter} [data-stage-frame]`)!;
      const spacer = frame.closest(".pin-spacer") ?? frame;
      const top =
        spacer.getBoundingClientRect().top +
        window.scrollY -
        document.querySelector("header")!.offsetHeight;
      const held = window.matchMedia("(width >= 60rem)").matches
        ? screens.desktop
        : screens.phone;
      window.scrollTo(0, top + share * window.innerHeight * held);
    },
    { chapter, share, screens },
  );
}

// Positions are units on each scene's timeline (checkIn.at, foundations.at, bar.at).
const playCheckIn = (page: Page, position: number) =>
  playStage(page, "[data-check-in]", position / 24, {
    desktop: 6,
    phone: 5.5,
  });
const playFoundations = (page: Page, position: number) =>
  playStage(page, "[data-foundations]", position / 20, {
    desktop: 4,
    phone: 4,
  });
const playBar = (page: Page, position: number) =>
  playStage(page, "[data-bar]", position / 24, { desktop: 6, phone: 5.5 });
const playAcademy = (page: Page, position: number) =>
  playStage(page, "[data-academy]", position / 16.4, {
    desktop: 4,
    phone: 3.5,
  });

test("Check-in plays as a held scene, one beat at a time", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-check-in]");
  const began = chapter.locator('[data-beat="began"]');
  const meaning = chapter.locator("[data-line]");

  // Nothing is written before its moment.
  await expect(began.first()).toHaveCSS("opacity", "0");

  await playCheckIn(page, 1.5);
  await expect(began.first()).toHaveCSS("opacity", "1");
  await expect(began.last()).toHaveCSS("opacity", "0");
  await expect(meaning.first()).toHaveCSS("opacity", "0");

  // The dark scene: the hospitality lines have gathered, the first beats are gone.
  await playCheckIn(page, 11.4);
  await expect(meaning.last()).toHaveCSS("opacity", "1");
  await expect(began.first()).toHaveCSS("opacity", "0");
  const dark = await new AxeBuilder({ page })
    .include("[data-check-in]")
    .withRules(["color-contrast"])
    .analyze();
  expect(dark.violations).toEqual([]);

  // Objects before text: the route has reached Lucerne before its line arrives.
  await playCheckIn(page, 17.5);
  await expect(chapter.locator("[data-route]:visible")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await expect(chapter.locator('[data-beat="leg"]').first()).toHaveCSS(
    "opacity",
    "0",
  );

  // The end: the map is drawn and the languages hang on their rail.
  await playCheckIn(page, 23.8);
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
  await playFoundations(page, 1);
  await expect
    .poll(() => thickness("[data-foundations] .route-line"))
    .toBeCloseTo(atLoad, 1);
  await playBar(page, 1);
  await expect
    .poll(() => thickness("[data-bar] .route-line"))
    .toBeCloseTo(atLoad, 1);
  await playAcademy(page, 1);
  await expect
    .poll(() => thickness("[data-academy] .route-line"))
    .toBeCloseTo(atLoad, 1);
});

test("Behind the bar is complete and static without motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/de/");
  const chapter = page.locator("[data-bar]");
  const drawing = chapter.locator("svg:visible");
  await expect(drawing).toHaveCount(1);
  await expect(chapter.getByRole("heading", { level: 2 })).toHaveText(
    "Hinter der Bar",
  );
  // All seven lines of the copy are on the page at once.
  const lines = chapter.locator("[data-line]");
  await expect(lines).toHaveCount(7);
  for (const line of await lines.all()) {
    await expect(line).toBeVisible();
    await expect(line).toHaveCSS("opacity", "1");
  }
  // Three glasses, three tools, the route drawn; the pour and the flood are not shown.
  await expect(drawing.locator("[data-glass]")).toHaveCount(3);
  await expect(drawing.locator("[data-tool]")).toHaveCount(3);
  await expect(drawing.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  for (const part of ["[data-flood]", "[data-pour]", "[data-bottle]"]) {
    await expect(chapter.locator(part).first()).toBeHidden();
  }
});

test("Behind the bar plays as a held scene, objects before text", async ({
  page,
}) => {
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-bar]");
  const drawing = chapter.locator("svg:visible");
  const line = (moment: string, index = 0) =>
    chapter.locator(`[data-group="${moment}"] [data-line]`).nth(index);
  const shown = (part: string) => expect(drawing.locator(part).last());

  // Nothing is on stage before its moment.
  await expect(line("joined")).toHaveCSS("opacity", "0");
  for (const part of ["[data-counter]", "[data-wall]", "[data-ceiling]"]) {
    await shown(part).toHaveCSS("opacity", "0");
  }
  await expect(chapter.locator("[data-flood]")).toHaveCSS("opacity", "0");

  // The room is built and the first line rests; the glasses have not started.
  await playBar(page, 3.5);
  await expect(line("joined")).toHaveCSS("opacity", "1");
  await shown("[data-counter]").toHaveCSS("opacity", "1");
  await shown("[data-glass]").toHaveCSS("opacity", "0");

  // Just before the second line: every glass is in place, the line is not up yet.
  await playBar(page, 5.6);
  await shown("[data-glass]").toHaveCSS("opacity", "1");
  await expect(line("joined", 1)).toHaveCSS("opacity", "0");

  // The red moment: paper-coloured text on the flood, readable.
  await playBar(page, 10.8);
  await expect(line("today")).toHaveCSS("opacity", "1");
  const red = await new AxeBuilder({ page })
    .include("[data-bar]")
    .withRules(["color-contrast"])
    .analyze();
  expect(red.violations).toEqual([]);

  // Responsibility: the tray is there with its line; the drinks are not finished yet.
  await playBar(page, 14.5);
  await expect(line("responsibility")).toHaveCSS("opacity", "1");
  await shown("[data-tray]").toHaveCSS("opacity", "1");
  await shown('[data-garnish="ice"]').toHaveCSS("opacity", "0");

  // Growth: both garnishes have landed before its line rests.
  await playBar(page, 17.0);
  await expect(line("growth")).toHaveCSS("opacity", "1");
  await shown('[data-garnish="peel"]').toHaveCSS("opacity", "1");
  await shown("[data-tool]").toHaveCSS("opacity", "0");

  // The end: the tools are in their niches, the last line is up, the route has run on.
  await playBar(page, 23.8);
  await shown("[data-tool]").toHaveCSS("opacity", "1");
  await expect(line("learning", 1)).toHaveCSS("opacity", "1");
  await expect(line("learning")).toHaveCSS("opacity", "0");
  await expect(drawing.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
});

test("the route meets between chapters on a short, wide window", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "phones use the fixed rail");
  // A window like this shrinks every scene's drawing to fit the frame.
  await page.setViewportSize({ width: 1470, height: 760 });
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  // Where a route path starts or ends on screen (x in pixels).
  const onScreen = (chapter: string, path: string, end: "start" | "end") =>
    page.evaluate(
      ({ chapter, path, end }) => {
        const drawing = [...document.querySelectorAll(`${chapter} svg`)].find(
          (svg) => svg.getClientRects().length > 0,
        )!;
        const route = drawing.querySelector<SVGPathElement>(path)!;
        const point = route.getPointAtLength(
          end === "end" ? route.getTotalLength() : 0,
        );
        const matrix = route.getScreenCTM()!;
        return matrix.a * point.x + matrix.c * point.y + matrix.e;
      },
      { chapter, path, end },
    );
  const entry = (chapter: string) => onScreen(chapter, ".route-line", "start");
  const exit = (chapter: string) => onScreen(chapter, "[data-route]", "end");

  // Foundations sits in the middle of the page, and Check-in's route bends to meet it.
  expect(await entry("[data-foundations]")).toBeCloseTo(width / 2, 0);
  expect(await exit("[data-check-in]")).toBeCloseTo(width / 2, 0);
  expect(await exit("[data-foundations]")).toBeCloseTo(width / 2, 0);
  expect(await entry("[data-bar]")).toBeCloseTo(width / 2, 0);
  // Behind the bar hands the route on at a fixed place: 72.22% of the page width.
  expect(await exit("[data-bar]")).toBeCloseTo(width * 0.7222, 0);
  expect(await entry("[data-academy]")).toBeCloseTo(width * 0.7222, 0);
  // The academy hands it on at a quarter of the page width.
  expect(await exit("[data-academy]")).toBeCloseTo(width * 0.25, 0);
});

test("The academy is complete and static without motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  const chapter = page.locator("[data-academy]");
  const drawing = chapter.locator("svg:visible");
  await expect(drawing).toHaveCount(1);
  await expect(chapter.getByRole("heading", { level: 2 })).toHaveText(
    "The academy",
  );
  // The three lines of the copy and the three modules are on the page at once.
  const lines = chapter.locator("[data-line], [data-module]");
  await expect(lines).toHaveCount(6);
  for (const line of await lines.all()) {
    await expect(line).toBeVisible();
    await expect(line).toHaveCSS("opacity", "1");
  }
  await expect(chapter.getByRole("listitem")).toHaveCount(3);
  // The pin, one book per module, and the route drawn.
  await expect(drawing.locator("[data-pin]")).toHaveCount(1);
  await expect(drawing.locator("[data-book]")).toHaveCount(3);
  await expect(drawing.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
});

test("The academy plays as a held scene, objects before text", async ({
  page,
}) => {
  await page.goto("/de/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-academy]");
  const drawing = chapter.locator("svg:visible");
  const line = (index: number) => chapter.locator("[data-line]").nth(index);
  const shown = (part: string) => expect(drawing.locator(part).last());

  // Nothing is on stage before its moment.
  await expect(line(0)).toHaveCSS("opacity", "0");
  for (const part of ["[data-ridge]", "[data-tower]", "[data-span]"]) {
    await shown(part).toHaveCSS("opacity", "0");
  }

  // Just before the first line: the whole bridge stands, the line is not up yet.
  await playAcademy(page, 3.5);
  await shown("[data-span]").toHaveCSS("opacity", "1");
  await expect(line(0)).toHaveCSS("opacity", "0");

  // The first line rests; the flowers have not bloomed and the pin has not landed.
  await playAcademy(page, 4.6);
  await expect(line(0)).toHaveCSS("opacity", "1");
  await shown("[data-flower]").toHaveCSS("opacity", "0");
  await shown("[data-pin]").toHaveCSS("opacity", "0");

  // Where I am now: the pin has landed before its line rests.
  await playAcademy(page, 9.8);
  await expect(line(2)).toHaveCSS("opacity", "1");
  await shown("[data-pin]").toHaveCSS("opacity", "1");
  await shown("[data-book]").toHaveCSS("opacity", "0");

  // The end: three books, three modules, the route has run on.
  await playAcademy(page, 16.3);
  await shown("[data-book]").toHaveCSS("opacity", "1");
  await expect(chapter.locator("[data-module]").last()).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(line(2)).toHaveCSS("opacity", "0");
  await expect(drawing.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
});

test("Foundations is complete and static without motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  const chapter = page.locator("[data-foundations]");
  const drawing = chapter.locator("svg:visible");
  await expect(drawing).toHaveCount(1);
  await expect(chapter.getByRole("heading", { level: 2 })).toHaveText(
    "Foundations",
  );
  // All seven lines of the copy are on the page at once.
  const lines = chapter.locator("[data-line]");
  await expect(lines).toHaveCount(7);
  for (const line of await lines.all()) {
    await expect(line).toBeVisible();
    await expect(line).toHaveCSS("opacity", "1");
  }
  // The 60 people led, the one who leads, and the count beside them.
  await expect(drawing.locator("[data-peg]")).toHaveCount(60);
  await expect(drawing.locator("[data-leader]")).toHaveCount(1);
  await expect(drawing.locator("[data-numeral]")).toHaveText("60");
  for (const path of await drawing.locator(".route-line").all()) {
    await expect(path).toHaveCSS("stroke-dashoffset", "0px");
  }
});

test("Foundations plays as a held scene, one moment at a time", async ({
  page,
}) => {
  await page.goto("/de/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-foundations]");
  const drawing = chapter.locator("svg:visible");
  const lines = (moment: string) =>
    chapter.locator(`[data-group="${moment}"] [data-line]`);
  const numeral = drawing.locator("[data-numeral]");
  const lastPeg = drawing.locator("[data-peg]").last();
  const drawnPlace = await lastPeg.evaluate(
    (peg: SVGElement) => `translate(${peg.dataset.x} ${peg.dataset.y})`,
  );

  // Nothing is on stage before its moment.
  await expect(lines("rank").first()).toHaveCSS("opacity", "0");
  for (const part of ["[data-ruler]", "[data-ground]", "[data-numeral]"]) {
    await expect(drawing.locator(part)).toHaveCSS("opacity", "0");
  }
  await expect(drawing.locator("[data-pegs]")).toHaveCSS("opacity", "0");

  // Objects before text: all 60 are counted before the line that names them arrives.
  await playFoundations(page, 4.0);
  await expect(numeral).toHaveText("60");
  await expect(lines("rank").last()).toHaveCSS("opacity", "0");

  // The line rests; the lesson has not started.
  await playFoundations(page, 5.2);
  await expect(numeral).toHaveText("60");
  await expect(lines("rank").last()).toHaveCSS("opacity", "1");
  await expect(lines("lesson").first()).toHaveCSS("opacity", "0");

  // The block has formed behind the leader and the lesson is complete.
  await playFoundations(page, 13.6);
  await expect(lines("lesson").last()).toHaveCSS("opacity", "1");
  await expect(lines("rank").first()).toHaveCSS("opacity", "0");
  await expect(lastPeg).toHaveAttribute(
    "transform",
    new RegExp(`^${drawnPlace.replace(/[()]/g, "\\$&")} `),
  );

  // The end: the last line is up and the route has run on.
  await playFoundations(page, 19.8);
  await expect(lines("carry").last()).toHaveCSS("opacity", "1");
  for (const route of await drawing.locator("[data-route]").all()) {
    await expect(route).toHaveCSS("stroke-dashoffset", "0px");
  }

  // Switching motion off mid-scene puts the count and the pegs back as drawn.
  await playFoundations(page, 3.2);
  await expect(numeral).not.toHaveText("60");
  await page.getByRole("button", { name: /Bewegung/ }).click();
  await expect(numeral).toHaveText("60");
  // Lines the scene had faded out are back, too (its tweens were built after load).
  await expect(lines("lesson").first()).toHaveCSS("opacity", "1");
  await expect(lastPeg).toHaveAttribute(
    "transform",
    new RegExp(`^${drawnPlace.replace(/[()]/g, "\\$&")} `),
  );
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

test("every animation has its own name", () => {
  // Keyframe names are global: two components using the same name silently share one
  // animation (the hero's buildings once slid up like the name instead of growing).
  const files = readdirSync("src", {
    recursive: true,
    encoding: "utf8",
  }).filter((file) => /\.(astro|css)$/.test(file));
  const seen = new Map<string, string>();
  for (const file of files) {
    const source = readFileSync(join("src", file), "utf8");
    for (const [, name] of source.matchAll(/@keyframes\s+([\w-]+)/g)) {
      expect(seen.get(name), `@keyframes ${name} in ${file}`).toBeUndefined();
      seen.set(name, file);
    }
  }
  // Guards the guard: the scan must actually have found the animations.
  expect(seen.size).toBeGreaterThan(5);
});

test("the hero's drawings are not visible before they animate in", async ({
  page,
}) => {
  await page.goto("/en/");
  // Rewind every one-off animation to its first frame, as at the moment of first paint.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getComputedTiming().iterations === Infinity)
        continue;
      animation.pause();
      animation.currentTime = 0;
    }
  });
  const scene = page.locator("svg.scene:visible");
  for (const part of [".building", ".hill", ".pin-drop"]) {
    for (const element of await scene.locator(part).all()) {
      await expect(element).toHaveCSS("opacity", "0");
    }
  }
});
