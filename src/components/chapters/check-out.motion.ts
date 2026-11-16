// Check-out, staged (desktop only): the guestbook.
// What the reader should feel: arriving at the end, and being invited to leave a word.
// The route that drew the whole journey reaches a closed guestbook; it opens, and the
// route's pen rules the page line by line: the lines the visitor will write on. The
// links drop in as luggage tags. Last, the route signs off with a flourish and a full
// stop. Short on purpose: the form must be reached quickly, and the scene's end state
// is the usable page.
// The closed book and the pen are ready when the chapter scrolls into view, so the
// route never arrives at an empty page.
// Pace (CLAUDE.md §4): objects first, then the line, then a rest.
// Phones are not held (CheckOut.astro): this scene does nothing there.
import type { Scene } from "../../lib/motion";
import { beatMoves, holdStage } from "../../lib/motion/stage";
import { checkOut as tokens } from "../../lib/motion/tokens";

// Scroll-drawn paths declare pathLength="1000" (GuestbookScene.astro).
const DRAWN = 1000;

export const checkOutScene: Scene = ({ isDesktop }) => {
  const frame = document.querySelector<HTMLElement>(
    "[data-check-out] [data-stage-frame]",
  );
  const drawing = frame?.querySelector<SVGSVGElement>("svg");
  if (!isDesktop || !frame || !drawing) return;

  const one = <T extends Element = Element>(selector: string) =>
    frame.querySelector<T>(selector);
  const all = (selector: string) => [...frame.querySelectorAll(selector)];

  const book = one("[data-book]");
  const cover = one("[data-book-cover]");
  const leftPage = one("[data-book-left]");
  const pen = one<SVGGElement>("[data-pen]");
  const route = one("[data-route]");
  const tracks = all("[data-rule]");
  // What stands on a line once it is ruled: a field's label and its input. (None on
  // an empty guestbook page.)
  const written = tracks.map((track) => [
    ...(track.parentElement?.querySelectorAll("label, input, textarea") ?? []),
  ]);
  const seal = one("[data-seal]");
  if (!pen) return;

  const { at, approach } = tokens;
  // Where the pen lies when it is not writing (its place in the drawing).
  const rest = { x: 1080, y: 772 };

  // A point on a writing line, in the drawing's units: the pen is part of the
  // drawing, the lines are markup laid over it.
  const onLine = (track: Element, share: number) => {
    const box = track.getBoundingClientRect();
    const point = new DOMPoint(
      box.left + box.width * share,
      box.top + box.height / 2,
    ).matrixTransform(drawing.getScreenCTM()?.inverse());
    return point;
  };

  return holdStage(
    frame,
    tokens.screens,
    (timeline) => {
      const { beatIn } = beatMoves(timeline);

      // 1. The book opens: it slides to its place while the cover turns away at the
      //    spine and the left page unfolds on the other side. Then the invitation.
      const half = tokens.open.duration / 2;
      timeline
        .to(
          book,
          { xPercent: 0, duration: tokens.open.duration, ease: "power1.inOut" },
          at.open,
        )
        .fromTo(
          cover,
          { scaleX: 1 },
          {
            scaleX: 0,
            transformOrigin: "0% 50%",
            duration: half,
            ease: "power1.in",
          },
          at.open,
        )
        .fromTo(
          leftPage,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "100% 50%",
            duration: half,
            ease: "power1.out",
          },
          at.open + half,
        );
      beatIn(one("[data-title]"), at.title);
      beatIn(all('[data-line="open"]'), at.line);

      // 2. The pen rules the page. For each line it goes to the line's start, then
      //    draws across: the rule grows under its tip, wet (red) at first, then dry.
      tracks.forEach((track, index) => {
        const start = at.rules + index * tokens.rule.stagger;
        const rule = track.querySelector(".rule");
        timeline
          .to(
            pen,
            {
              x: () => onLine(track, 0).x,
              y: () => onLine(track, 0).y,
              duration: tokens.pen.move,
              ease: "power1.inOut",
            },
            start - tokens.pen.move,
          )
          .to(
            pen,
            {
              x: () => onLine(track, 1).x,
              duration: tokens.rule.duration,
            },
            start,
          )
          .fromTo(
            rule,
            { scaleX: 0 },
            { scaleX: 1, duration: tokens.rule.duration },
            start,
          )
          .fromTo(
            rule?.querySelector("i") ?? null,
            { opacity: 1 },
            { opacity: 0, duration: tokens.rule.settle },
            start + tokens.rule.duration,
          );
        if (written[index].length > 0) {
          timeline.fromTo(
            written[index],
            { opacity: 0 },
            { opacity: 1, duration: tokens.rule.settle },
            start + tokens.rule.duration,
          );
        }
      });
      // The pen is laid down again.
      timeline.to(
        pen,
        {
          x: rest.x,
          y: rest.y,
          duration: tokens.pen.duration,
          ease: tokens.pen.ease,
        },
        at.rules +
          (tracks.length - 1) * tokens.rule.stagger +
          tokens.rule.duration +
          tokens.rule.settle,
      );

      // 3. More from me: the links drop onto their rail as tags, then the line.
      beatIn(one("[data-tags]"), at.tags);
      timeline.fromTo(
        all("[data-tag]"),
        {
          opacity: 0,
          y: tokens.tags.fromY,
          rotation: tokens.tags.fromRotation,
        },
        {
          opacity: 1,
          y: 0,
          rotation: 0,
          duration: tokens.tags.duration,
          ease: tokens.tags.ease,
          stagger: tokens.tags.stagger,
        },
        at.tags + 0.1,
      );
      beatIn(all('[data-line="more"]'), at.more);

      // 4. Sign and send: the seal drops below the lines (when the form is on), and
      //    the route leaves the book as a flourish that ends in a full stop.
      if (seal) {
        timeline.fromTo(
          seal,
          { opacity: 0, y: tokens.seal.fromY },
          {
            opacity: 1,
            y: 0,
            duration: tokens.seal.duration,
            ease: tokens.seal.ease,
          },
          at.seal,
        );
      }
      timeline
        .fromTo(
          route,
          { strokeDashoffset: DRAWN },
          { strokeDashoffset: 0, duration: tokens.flourish.duration },
          at.flourish,
        )
        .fromTo(
          one("[data-stop]"),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: tokens.stop.duration },
          at.stop,
        );

      // A rest at the end: the scene's last state is the page to use.
      timeline.set({}, {}, at.end);
    },
    // On the way in: the closed book is dropped where the route arrives (one page
    // wide, lying in the middle), and the pen appears beside it.
    (timeline) => {
      timeline
        .set(book, { xPercent: tokens.book.closedShift }, 0)
        .set(leftPage, { scaleX: 0, transformOrigin: "100% 50%" }, 0)
        .fromTo(
          book,
          { opacity: 0, y: tokens.book.fromY },
          {
            opacity: 1,
            y: 0,
            duration: tokens.book.duration,
            ease: tokens.book.ease,
          },
          approach.book,
        )
        .fromTo(
          pen,
          { autoAlpha: 0, x: rest.x, y: rest.y + tokens.pen.fromY },
          {
            autoAlpha: 1,
            y: rest.y,
            duration: tokens.pen.duration,
            ease: tokens.pen.ease,
          },
          approach.pen,
        );
    },
  );
};
