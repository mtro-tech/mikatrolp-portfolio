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
  // Two drawings exist (desktop and mobile); one is shown per width, in two layers:
  // the map ground, and the objects on it.
  const layers = page.locator("svg.scene:visible");
  await expect(layers).toHaveCount(2);
  const scene = layers.last();
  await expect(layers.first()).toHaveAttribute("aria-hidden", "true");
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
  await page
    .locator('[data-flight] [data-group="learn"]')
    .scrollIntoViewIfNeeded();
  await expect(stage).toHaveText("Next destination");
  await page
    .locator('[data-concierge] [data-group="project"]')
    .scrollIntoViewIfNeeded();
  await expect(stage).toHaveText("Concierge of the future");
  // The last chapter: the end of the page.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(stage).toHaveText("Check-out");
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
  playStage(page, "[data-bar]", position / 37.4, { desktop: 9, phone: 8.5 });
const playFlight = (page: Page, position: number) =>
  playStage(page, "[data-flight]", position / 28, { desktop: 7, phone: 6.5 });
const playConcierge = (page: Page, position: number) =>
  playStage(page, "[data-concierge]", position / 32, {
    desktop: 8,
    phone: 7.5,
  });
const playCheckOut = (page: Page, position: number) =>
  playStage(page, "[data-check-out]", position / 12, { desktop: 3, phone: 3 });
const playAcademy = (page: Page, position: number) =>
  playStage(page, "[data-academy]", position / 14.8, {
    desktop: 3.7,
    phone: 3.3,
  });

