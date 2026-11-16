// Concierge of the future, staged: hospitality meets AI, the page's third big moment.
// What the reader should feel: curiosity, then a look inside. The route rings the
// concierge's bell; the dome lifts and the dark opens out of it, like looking into the
// machine. A circuit spreads with every bit of scrolling. Then the point of the chapter,
// drawn: the room key from Check-in hangs in the middle, and the traces go around it.
// People are not replaced. The dark closes, and the same kind of traces now work where
// guests never look, behind the desk. Last, the playful touch: this website, in a small
// browser window on the desk, and two empty frames for what follows.
// The desk and the bell are ready when the chapter scrolls into view, so the route
// never arrives at an empty page.
// Pace (CLAUDE.md §4): in every moment the objects move first, then the line arrives,
// then it rests.
// Idle motion (nodes, pulses, the bell's shine, the cursor) is CSS, on inner elements.
import type { Scene } from "../../lib/motion";
import {
  beatMoves,
  holdStage,
  toneHeader,
  undrawnAfter,
  visible,
} from "../../lib/motion/stage";
import { concierge as tokens, stage } from "../../lib/motion/tokens";

// Scroll-drawn paths declare pathLength="1000" (ConciergeScene.astro).
const DRAWN = 1000;

export const conciergeScene: Scene = ({ isDesktop }) => {
  const frame = document.querySelector<HTMLElement>(
    "[data-concierge] [data-stage-frame]",
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

  const backdrop = frame.querySelector<HTMLElement>("[data-backdrop]");
  const heart = one("[data-bell-heart]");
  const dome = one("[data-bell-dome]");
  const rings = one("[data-bell-rings]");
  const desk = [one("[data-desk]"), one("[data-desk-top]")];
  const route = one<SVGPathElement>("[data-route]");
  const circuit = one("[data-circuit]");
  const keyStage = one("[data-key-stage]");

  const title = frame.querySelector("[data-title]");
  const [ask] = lines("ask");
  const [how] = lines("how");
  const [people] = lines("people");
  const [behind1, behind2] = lines("behind");
  const [first, more] = lines("project");

  const { at, approach } = tokens;
  const out = stage.beatOut.duration;

  // The dark scene grows from the bell. Where that is, and how large the circle must
  // get to reach the farthest corner, depends on the screen.
  const door = () => {
    const box = frame.getBoundingClientRect();
    const bell = heart?.getBoundingClientRect() ?? box;
    const x = bell.left + bell.width / 2 - box.left;
    const y = bell.top + bell.height / 2 - box.top;
    const reach = Math.hypot(
      Math.max(x, box.width - x),
      Math.max(y, box.height - y),
    );
    // The circle is 100px wide (ConciergeOfTheFuture.astro), so its radius is 50px.
    return { x, y, scale: (reach / 50) * 1.05 };
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

  return holdStage(
    frame,
    isDesktop ? tokens.screens.desktop : tokens.screens.phone,
    (timeline) => {
      const { beatIn, beatOut } = beatMoves(timeline);
      const arrive = arriveOn(timeline);
      // A set of traces drawn one after another; each one's node lights up as the
      // trace reaches it.
      const drawTraces = (set: string, position: number) => {
        const nodes = all(`[data-node="${set}"]`);
        all(`[data-trace="${set}"]`).forEach((trace, index) => {
          const start = position + index * tokens.trace.stagger;
          timeline
            .fromTo(
              trace,
              { strokeDashoffset: DRAWN },
              { strokeDashoffset: 0, duration: tokens.trace.duration },
              start,
            )
            .fromTo(
              nodes[index],
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: tokens.trace.node },
              start + tokens.trace.duration,
            );
        });
      };

      // 1. The question. The route has arrived on the bell: it rings.
      timeline
        .to(dome, { y: tokens.ring.dip, duration: tokens.ring.down }, at.ring)
        .to(
          dome,
          { y: 0, duration: tokens.ring.up, ease: tokens.ring.ease },
          at.ring + tokens.ring.down,
        )
        .fromTo(
          rings,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: tokens.ring.down },
          at.ring,
        )
        .to(
          rings,
          { autoAlpha: 0, duration: tokens.ring.fade },
          at.ring + tokens.ring.down + tokens.ring.up,
        );
      beatIn(title, at.title);
      beatIn(ask, at.ask);
      beatOut([title, ask], at.lift - out);

      // 2. Looking inside: the dome lifts and the dark opens out of the bell. The
      //    desk steps back; the header turns with the frame.
      timeline.to(
        dome,
        {
          y: tokens.lift.y,
          duration: tokens.lift.duration,
          ease: tokens.lift.ease,
        },
        at.lift,
      );
      if (backdrop) {
        timeline
          .set(backdrop, { left: () => door().x, top: () => door().y }, at.door)
          .fromTo(
            backdrop,
            { scale: 0 },
            {
              scale: () => door().scale,
              duration: tokens.door.duration,
              ease: tokens.door.ease,
            },
            at.door,
          );
        const reach = tokens.door.duration * tokens.door.reachesHeader;
        toneHeader(
          timeline,
          "ink",
          at.door + reach,
          at.close + tokens.door.duration - reach,
        );
      }
      timeline.to(
        desk,
        { autoAlpha: 0, duration: tokens.door.duration / 2 },
        at.door,
      );
      // The route runs on as the trunk of a circuit, in right angles, and brass side
      // traces branch off it one after another: every bit of scrolling draws more.
      timeline.fromTo(
        route,
        { strokeDashoffset: DRAWN },
        {
          strokeDashoffset: () => undrawnAfter(route),
          duration: tokens.trunk.duration,
        },
        at.trunk,
      );
      drawTraces("spread", at.circuit);
      beatIn(how, at.how);
      beatOut(how, at.key - out);

      // 3. People first: the room key appears in the middle of the circuit, and the
      //    next traces bend around it. None crosses it.
      arrive(keyStage, { y: tokens.key.fromY }, tokens.key, at.key);
      drawTraces("around", at.around);
      beatIn(people, at.people);
      beatOut(people, at.close - out);

      // 4. Behind the scenes: the dark closes back into the bell, the dome comes
      //    down, the desk is there again.
      timeline.to(
        [circuit, keyStage],
        { autoAlpha: 0, duration: out },
        at.close - out,
      );
      if (backdrop) {
        timeline.to(
          backdrop,
          { scale: 0, duration: tokens.door.duration, ease: tokens.door.ease },
          at.close,
        );
      }
      timeline
        .to(
          desk,
          { autoAlpha: 1, duration: tokens.door.duration / 2 },
          at.close + tokens.door.duration / 2,
        )
        .to(
          dome,
          { y: 0, duration: tokens.lift.duration, ease: tokens.lift.ease },
          at.close + tokens.door.duration / 2,
        );
      // What is behind the desk shows on its front, and the traces reach each thing.
      arrive(
        all("[data-office-piece]"),
        { y: tokens.office.fromY },
        tokens.office,
        at.office,
      );
      timeline
        .fromTo(
          all("[data-office-trace]"),
          { strokeDashoffset: DRAWN },
          {
            strokeDashoffset: 0,
            duration: tokens.wiring.duration,
            stagger: tokens.wiring.stagger,
          },
          at.wiring,
        )
        .fromTo(
          all("[data-pulse]"),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: tokens.trace.node },
          at.behind1 - tokens.trace.node,
        );
      beatIn(behind1, at.behind1);
      beatOut(behind1, at.behind2 - out);
      beatIn(behind2, at.behind2);
      beatOut(behind2, at.project - out);

      // 5. The first project: this website, in a small window on the desk. Then two
      //    empty frames for what follows.
      arrive(
        one("[data-browser]"),
        { y: tokens.browser.fromY },
        tokens.browser,
        at.project,
      );
      beatIn(first, at.first);
      arrive(
        all("[data-frame]"),
        { y: tokens.browser.fromY },
        { ...tokens.browser, stagger: tokens.browser.stagger },
        at.frames,
      );
      beatIn(more, at.more);

      // 6. The route leaves the circuit and runs on towards the last chapter.
      timeline.to(
        route,
        { strokeDashoffset: 0, duration: tokens.route.duration },
        at.route,
      );

      // A rest at the end, so the last line can be read before the scene lets go.
      timeline.set({}, {}, at.end);
    },
    // On the way in: the desk rises into place and the bell lands on it.
    (timeline) => {
      const arrive = arriveOn(timeline);
      arrive(desk, { y: tokens.desk.fromY }, tokens.desk, approach.desk);
      arrive(
        one("[data-bell]"),
        { y: tokens.bell.fromY },
        tokens.bell,
        approach.bell,
      );
    },
  );
};
