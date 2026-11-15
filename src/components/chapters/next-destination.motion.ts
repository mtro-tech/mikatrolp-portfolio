// Next destination, staged: the flight to Hong Kong, the page's second big moment.
// What the reader should feel: setting off. The plane that once flew to Toronto lifts
// off again, the cabin lights go down (the frame turns to night, the header with it),
// and for a long stretch the reader's own scrolling flies the plane while the world
// slides past underneath, with small lit joints far below. Then the sky opens and a
// skyline rises tower by tower, the way St. Gallen rose in the hero, but far taller: the
// same journey, a much bigger place. The pin lands; rooms light up one by one.
// The map and the plane are ready when the chapter scrolls into view, so the route
// never arrives at an empty page.
// Pace (CLAUDE.md §4): in every moment the objects move first, then the line arrives,
// then it rests. During the flight the map keeps drifting under a line that rests.
// Idle motion (stars, lit windows, the plane's bob, the ferry) is CSS, on inner elements.
import type { Scene } from "../../lib/motion";
import {
  beatMoves,
  holdStage,
  toneHeader,
  undrawnAfter,
  visible,
} from "../../lib/motion/stage";
import { flight as tokens, stage } from "../../lib/motion/tokens";

// Scroll-drawn paths declare pathLength="1000" (FlightScene.astro).
const DRAWN = 1000;