test("Check-in plays as a held scene, one beat at a time", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-check-in]");
  const began = chapter.locator('[data-beat="began"]');
  const meaning = chapter.locator("[data-line]");

  // Nothing is written before its moment.
  await expect(began.first()).toHaveCSS("opacity", "0");

  const header = page.locator(".site-header");
  await playCheckIn(page, 1.5);
  await expect(began.first()).toHaveCSS("opacity", "1");
  await expect(header).not.toHaveAttribute("data-tone");
  await expect(began.last()).toHaveCSS("opacity", "0");
  await expect(meaning.first()).toHaveCSS("opacity", "0");

  // The dark scene: the hospitality lines have gathered, the first beats are gone.
  await playCheckIn(page, 11.4);
  await expect(meaning.last()).toHaveCSS("opacity", "1");
  await expect(began.first()).toHaveCSS("opacity", "0");
  // The header has joined the dark scene (pine ink), and its text is still readable.
  await expect(header).toHaveAttribute("data-tone", "ink");
  await expect(header).toHaveCSS("background-color", "rgb(30, 43, 38)");
  const dark = await new AxeBuilder({ page })
    .include("[data-check-in]")
    .include(".site-header")
    .withRules(["color-contrast"])
    .analyze();
  expect(dark.violations).toEqual([]);

  // Objects before text: the route has reached Lucerne before its line arrives.
  await playCheckIn(page, 17.5);
  await expect(header).not.toHaveAttribute("data-tone");
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
  await playFlight(page, 1);
  await expect
    .poll(() => thickness("[data-flight] [data-flight-path]"))
    .toBeCloseTo(atLoad, 1);
  await playConcierge(page, 1);
  await expect
    .poll(() => thickness("[data-concierge] .route-line"))
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
  for (const part of [
    "[data-flood]",
    "[data-shaker]",
    "[data-pour]",
    "[data-serve]",
    "[data-bottle]",
  ]) {
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
  const header = page.locator(".site-header");
  const line = (moment: string, index = 0) =>
    chapter.locator(`[data-group="${moment}"] [data-line]`).nth(index);
  const shown = (part: string) => expect(drawing.locator(part).last());
  const shaker = chapter.locator("[data-shaker]");
  const lastDrink = drawing.locator("[data-liquid]").last();
  // What lies on top at a point of a drawing: `x`, `y` are in the units of the first
  // visible element matching `of`. Answers whether that point is covered by `by`.
  const covered = (of: string, x: number, y: number, by: string) =>
    page.evaluate(
      ({ of, x, y, by }) => {
        const element = [
          ...document.querySelectorAll<SVGGraphicsElement>(of),
        ].find((candidate) => candidate.getClientRects().length > 0)!;
        const matrix = element.getScreenCTM()!;
        const top = document.elementFromPoint(
          matrix.a * x + matrix.c * y + matrix.e,
          matrix.b * x + matrix.d * y + matrix.f,
        );
        return Boolean(top?.closest(by));
      },
      { of, x, y, by },
    );
  // Where a stream in the bar's drawing starts, in its own units.
  const streamStart = (stream: string) =>
    page.evaluate((stream) => {
      const path = [
        ...document.querySelectorAll<SVGPathElement>(`[data-bar] ${stream}`),
      ].find((candidate) => candidate.getClientRects().length > 0)!;
      const { x, y } = path.getPointAtLength(0);
      return { x, y };
    }, stream);
  // A drink waits below its glass until it is poured: then its group is back at 0, 0.
  const poured = /,0,0\)$/;

  // Nothing is on stage before its moment.
  await expect(line("joined")).toHaveCSS("opacity", "0");
  for (const part of ["[data-counter]", "[data-wall]", "[data-ceiling]"]) {
    await shown(part).toHaveCSS("opacity", "0");
  }
  await expect(chapter.locator("[data-flood]")).toHaveCSS("opacity", "0");

  // The room was built on the way in. The first line rests; no glasses yet.
  await playBar(page, 1.5);
  await expect(line("joined")).toHaveCSS("opacity", "1");
  await shown("[data-counter]").toHaveCSS("opacity", "1");
  await shown("[data-glass]").toHaveCSS("opacity", "0");

  // Just before the second line: every glass is in place, the line is not up yet.
  await playBar(page, 3.5);
  await shown("[data-glass]").toHaveCSS("opacity", "1");
  await expect(line("joined", 1)).toHaveCSS("opacity", "0");

  // The first pour: the stream comes out of the bottle (its top end is covered by it).
  await playBar(page, 6.6);
  await shown("[data-pour]").toHaveCSS("opacity", "1");
  const fromBottle = await streamStart("[data-pour]");
  await expect
    .poll(() =>
      covered(
        "[data-bar] [data-pour]",
        fromBottle.x,
        fromBottle.y,
        "[data-bottle]",
      ),
    )
    .toBe(true);

  // The first pour has stopped: its stream is gone while the bottle is still there.
  await playBar(page, 7.6);
  await shown("[data-pour]").toHaveCSS("opacity", "0");
  await shown("[data-bottle]").toHaveCSS("opacity", "1");

  // On the red: the jigger is pouring its measure. The shaker is open and the third
  // glass is still empty.
  await playBar(page, 10.3);
  await expect(header).toHaveAttribute("data-tone", "red");
  await expect(shaker).toHaveCSS("opacity", "1");
  await expect(shaker.locator("[data-jigger]")).toHaveCSS("opacity", "1");
  await expect(shaker.locator("[data-measure]")).toHaveCSS("opacity", "1");
  await expect(shaker.locator("[data-cap]")).toHaveCSS("opacity", "0");
  await expect(lastDrink).not.toHaveAttribute("transform", poured);
  // The measure comes out of the jigger's cup, just right of the rim's corner at
  // -28, -204 (Shaker.astro): its top end, 16 units above, is covered by the jigger.
  await expect
    .poll(() => covered("[data-shaker] svg", -24.5, -218, "[data-jigger]"))
    .toBe(true);

  // The measure has run out (its tail has no height left) while the jigger is still there.
  await playBar(page, 10.9);
  await expect(shaker.locator("[data-measure-tail]")).toHaveAttribute(
    "transform",
    /^matrix\(1,0,0,0,/,
  );
  await expect(shaker.locator("[data-jigger]")).toHaveCSS("opacity", "1");

  const inScoop = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("[data-shaker] [data-cube]")].every(
        (cube) => {
          const box = cube.getBoundingClientRect();
          const top = document.elementFromPoint(
            box.left + box.width / 2,
            box.top + box.height / 2,
          );
          return Boolean(top?.closest("[data-scoop-wall]"));
        },
      ),
    );
  // Halfway through the scoop's arrival: scoop and ice fade in as one group (the ice
  // and the wall have no opacity of their own), so the ice never shows through.
  await playBar(page, 11.85);
  const fading = shaker.locator("[data-scoop-enter]");
  await expect(fading).not.toHaveCSS("opacity", "0");
  await expect(fading).not.toHaveCSS("opacity", "1");
  await expect(shaker.locator("[data-scoop]")).toHaveCSS("opacity", "1");
  await expect(shaker.locator("[data-cube]").first()).toHaveCSS("opacity", "1");
  await expect.poll(inScoop).toBe(true);

  // The scoop has come in, still level: the ice lies inside it, so the centre of every
  // cube is covered by the scoop's wall.
  await playBar(page, 12.15);
  await expect(shaker.locator("[data-scoop-enter]")).toHaveCSS("opacity", "1");
  await expect.poll(inScoop).toBe(true);

  // The scoop has tipped all five cubes in; the shaker is not closed yet.
  await playBar(page, 14.25);
  await expect(shaker.locator("[data-cube]")).toHaveCount(5);
  for (const cube of await shaker.locator("[data-cube]").all()) {
    await expect(cube).toHaveAttribute("transform", /matrix/);
  }
  await expect(shaker.locator("[data-cap]")).toHaveCSS("opacity", "0");

  // Just before the shake: the shaker is closed, and the line is not up yet.
  await playBar(page, 15.6);
  await expect(shaker.locator("[data-cap]")).toHaveCSS("opacity", "1");
  await expect(line("today")).toHaveCSS("opacity", "0");

  // The red moment: the shaker rests, paper-coloured text on the flood, readable.
  await playBar(page, 21.0);
  await expect(line("today")).toHaveCSS("opacity", "1");
  // The header has turned red with the flood, and its text is still readable.
  await expect(header).toHaveAttribute("data-tone", "red");
  await expect(header).toHaveCSS("background-color", "rgb(166, 52, 27)");
  const red = await new AxeBuilder({ page })
    .include("[data-bar]")
    .include(".site-header")
    .withRules(["color-contrast"])
    .analyze();
  expect(red.violations).toEqual([]);

  // The red has drained. The drink falls from the low corner of the shaker's rim:
  // the stream starts within a few pixels of that corner on screen.
  await playBar(page, 24.4);
  await expect(header).not.toHaveAttribute("data-tone");
  await shown("[data-serve]").toHaveCSS("opacity", "1");
  const gap = () =>
    page.evaluate(() => {
      const onScreen = (element: SVGGraphicsElement, x: number, y: number) => {
        const matrix = element.getScreenCTM()!;
        return [
          matrix.a * x + matrix.c * y + matrix.e,
          matrix.b * x + matrix.d * y + matrix.f,
        ];
      };
      const stream = [
        ...document.querySelectorAll<SVGPathElement>("[data-bar] [data-serve]"),
      ].find((path) => path.getClientRects().length > 0)!;
      // The stream comes out of the shaker `data-inside` units below its hidden start.
      const start = stream.getPointAtLength(Number(stream.dataset.inside));
      const [streamX, streamY] = onScreen(stream, start.x, start.y);
      // The rim's corner in the shaker's own drawing (Shaker.astro): 58 to the side
      // of the mouth, which is at (0, -170).
      const tin = document.querySelector<SVGSVGElement>("[data-shaker] svg")!;
      const [cornerX, cornerY] = onScreen(tin, 58, -170);
      return Math.hypot(streamX - cornerX, streamY - cornerY);
    });
  await expect.poll(gap).toBeLessThan(4);
  // ...and its top end is up inside the shaker, covered by it.
  const fromShaker = await streamStart("[data-serve]");
  await expect
    .poll(() =>
      covered(
        "[data-bar] [data-serve]",
        fromShaker.x,
        fromShaker.y,
        "[data-shaker]",
      ),
    )
    .toBe(true);
  // Over the bar the shaker is under half the size it has on the red.
  const size = await shaker.evaluate(
    (element) =>
      new DOMMatrix(getComputedStyle(element).transform).a ** 2 +
      new DOMMatrix(getComputedStyle(element).transform).b ** 2,
  );
  expect(Math.sqrt(size)).toBeCloseTo(0.45, 2);

  // The glass is full and the stream has run out, while the shaker is still there.
  await playBar(page, 25.25);
  await expect(lastDrink).toHaveAttribute("transform", poured);
  await shown("[data-serve]").toHaveCSS("opacity", "0");
  await expect(shaker).toHaveCSS("opacity", "1");

  // Responsibility: the shaker has left, the tray is there with its line; the drinks
  // are not finished yet.
  await playBar(page, 27.5);
  await expect(shaker).toHaveCSS("opacity", "0");
  await expect(header).not.toHaveAttribute("data-tone");
  await expect(line("responsibility")).toHaveCSS("opacity", "1");
  await shown("[data-tray]").toHaveCSS("opacity", "1");
  await shown('[data-garnish="ice"]').toHaveCSS("opacity", "0");

  // Growth: both garnishes have landed before its line rests.
  await playBar(page, 30.4);
  await expect(line("growth")).toHaveCSS("opacity", "1");
  await shown('[data-garnish="peel"]').toHaveCSS("opacity", "1");
  await shown("[data-tool]").toHaveCSS("opacity", "0");

  // The end: the tools are in their niches, the last line is up, the route has run on.
  await playBar(page, 37.2);
  await shown("[data-tool]").toHaveCSS("opacity", "1");
  await expect(line("learning", 1)).toHaveCSS("opacity", "1");
  await expect(line("learning")).toHaveCSS("opacity", "0");
  await expect(drawing.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
});

