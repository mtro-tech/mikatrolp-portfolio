// The academy, staged: Lucerne's waterfront, the school, where I am now, the modules.
// What the reader should feel: arriving in Lucerne as the town assembles itself, the
// bridge growing across the water under the route; a moment of bloom for the school;
// the pin landing as a plain "I am here"; and the favourite modules arriving as books
// worth picking up: three are dropped into the text column, then opened one by one.
// The town builds while the chapter scrolls into view, so the route never arrives at
// an empty page; once the frame is held, the text can begin.
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
  const leftHalves = text("[data-book-left]");

  const { at, approach } = tokens;
  const out = stage.beatOut.duration;

  // An object arriving: it fades in while it moves the last bit into place.
  const arriveOn =
    (timeline: gsap.core.Timeline) =>
    (
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

  return holdStage(
    frame,
    isDesktop ? tokens.screens.desktop : tokens.screens.phone,
    (timeline) => {
      const { beatIn, beatOut } = beatMoves(timeline);
      const arrive = arriveOn(timeline);

      // 1. The town already stands (it was built on the way in). The first line.
      beatIn(title, at.title);
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

      // 4. Favourite modules. First all three books are dropped into the column,
      //    closed, one after another: a small pile of things worth opening.
      beatIn(modulesLabel, at.books);
      books.forEach((book, index) => {
        timeline
          // Closed, a book is as wide as one page and lies in the middle of its place.
          .set(book, { xPercent: tokens.book.closedShift }, 0)
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
            at.drop + index * at.dropStep,
          );
      });

      //    Then they are opened one after another, each with a rest for its name:
      //    the book slides to its place while the cover turns away at the spine, and
      //    the left page unfolds on the other side.
      const half = tokens.open.duration / 2;
      books.forEach((book, index) => {
        const opens = at.open + index * at.openStep;
        timeline
          .to(
            book,
            {
              xPercent: 0,
              duration: tokens.open.duration,
              ease: "power1.inOut",
            },
            opens,
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
            leftHalves[index],
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
    // On the way in: the ridge settles, the lake rises, the tower stands up, and the
    // bridge builds section by section under the route.
    (timeline) => {
      const arrive = arriveOn(timeline);
      arrive(ridge, { y: tokens.ridge.fromY }, tokens.ridge, approach.town);
      arrive(water, { y: tokens.water.fromY }, tokens.water, approach.water);
      arrive(tower, { y: tokens.tower.fromY }, tokens.tower, approach.tower);
      arrive(piles, { y: tokens.spans.fromY }, tokens.spans, approach.bridge);
      arrive(spans, { y: tokens.spans.fromY }, tokens.spans, approach.bridge);
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
        approach.bridge,
      );
    },
  );
};