export const flightScene: Scene = ({ isDesktop }) => {
  const frame = document.querySelector<HTMLElement>(
    "[data-flight] [data-stage-frame]",
  );
  // The drawing for this screen size (the other one is not displayed).
  const drawing = frame && visible<SVGSVGElement>(frame, "svg");
  if (!frame || !drawing) return;

  const one = <T extends Element = Element>(selector: string) =>
    drawing.querySelector<T>(selector);
  const all = (selector: string) => [...drawing.querySelectorAll(selector)];
  const lines = (moment: string) => [
    ...frame.querySelectorAll(`[data-group="${moment}"] [data-line]`),
  ];

  const world = one<SVGGElement>("[data-world]");
  const path = one<SVGPathElement>("[data-flight-path]");
  const plane = one<SVGGElement>("[data-plane]");
  const route = one<SVGPathElement>("[data-route]");
  const night = frame.querySelector("[data-night]");
  const towers = all("[data-tower]");
  const grid = one("[data-grid]");
  if (!world || !path || !plane) return;

  const title = frame.querySelector("[data-title]");
  const [next] = lines("next");
  const [benchmark] = lines("night");
  const [noBetter] = lines("place");
  const [learn1, learn2] = lines("learn");

  const { at, approach } = tokens;
  const out = stage.beatOut.duration;
  const travel = Number(world.dataset.travel);
  const length = path.getTotalLength();
  // What the scene writes itself, to put back when motion is switched off.
  const drawn = {
    world: world.getAttribute("transform") ?? "",
    plane: plane.getAttribute("transform") ?? "",
  };

  // The flight, as one number from 0 (on the Lucerne pin) to 1 (landed). The strip
  // slides left by the same share as the plane has flown, the path is drawn up to the
  // plane, and the plane points along the path. Written directly: the three must never
  // drift apart, and GSAP's own SVG transforms are not needed for it.
  const flown = { share: tokens.flight.start };
  const fly = () => {
    const here = path.getPointAtLength(length * flown.share);
    const ahead = path.getPointAtLength(
      Math.min(length, length * flown.share + 1),
    );
    const behind = path.getPointAtLength(Math.max(0, length * flown.share - 1));
    // It points along the path, and levels out over the last stretch, so it lands
    // flat on the quay instead of nose first.
    const level = Math.min(1, (1 - flown.share) / tokens.flight.levelOut);
    const heading =
      ((Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI) *
      level;
    world.setAttribute("transform", `translate(${-travel * flown.share} 0)`);
    plane.setAttribute(
      "transform",
      `translate(${here.x} ${here.y}) rotate(${heading})`,
    );
    path.style.strokeDashoffset = String(DRAWN * (1 - flown.share));
  };

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

  const release = holdStage(
    frame,
    isDesktop ? tokens.screens.desktop : tokens.screens.phone,
    (timeline) => {
      const { beatIn, beatOut } = beatMoves(timeline);
      const arrive = arriveOn(timeline);

      // 1. Departure: the map, the pin and the plane are there (from the way in).
      beatIn(title, at.title);
      beatIn(next, at.next);
      beatOut([title, next], at.takeOff - out);

      // 2. Take-off: the sky closes in to night, a few stars come out, and the
      //    header turns with it.
      timeline
        .fromTo(
          night,
          { opacity: 0 },
          { opacity: 1, duration: tokens.night.duration },
          at.takeOff,
        )
        .fromTo(
          one("[data-stars]"),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: tokens.night.duration },
          at.takeOff,
        )
        // The map's grid would glare on the dark sky: it dims to a faint chart.
        // (So does the country around Lucerne, whose lakes and label are drawn for
        // paper: it is left behind in the dusk.)
        .to(
          [grid, one("[data-origin-map]")],
          { opacity: tokens.night.grid, duration: tokens.night.duration },
          at.takeOff,
        );
      const reach = tokens.night.duration * tokens.night.reachesHeader;
      toneHeader(
        timeline,
        "ink",
        at.takeOff + reach,
        at.dawn + tokens.night.duration - reach,
      );

      // 3. The flight: the reader's scrolling flies the plane, and the world slides
      //    past underneath. One long, even movement: something moves with every bit
      //    of scrolling. The line arrives mid-flight and rests while the map drifts.
      timeline.fromTo(
        flown,
        { share: tokens.flight.start },
        {
          share: 1,
          duration: at.landed - at.takeOff,
          ease: tokens.flight.ease,
          onUpdate: fly,
        },
        at.takeOff,
      );
      beatIn(benchmark, at.benchmark);
      beatOut(benchmark, at.dawn - out);

      // 4. Descent: the sky opens again, the harbour's water slides in, and the
      //    skyline rises tower by tower, like St. Gallen in the hero.
      timeline
        .to(night, { opacity: 0, duration: tokens.night.duration }, at.dawn)
        .to(
          one("[data-stars]"),
          { autoAlpha: 0, duration: tokens.night.duration },
          at.dawn,
        )
        .to(grid, { opacity: 1, duration: tokens.night.duration }, at.dawn);
      arrive(
        [one("[data-hills]"), one("[data-harbour]")],
        { y: tokens.harbour.fromY },
        tokens.harbour,
        at.harbour,
      );
      // Each tower comes up from behind the waterline. (Moved, not scaled: scaling
      // an SVG piece around its own foot is not reliable with GSAP.)
      const rise = Number(world.dataset.rise);
      timeline.fromTo(
        towers,
        { autoAlpha: 0, y: rise },
        {
          autoAlpha: 1,
          y: 0,
          duration: tokens.towers.duration,
          ease: tokens.towers.ease,
          stagger: tokens.towers.stagger,
        },
        at.towers,
      );
      beatIn(noBetter, at.noBetter);
      beatOut(noBetter, at.windows - out);

      // 5. Landing: the pin drops at the water's edge, the route runs along the quay
      //    to it, the name and the date appear, a ferry sets off.
      arrive(
        one("[data-place-pin]"),
        { y: tokens.pin.fromY },
        tokens.pin,
        at.pin,
      );
      timeline
        .fromTo(
          route,
          { strokeDashoffset: DRAWN },
          {
            strokeDashoffset: () => undrawnAfter(route),
            duration: tokens.pin.duration,
          },
          at.pin,
        )
        .fromTo(
          [one("[data-place-labels]"), one("[data-ferry]")],
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: tokens.pin.duration },
          at.pin + tokens.pin.duration,
        );

      // 6. What I want to learn: windows light up one by one, as rooms. Then the lines.
      timeline.fromTo(
        all("[data-window]"),
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: tokens.windows.duration,
          stagger: tokens.windows.stagger,
        },
        at.windows,
      );
      beatIn(learn1, at.learn1);
      beatOut(learn1, at.learn2 - out);
      beatIn(learn2, at.learn2);

      // The route leaves the pin and runs on towards the next chapter.
      timeline.to(
        route,
        { strokeDashoffset: 0, duration: tokens.route.duration },
        at.route,
      );

      // A rest at the end, so the last line can be read before the scene lets go.
      timeline.set({}, {}, at.end);
    },
    // On the way in: the strip is back at its start, the country around Lucerne
    // appears, the pin drops where the route arrives, and the plane is waiting on it.
    (timeline) => {
      const arrive = arriveOn(timeline);
      timeline.call(fly, undefined, 0);
      arrive(
        one("[data-origin-map]"),
        { y: tokens.map.fromY },
        tokens.map,
        approach.map,
      );
      arrive(
        one("[data-origin-pin]"),
        { y: tokens.pin.fromY },
        tokens.pin,
        approach.pin,
      );
      timeline.fromTo(
        plane,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: tokens.pin.duration },
        approach.plane,
      );
    },
  );
  // Before either timeline is built the strip must already be at its start: the
  // finished drawing (slid to the skyline) is only for the motion-off version.
  fly();

  // GSAP cannot put back what it did not write: when motion is switched off, slide
  // the strip to the skyline again and park the plane where it lands.
  return () => {
    release();
    world.setAttribute("transform", drawn.world);
    plane.setAttribute("transform", drawn.plane);
    path.style.strokeDashoffset = "";
  };
};