// Between two chapters the next one builds its place while it scrolls into view, so
// the route never arrives at an empty page.
test("each chapter's place is built on the way in", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  // Scroll to a point on a chapter's way in: `left` screens before it is held.
  const wayIn = (chapter: string, left: number) =>
    page.evaluate(
      ({ chapter, left }) => {
        const frame = document.querySelector(`${chapter} [data-stage-frame]`)!;
        const spacer = frame.closest(".pin-spacer") ?? frame;
        const held =
          spacer.getBoundingClientRect().top +
          window.scrollY -
          document.querySelector("header")!.offsetHeight;
        window.scrollTo(0, held - left * window.innerHeight);
      },
      { chapter, left },
    );
  const places: [string, string[], string][] = [
    ["[data-foundations]", ["[data-ruler]", "[data-leader]"], "[data-line]"],
    [
      "[data-bar]",
      ["[data-ceiling]", "[data-wall]", "[data-globe]", "[data-counter]"],
      "[data-line]",
    ],
    [
      "[data-academy]",
      ["[data-ridge]", "[data-water]", "[data-tower]", "[data-span]"],
      "[data-line]",
    ],
    [
      "[data-flight]",
      ["[data-origin-map]", "[data-land]", "[data-origin-pin]", "[data-plane]"],
      "[data-line]",
    ],
    [
      "[data-concierge]",
      ["[data-desk]", "[data-desk-top]", "[data-bell]"],
      "[data-line]",
    ],
  ];
  for (const [chapter, parts, firstLine] of places) {
    const drawing = page.locator(`${chapter} svg:visible`);
    // Still a screen and a half away: nothing is there yet.
    await wayIn(chapter, 1.5);
    await expect(drawing.locator(parts[0]).last()).toHaveCSS("opacity", "0");
    // Halfway in, the first piece is arriving.
    await wayIn(chapter, 0.45);
    await expect(drawing.locator(parts[0]).last()).not.toHaveCSS(
      "opacity",
      "0",
    );
    // Held: everything stands, and the first line is not up yet.
    await wayIn(chapter, 0);
    for (const part of parts) {
      await expect(drawing.locator(part).last()).toHaveCSS("opacity", "1");
    }
    await expect(page.locator(`${chapter} ${firstLine}`).first()).toHaveCSS(
      "opacity",
      "0",
    );
  }
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
          (svg) => svg.getClientRects().length > 0 && svg.querySelector(path),
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

  // The hero hands the route to Check-in at 72.22% of the page width, at any moment
  // of its zoom: its route is exactly vertical from the pin down.
  for (const share of [0, 0.5, 0.95]) {
    await page.evaluate(
      (y) => window.scrollTo(0, window.innerHeight * y),
      share,
    );
    for (const end of ["start", "end"] as const) {
      await expect
        .poll(() => onScreen("[data-arrival]", "[data-route-start]", end))
        .toBeCloseTo(width * 0.7222, 0);
    }
  }
  expect(await entry("[data-check-in]")).toBeCloseTo(width * 0.7222, 0);

  // Foundations sits in the middle of the page, and Check-in's route bends to meet it.
  expect(await entry("[data-foundations]")).toBeCloseTo(width / 2, 0);
  expect(await exit("[data-check-in]")).toBeCloseTo(width / 2, 0);
  expect(await exit("[data-foundations]")).toBeCloseTo(width / 2, 0);
  expect(await entry("[data-bar]")).toBeCloseTo(width / 2, 0);
  // Behind the bar hands the route on at a fixed place: 72.22% of the page width.
  expect(await exit("[data-bar]")).toBeCloseTo(width * 0.7222, 0);
  expect(await entry("[data-academy]")).toBeCloseTo(width * 0.7222, 0);
  // The academy hands it on at a quarter of the page width, where the flight's map
  // takes it. (The map is a strip that slides: its entry is measured where the
  // chapter starts and its exit where it ends.)
  expect(await exit("[data-academy]")).toBeCloseTo(width * 0.25, 0);
  await playFlight(page, 0);
  await expect.poll(() => entry("[data-flight]")).toBeCloseTo(width * 0.25, 0);
  // Next destination hands it on in the middle of the page.
  await playFlight(page, 27.9);
  await expect.poll(() => exit("[data-flight]")).toBeCloseTo(width / 2, 0);
  // Concierge of the future takes it there and hands it on there too.
  await playConcierge(page, 31.9);
  expect(await entry("[data-concierge]")).toBeCloseTo(width / 2, 0);
  await expect.poll(() => exit("[data-concierge]")).toBeCloseTo(width / 2, 0);
  // Check-out takes it there, onto the guestbook's spine. The route ends in it.
  expect(await entry("[data-check-out]")).toBeCloseTo(width / 2, 0);
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
  // One open book (no closed cover) with two pages of the same width, and a name on
  // each page.
  const book = chapter.locator("[data-book]");
  await expect(book).toHaveCount(1);
  await expect(chapter.locator("[data-book-cover]")).toBeHidden();
  const pages = await book.evaluate((element) => {
    const halves = [...element.querySelectorAll(".half")].map((half) =>
      half.getBoundingClientRect(),
    );
    const spine = halves[0].right;
    const names = [...element.querySelectorAll("[data-module]")].map((name) =>
      name.getBoundingClientRect(),
    );
    return {
      widths: halves.map((half) => half.width),
      left: names.filter((name) => name.right <= spine).length,
      right: names.filter((name) => name.left >= spine).length,
    };
  });
  expect(Math.abs(pages.widths[0] - pages.widths[1])).toBeLessThan(1);
  expect(pages.left).toBeGreaterThan(0);
  expect(pages.right).toBeGreaterThan(0);
  await expect(drawing.locator("[data-pin]")).toHaveCount(1);
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
  const book = chapter.locator("[data-book]");
  const cover = chapter.locator("[data-book-cover]");
  const names = chapter.locator("[data-module]");
  // A closed cover is at full width; an opened one has narrowed away at the spine.
  const closed = /^matrix\(1, /;
  const opened = /^matrix\(0, /;

  // Nothing is on stage before its moment.
  await expect(line(0)).toHaveCSS("opacity", "0");
  for (const part of ["[data-ridge]", "[data-tower]", "[data-span]"]) {
    await shown(part).toHaveCSS("opacity", "0");
  }

  // The town was built on the way in. The first line rests; the flowers have not
  // bloomed and the pin has not landed.
  await playAcademy(page, 1.3);
  await shown("[data-span]").toHaveCSS("opacity", "1");
  await expect(line(0)).toHaveCSS("opacity", "1");
  await shown("[data-flower]").toHaveCSS("opacity", "0");
  await shown("[data-pin]").toHaveCSS("opacity", "0");

  // Where I am now: the pin has landed before its line rests. No book yet.
  await playAcademy(page, 6.5);
  await expect(line(2)).toHaveCSS("opacity", "1");
  await shown("[data-pin]").toHaveCSS("opacity", "1");
  await expect(book).toHaveCSS("opacity", "0");

  // The book has been dropped and is still closed.
  await playAcademy(page, 8.3);
  await expect(book).toHaveCount(1);
  await expect(book).toHaveCSS("opacity", "1");
  await expect(cover).toHaveCSS("transform", closed);

  // Objects first: the book is open before the first name is written.
  await playAcademy(page, 9.3);
  await expect(cover).toHaveCSS("transform", opened);
  await expect(names.first()).toHaveCSS("opacity", "0");

  // Then the names, one at a time: the first is there, the second is not yet.
  await playAcademy(page, 10.3);
  await expect(names.first()).toHaveCSS("opacity", "1");
  await expect(names.nth(1)).toHaveCSS("opacity", "0");

  // The end: all three names on the two pages, readable; the route has run on.
  await playAcademy(page, 14.7);
  await expect(names).toHaveCount(3);
  for (const name of await names.all()) {
    await expect(name).toHaveCSS("opacity", "1");
  }
  const contrast = await new AxeBuilder({ page })
    .include("[data-academy]")
    .withRules(["color-contrast"])
    .analyze();
  expect(contrast.violations).toEqual([]);
  await expect(line(2)).toHaveCSS("opacity", "0");
  await expect(drawing.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
});

test("Next destination is complete and static without motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  const chapter = page.locator("[data-flight]");
  const drawing = chapter.locator("svg:visible");
  await expect(drawing).toHaveCount(1);
  await expect(chapter.getByRole("heading", { level: 2 })).toHaveText(
    "Next destination",
  );
  // Upcoming, never shown as done (CLAUDE.md §2.4).
  await expect(chapter.locator("[data-title]")).toContainText("Upcoming");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  // All five lines of the copy are on the page at once.
  const lines = chapter.locator("[data-line]");
  await expect(lines).toHaveCount(5);
  for (const line of await lines.all()) {
    await expect(line).toBeVisible();
    await expect(line).toHaveCSS("opacity", "1");
  }
  // The skyline with its pin and the hotel's tower, named; the route drawn; no
  // night sky and no clouds.
  await expect(drawing.locator("[data-place-pin]")).toBeVisible();
  await expect(drawing.locator("[data-tower]").first()).toBeVisible();
  await expect(drawing.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await expect(chapter.locator("[data-night]")).toBeHidden();
  await expect(drawing.locator("[data-rosewood]")).toBeVisible();
  await expect(drawing.locator("[data-rosewood-label]")).toHaveText(
    "Rosewood Hong Kong",
  );
  await expect(drawing.locator("[data-clouds]").first()).toBeHidden();
  // The small joints were taken out of the chapter (Mika, 2026-11-15).
  await expect(chapter.locator("[data-joint]")).toHaveCount(0);
  await expect(chapter).not.toContainText("small joints");
  await expect(drawing).toHaveAttribute("aria-hidden", "true");
});

test("Next destination plays as a held scene, objects before text", async ({
  page,
}) => {
  await page.goto("/de/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-flight]");
  const drawing = chapter.locator("svg:visible");
  const header = page.locator(".site-header");
  const line = (moment: string, index = 0) =>
    chapter.locator(`[data-group="${moment}"] [data-line]`).nth(index);
  const shown = (part: string) => expect(drawing.locator(part).last());
  const night = chapter.locator("[data-night]");
  // How far the strip of map has slid, as a share of its whole way.
  const slid = () =>
    drawing.locator("[data-world]").evaluate((world: SVGGElement) => {
      const x = Number(
        /translate\((-?[\d.]+)/.exec(world.getAttribute("transform")!)![1],
      );
      return -x / Number(world.dataset.travel);
    });

  // Nothing is on stage before its moment.
  await expect(line("next")).toHaveCSS("opacity", "0");
  await shown("[data-plane]").toHaveCSS("opacity", "0");
  await shown("[data-tower]").toHaveCSS("opacity", "0");

  // Departure: the map, the pin and the plane were there on the way in; the first
  // line rests, the plane has not left and the sky is still paper.
  await playFlight(page, 1.6);
  await expect(line("next")).toHaveCSS("opacity", "1");
  await shown("[data-plane]").toHaveCSS("opacity", "1");
  await expect(night).toHaveCSS("opacity", "0");
  await expect(header).not.toHaveAttribute("data-tone");
  await expect.poll(slid).toBeLessThan(0.02);

  // The first stretch is flown by day: the plane is airborne over the land, the sky
  // is still paper, and a cloud has drifted into the frame.
  await playFlight(page, 5.6);
  await expect.poll(slid).toBeGreaterThan(0.08);
  await expect(night).toHaveCSS("opacity", "0");
  await expect(header).not.toHaveAttribute("data-tone");
  await shown("[data-land]").toHaveCSS("opacity", "1");
  await shown("[data-city-lights]").toHaveCSS("opacity", "0");
  const cloud = drawing.locator("[data-cloud]").first();
  const cloudAt = async () => (await cloud.boundingBox())!.x;
  const cloudBefore = await cloudAt();
  expect(cloudBefore).toBeLessThan(page.viewportSize()!.width);
  await playFlight(page, 6.2);
  await expect.poll(cloudAt).toBeLessThan(cloudBefore);

  // Just before the second line: the sky is dark, the header has turned with it,
  // the cities' windows are lit, and the line is not up yet.
  await playFlight(page, 7.5);
  await expect(night).toHaveCSS("opacity", "1");
  await expect(header).toHaveAttribute("data-tone", "ink");
  await shown("[data-city-lights]").toHaveCSS("opacity", "1");
  await expect(line("night")).toHaveCSS("opacity", "0");
  // Layering: the lit windows are a layer above the land, so no tree may stand in
  // front of a block (it would be behind a window it should hide), and every window
  // lies on its block above the meadow.
  const misplaced = await drawing.evaluate((svg) => {
    const box = (el: Element) => el.getBoundingClientRect();
    const meets = (a: DOMRect, b: DOMRect) =>
      a.left < b.right &&
      b.left < a.right &&
      a.top < b.bottom &&
      b.top < a.bottom;
    const land = svg.querySelector("[data-land]")!;
    const lights = [...svg.querySelectorAll("[data-city-lights] rect")].map(
      box,
    );
    const trees = [...land.querySelectorAll("use")]
      .filter((use) => /tree|fir/.test(use.getAttribute("href")!))
      .map(box);
    const blocks = [...land.querySelectorAll("rect")].map(box);
    return lights.filter(
      (light) =>
        trees.some((tree) => meets(tree, light)) ||
        !blocks.some(
          (block) =>
            block.left <= light.left &&
            light.right <= block.right &&
            block.top <= light.top,
        ),
    ).length;
  });
  expect(misplaced).toBe(0);

  // The night line rests, paper-coloured on ink and readable, while the map drifts on.
  await playFlight(page, 8.6);
  await expect(line("night")).toHaveCSS("opacity", "1");
  await expect(header).toHaveCSS("background-color", "rgb(30, 43, 38)");
  const dark = await new AxeBuilder({ page })
    .include("[data-flight]")
    .include(".site-header")
    .withRules(["color-contrast"])
    .analyze();
  expect(dark.violations).toEqual([]);
  const before = await slid();
  await playFlight(page, 9.4);
  await expect.poll(slid).toBeGreaterThan(before);

  // Just before the third line: the sky is paper again, the plane has landed, the
  // whole skyline stands, and the line is not up yet.
  await playFlight(page, 15.9);
  await expect(night).toHaveCSS("opacity", "0");
  await expect(header).not.toHaveAttribute("data-tone");
  await expect.poll(slid).toBeCloseTo(1, 2);
  await shown("[data-tower]").toHaveCSS("opacity", "1");
  await shown("[data-rosewood]").toHaveCSS("opacity", "1");
  await shown("[data-rosewood-label]").toHaveCSS("opacity", "1");
  await shown("[data-land]").toHaveCSS("opacity", "1");
  await expect(line("place")).toHaveCSS("opacity", "0");
  await shown("[data-place-pin]").toHaveCSS("opacity", "0");

  // The pin has landed with its name before the windows light up.
  await playFlight(page, 19.6);
  await shown("[data-place-pin]").toHaveCSS("opacity", "1");
  await shown("[data-place-labels]").toHaveCSS("opacity", "1");
  await expect(drawing.locator("[data-place-labels]")).toContainText(
    "Hongkong",
  );
  await shown("[data-window]").toHaveCSS("opacity", "0");

  // Just before the fourth line: every window is lit.
  await playFlight(page, 21.1);
  await shown("[data-window]").toHaveCSS("opacity", "1");
  await expect(line("learn")).toHaveCSS("opacity", "0");

  // The end: the last line is up, the one before it gone, the route has run on.
  await playFlight(page, 27.9);
  await expect(line("learn", 1)).toHaveCSS("opacity", "1");
  await expect(line("learn")).toHaveCSS("opacity", "0");
  await expect(drawing.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
});

test("Concierge of the future is complete and static without motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  const chapter = page.locator("[data-concierge]");
  const drawing = chapter.locator("svg:visible");
  await expect(drawing).toHaveCount(1);
  await expect(drawing).toHaveAttribute("aria-hidden", "true");
  await expect(chapter.getByRole("heading", { level: 2 })).toHaveText(
    "Concierge of the future",
  );
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  // All seven lines of the copy are on the page at once.
  const lines = chapter.locator("[data-line]");
  await expect(lines).toHaveCount(7);
  for (const line of await lines.all()) {
    await expect(line).toBeVisible();
    await expect(line).toHaveCSS("opacity", "1");
  }
  // The desk with its bell, what is behind it, the small browser window and the two
  // empty frames; the route drawn. No dark scene: no backdrop, circuit or key.
  for (const part of ["[data-desk]", "[data-bell]", "[data-browser]"])
    await expect(drawing.locator(part)).toBeVisible();
  await expect(drawing.locator("[data-frame]")).toHaveCount(2);
  await expect(drawing.locator("[data-office-piece]").first()).toBeVisible();
  await expect(drawing.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  for (const part of ["[data-circuit]", "[data-key-stage]"])
    await expect(drawing.locator(part)).toBeHidden();
  await expect(chapter.locator("[data-backdrop]")).toBeHidden();
  // The tools are left out of the chapter (Mika, 2026-11-16).
  for (const tool of ["Claude", "Firecrawl", "Notion"])
    await expect(chapter).not.toContainText(tool);
});

test("Concierge of the future plays as a held scene, objects before text", async ({
  page,
}) => {
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-concierge]");
  const drawing = chapter.locator("svg:visible");
  const header = page.locator(".site-header");
  const line = (moment: string, index = 0) =>
    chapter.locator(`[data-group="${moment}"] [data-line]`).nth(index);
  const shown = (part: string) => expect(drawing.locator(part).last());
  const drawn = (part: string) =>
    expect(drawing.locator(part).last()).toHaveCSS("stroke-dashoffset", "0px");
  // How large the dark circle is, as a share of the frame's width.
  const dark = () =>
    chapter.evaluate((el) => {
      const circle = el.querySelector("[data-backdrop]")!;
      return (
        circle.getBoundingClientRect().width / el.getBoundingClientRect().width
      );
    });

  // Nothing is on stage before its moment.
  await expect(line("ask")).toHaveCSS("opacity", "0");
  await shown("[data-bell]").toHaveCSS("opacity", "0");
  await shown("[data-browser]").toHaveCSS("opacity", "0");

  // The question: the desk and the bell were there on the way in; the first line
  // rests on paper.
  await playConcierge(page, 2.6);
  await shown("[data-bell]").toHaveCSS("opacity", "1");
  await shown("[data-desk]").toHaveCSS("opacity", "1");
  await expect(line("ask")).toHaveCSS("opacity", "1");
  expect(await dark()).toBeLessThan(0.01);
  await expect(header).not.toHaveAttribute("data-tone");

  // Just before the second line: the frame is dark, the header has turned, the desk
  // has stepped back, the whole first circuit is drawn, and the line is not up yet.
  await playConcierge(page, 8.7);
  await expect.poll(dark).toBeGreaterThan(1);
  await expect(header).toHaveAttribute("data-tone", "ink");
  await shown("[data-desk]").toHaveCSS("opacity", "0");
  await drawn('[data-trace="spread"]');
  await shown('[data-node="spread"]').toHaveCSS("opacity", "1");
  await shown("[data-key-stage]").toHaveCSS("opacity", "0");
  await expect(line("how")).toHaveCSS("opacity", "0");

  // The line rests, paper-coloured on ink and readable.
  await playConcierge(page, 10);
  await expect(line("how")).toHaveCSS("opacity", "1");
  await expect(header).toHaveCSS("background-color", "rgb(30, 43, 38)");
  const contrast = await new AxeBuilder({ page })
    .include("[data-concierge]")
    .include(".site-header")
    .withRules(["color-contrast"])
    .analyze();
  expect(contrast.violations).toEqual([]);

  // Just before the third line: the key hangs there and the traces have gone around
  // it. No trace, and not the route, enters the key's box.
  await playConcierge(page, 13.9);
  await shown("[data-key-stage]").toHaveCSS("opacity", "1");
  await drawn('[data-trace="around"]');
  await expect(line("people")).toHaveCSS("opacity", "0");
  const crossings = await drawing.evaluate((svg) => {
    const box = svg
      .querySelector("[data-concierge-key] rect:last-of-type")!
      .getBoundingClientRect();
    let inside = 0;
    for (const path of svg.querySelectorAll<SVGPathElement>(
      "[data-trace], [data-route]",
    )) {
      const matrix = path.getScreenCTM()!;
      const length = path.getTotalLength();
      for (let at = 0; at <= length; at += 4) {
        const point = path.getPointAtLength(at).matrixTransform(matrix);
        if (
          point.x > box.left &&
          point.x < box.right &&
          point.y > box.top &&
          point.y < box.bottom
        )
          inside += 1;
      }
    }
    return { inside, box: box.width * box.height };
  });
  expect(crossings.box).toBeGreaterThan(0);
  expect(crossings.inside).toBe(0);

  // Just before the fourth line: paper again, the header with it; the desk is back
  // with the things behind it, wired up; the circuit and the key are gone.
  await playConcierge(page, 20.3);
  await expect.poll(dark).toBeLessThan(0.01);
  await expect(header).not.toHaveAttribute("data-tone");
  await shown("[data-desk]").toHaveCSS("opacity", "1");
  await shown("[data-office-piece]").toHaveCSS("opacity", "1");
  await drawn("[data-office-trace]");
  await shown("[data-circuit]").toHaveCSS("opacity", "0");
  await shown("[data-key-stage]").toHaveCSS("opacity", "0");
  await expect(line("behind")).toHaveCSS("opacity", "0");

  // The browser window stands before its line; the empty frames before theirs.
  await playConcierge(page, 25.5);
  await shown("[data-browser]").toHaveCSS("opacity", "1");
  await expect(line("project")).toHaveCSS("opacity", "0");
  await shown("[data-frame]").toHaveCSS("opacity", "0");
  await playConcierge(page, 27.7);
  await shown("[data-frame]").toHaveCSS("opacity", "1");
  await expect(line("project", 1)).toHaveCSS("opacity", "0");

  // The end: both last lines are up together, and the route has run on.
  await playConcierge(page, 31.9);
  await expect(line("project")).toHaveCSS("opacity", "1");
  await expect(line("project", 1)).toHaveCSS("opacity", "1");
  await drawn("[data-route]");
});

test("Check-out is the open guestbook without motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  const chapter = page.locator("[data-check-out]");
  await expect(chapter.getByRole("heading", { level: 2 })).toHaveText(
    "Check-out",
  );
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  // Both lines of the copy, and the book open (no closed cover).
  const lines = chapter.locator("[data-line]");
  await expect(lines).toHaveCount(2);
  for (const line of await lines.all()) {
    await expect(line).toBeVisible();
    await expect(line).toHaveCSS("opacity", "1");
  }
  await expect(chapter.locator("[data-book-cover]")).toBeHidden();
  // The two profiles, as links that open safely.
  for (const [name, href] of [
    ["LinkedIn", "https://www.linkedin.com/in/mika-trolp-767b63381/"],
    ["GitHub", "https://github.com/mtro-tech"],
  ]) {
    const link = chapter.getByRole("link", { name });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  // The contact form is switched off until its endpoint and the privacy notice
  // exist (CLAUDE.md §7): no part of a form is on the page, only an empty ruled page.
  await expect(page.locator("main form")).toHaveCount(0);
  await expect(page.locator("main").locator("input, textarea")).toHaveCount(0);
  await expect(chapter.locator("[data-rule]")).toHaveCount(5);
  await expect(chapter.locator("[data-rule]").first()).toBeVisible();
});

test("Check-out plays as a short held scene, objects before text", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "not held on phones");
  await page.goto("/de/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-check-out]");
  const shown = (part: string) => expect(chapter.locator(part).last());
  // How much of a writing line is drawn, as a share of its width.
  const ruled = (index: number) =>
    chapter
      .locator("[data-rule]")
      .nth(index)
      .evaluate(
        (track) =>
          track.querySelector(".rule")!.getBoundingClientRect().width /
          track.getBoundingClientRect().width,
      );

  // On the way in the closed book and the pen are placed; no text is up.
  await playCheckOut(page, 0);
  await shown("[data-book]").toHaveCSS("opacity", "1");
  await shown("[data-pen]").toHaveCSS("opacity", "1");
  await expect(chapter.locator("[data-book-cover]")).toBeVisible();
  await shown("[data-line]").toHaveCSS("opacity", "0");

  // The book is open and the invitation rests before the pen starts ruling.
  await playCheckOut(page, 2.1);
  await expect(chapter.locator('[data-line="open"]')).toHaveCSS("opacity", "1");
  await expect.poll(() => ruled(0)).toBeLessThan(0.05);

  // Every line is ruled, and dry (ink, not the route's red), before the tags drop.
  await playCheckOut(page, 5.3);
  for (const index of [0, 4])
    await expect.poll(() => ruled(index)).toBeGreaterThan(0.99);
  await shown("[data-rule] i").toHaveCSS("opacity", "0");
  await shown("[data-tag]").toHaveCSS("opacity", "0");

  // The tags hang before their line arrives.
  await playCheckOut(page, 6.3);
  await shown("[data-tag]").toHaveCSS("opacity", "1");
  await expect(chapter.locator('[data-line="more"]')).toHaveCSS("opacity", "0");

  // The end: the second line is up, the route has signed off with its full stop.
  await playCheckOut(page, 11.9);
  await expect(chapter.locator('[data-line="more"]')).toHaveCSS("opacity", "1");
  await expect(chapter.locator("[data-route]")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await shown("[data-stop]").toHaveCSS("opacity", "1");
});

test("on phones Check-out is a normal section, never held", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "desktop holds it");
  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const chapter = page.locator("[data-check-out]");
  await expect(chapter.locator(".pin-spacer")).toHaveCount(0);
  await chapter.locator("[data-tags]").scrollIntoViewIfNeeded();
  await expect(chapter.locator('[data-line="open"]')).toBeVisible();
  // Whatever fades in while scrolling ends fully shown.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(() =>
      chapter
        .getByRole("link", { name: "GitHub" })
        .evaluate((link) => getComputedStyle(link.closest("ul")!).opacity),
    )
    .toBe("1");
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
      // Scroll-linked animations (Check-out on phones) have no clock to rewind.
      if (!(animation.timeline instanceof DocumentTimeline)) continue;
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
