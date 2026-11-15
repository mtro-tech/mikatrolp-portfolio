// The academy, staged: Lucerne's waterfront, the school, where I am now, the modules.
// What the reader should feel: arriving in Lucerne as the town assembles itself, the
// bridge growing across the water under the route; a moment of bloom for the school;
// the pin landing as a plain "I am here"; and the favourite modules arriving one at a
// time, as books worth picking up: each drops into the text column and opens.
// Pace (CLAUDE.md §4): in every moment the objects move first, then the line arrives,
// then it rests before anything else starts.
// Idle motion (the water, the swan, the flowers, the key) is CSS, on inner elements.
import type { Scene } from "../../lib/motion";
import {
  beatMoves,
  holdStage,
  undrawnAfter,
  visible,
} from "../../lib/motion/stage";
import { academy as tokens, stage } from "../../lib/motion/tokens";

// Scroll-drawn paths declare pathLength="1000" (AcademyScene.astro).
const DRAWN = 1000;

export const academyScene: Scene = ({ isDesktop }) => {
  const frame = document.querySelector<HTMLElement>(
    "[data-academy] [data-stage-frame]",
  );
  // The drawing for this screen size (the other one is not displayed).
  const drawing = frame && visible<SVGSVGElement>(frame, "svg");
  if (!frame || !drawing) return;

  const one = <T extends Element = Element>(selector: string) =>
    drawing.querySelector<T>(selector);
  const all = (selector: string) => [...drawing.querySelectorAll(selector)];
  const text = (selector: string) => [...frame.querySelectorAll(selector)];

  const ridge = one("[data-ridge]");
  const water = one("[data-water]");
  const tower = one("[data-tower]");
  const piles = all("[data-pile]");
  const spans = all("[data-span]");
  const flowers = all("[data-flower]");
  const dates = one("[data-dates]");
  const pin = one("[data-pin]");
  const route = one<SVGPathElement>("[data-route]");

  const title = frame.querySelector("[data-title]");
  const [programme, school, now] = text("[data-line]");
  const modulesLabel = frame.querySelector("[data-modules-label]");
  const books = text("[data-book]");
  const covers = text("[data-book-cover]");
  const insides = text("[data-book-inside]");

  const { at } = tokens;
  const out = stage.beatOut.duration;

  return holdStage(
    frame,
    isDesktop ? tokens.screens.desktop : tokens.screens.phone,
    (timeline) => {
      const { beatIn, beatOut } = beatMoves(timeline);
      // An object arriving: it fades in while it moves the last bit into place.
      const arrive = (
        target: gsap.TweenTarget,
        from: gsap.TweenVars,
        move: { duration: number; ease: string; stagger?: number },
        position: number,
      ) =>
        timeline.fromTo(
          target,
          { autoAlpha: 0, ...from },
          { autoAlpha: 1, x: 0, y: 0, ...move },
          position,
        );

      // 1. Lucerne: the ridge settles, the lake rises, the tower stands up, and the
      //    bridge builds section by section under the route. Then the first line.
      beatIn(title, at.town);
      arrive(ridge, { y: tokens.ridge.fromY }, tokens.ridge, at.town);
      arrive(water, { y: tokens.water.fromY }, tokens.water, at.water);
      arrive(tower, { y: tokens.tower.fromY }, tokens.tower, at.tower);
      arrive(piles, { y: tokens.spans.fromY }, tokens.spans, at.bridge);
      arrive(spans, { y: tokens.spans.fromY }, tokens.spans, at.bridge);
      // The flowers wait for their own moment.
      timeline.set(flowers, { autoAlpha: 0 }, 0);
      timeline.fromTo(
        route,
        { strokeDashoffset: DRAWN },
        {
          strokeDashoffset: () => undrawnAfter(route),
          // As long as the sections take to arrive, so the line keeps up with them.
          duration:
            tokens.spans.duration + tokens.spans.stagger * (spans.length - 1),
        },
        at.bridge,
      );
      beatIn(programme, at.programme);
      beatOut(programme, at.flowers - out);

      // 2. The school: the flower boxes bloom along the bridge, and the two dates
      //    appear at its ends. Then the school's name.
      timeline.fromTo(
        flowers,
        { autoAlpha: 0, scale: 0, transformOrigin: "50% 100%" },
        {
          autoAlpha: 1,
          scale: 1,
          duration: tokens.flowers.duration,
          ease: tokens.flowers.ease,
          stagger: tokens.flowers.stagger,
        },
        at.flowers,
      );
      timeline.fromTo(
        dates,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: tokens.flowers.duration },
        at.flowers + tokens.flowers.stagger * flowers.length,
      );
      beatIn(school, at.school);
      beatOut(school, at.pin - out);

      // 3. Where I am now: the pin drops onto the bridge and bounces to rest.
      arrive(pin, { y: tokens.pin.fromY }, tokens.pin, at.pin);
      beatIn(now, at.now);
      beatOut([title, now], at.books - out);

      // 4. Favourite modules: each book drops into the column closed, then opens: the
      //    cover narrows away at the spine and its inside grows out on the other side.
      //    One book at a time, so each name gets its own moment.
      beatIn(modulesLabel, at.books);
      const half = tokens.open.duration / 2;
      books.forEach((book, index) => {
        const lands = at.books + tokens.open.afterLabel + index * at.bookStep;
        const opens = lands + tokens.book.duration + tokens.open.afterLanding;
        timeline
          // Opacity, not visibility: the name stays available to screen readers.
          .fromTo(
            book,
            { opacity: 0, y: tokens.book.fromY },
            {
              opacity: 1,
              y: 0,
              duration: tokens.book.duration,
              ease: tokens.book.ease,
            },
            lands,
          )
          .fromTo(
            covers[index],
            { scaleX: 1 },
            {
              scaleX: 0,
              transformOrigin: "0% 50%",
              duration: half,
              ease: "power1.in",
            },
            opens,
          )
          .fromTo(
            insides[index],
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: "100% 50%",
              duration: half,
              ease: "power1.out",
            },
            opens + half,
          );
      });

      // The route steps off the bridge and runs on towards the next chapter.
      timeline.to(
        route,
        { strokeDashoffset: 0, duration: tokens.route.duration },
        at.route,
      );

      // A rest at the end, so the list can be read before the scene lets go.
      timeline.set({}, {}, at.end);
    },
  );
};
