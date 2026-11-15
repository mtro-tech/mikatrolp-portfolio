// Foundations, staged: the ruler, 60 pegs, one goes first, carried on.
// What the reader should feel: order arriving (the ruler), the weight of the number as
// the pegs are counted out one by one, then the point of the chapter: the red peg moves
// first and the others follow. At the end it travels on down the route, because this
// is something Mika takes with him, not a stop he leaves behind.
// Idle motion (the pennant, the block breathing, the glint) is CSS, on inner elements.
import type { Scene } from "../../lib/motion";
import { beatMoves, holdStage, visible } from "../../lib/motion/stage";
import { foundations as tokens, stage } from "../../lib/motion/tokens";

// Scroll-drawn paths declare pathLength="1000" (FoundationsScene.astro).
const DRAWN = 1000;

export const foundationsScene: Scene = () => {
  const frame = document.querySelector<HTMLElement>(
    "[data-foundations] [data-stage-frame]",
  );
  // The drawing for this screen size (the other one is not displayed).
  const drawing = frame && visible<SVGSVGElement>(frame, "svg");
  if (!frame || !drawing) return;

  const one = (selector: string) => drawing.querySelector(selector);
  const all = (selector: string) => [...drawing.querySelectorAll(selector)];
  const number = (element: Element, name: string) =>
    Number((element as SVGElement).dataset[name]);

  const ruler = one("[data-ruler]");
  const ground = one("[data-ground]");
  const numeral = one("[data-numeral]");
  const pegsGroup = one("[data-pegs]");
  const pegs = all("[data-peg]");
  const arcs = one("[data-arcs]");
  const arcLines = all("[data-arc]");
  const arcHeads = all("[data-arc-head]");
  const leader = one("[data-leader]");
  const route = one("[data-route]");

  const title = frame.querySelector("[data-title]");
  const lines = (group: string) => [
    ...frame.querySelectorAll(`[data-group="${group}"] [data-line]`),
  ];
  const rank = lines("rank");
  const lesson = lines("lesson");
  const carry = lines("carry");

  const { at } = tokens;
  const out = stage.beatOut.duration;
  const total = numeral?.textContent ?? "";
  const counted = { people: 0 };
  // Pegs whose transform this scene has written, with the one they were drawn with.
  const placed: Element[] = [];
  const drawn = pegs.map((peg) => peg.getAttribute("transform") ?? "");

  // On the way in, order arrives: the leader is already standing on the route, having
  // come down it, and the ruler slides in beside it. So the route never arrives at an
  // empty page.
  const wayIn = (timeline: gsap.core.Timeline) => {
    if (leader) {
      timeline.set(
        leader,
        {
          autoAlpha: 1,
          x: number(leader, "startDx"),
          y: number(leader, "startDy"),
        },
        0,
      );
    }
    timeline.fromTo(
      ruler,
      { autoAlpha: 0, x: tokens.ruler.fromX },
      {
        autoAlpha: 1,
        x: 0,
        duration: tokens.ruler.duration,
        ease: tokens.ruler.ease,
      },
      tokens.approach.ruler,
    );
  };

  const release = holdStage(
    frame,
    tokens.screens,
    (timeline) => {
      const { beatIn, beatOut } = beatMoves(timeline);

      // 1. The ruler and the leader are there (they arrived on the way in).
      beatIn(title, at.title);
      beatIn(rank[0], at.rank1);

      // 2. Sixty: a peg pops up on each tick, and the numeral counts with them.
      beatIn(rank[1], at.rank2);
      timeline.set(pegsGroup, { autoAlpha: 1 }, 0);
      timeline.fromTo(
        numeral,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: tokens.count.pop },
        at.count,
      );
      if (numeral) {
        timeline.fromTo(
          counted,
          { people: 0 },
          {
            people: pegs.length,
            duration: tokens.count.duration,
            onUpdate: () => {
              numeral.textContent = String(Math.round(counted.people));
            },
          },
          at.count,
        );
      }
      // Each peg is placed by writing its transform directly (x, y, then its size around
      // the point it stands on). GSAP's own SVG scaling needs an origin measured from the
      // element's box, which is not reliable for pieces drawn with <use>.
      pegs.forEach((peg, index) => {
        const share = index / pegs.length;
        const home = { x: number(peg, "x"), y: number(peg, "y") };
        const size = number(peg, "size");
        const now = { x: number(peg, "dx"), y: number(peg, "dy"), scale: 0 };
        const place = () =>
          peg.setAttribute(
            "transform",
            `translate(${home.x + now.x} ${home.y + now.y}) scale(${size * now.scale})`,
          );
        place();
        placed.push(peg);
        timeline
          // It pops up as a small piece on its tick...
          .to(
            now,
            {
              scale: tokens.count.dot,
              duration: tokens.count.pop,
              ease: tokens.count.popEase,
              onUpdate: place,
            },
            at.count + share * tokens.count.duration,
          )
          // ...and later follows the leader into the block (moment 3).
          .to(
            now,
            {
              x: 0,
              y: 0,
              scale: 1,
              duration: tokens.follow.duration,
              ease: tokens.follow.ease,
              onUpdate: place,
            },
            at.follow + share * tokens.follow.span,
          );
      });

      // 3. One goes first: the leader steps off the route to the front of the ground.
      beatOut([title, ...rank], at.lesson - out);
      timeline.fromTo(
        ground,
        {
          autoAlpha: 0,
          scale: tokens.ground.fromScale,
          transformOrigin: "50% 50%",
        },
        {
          autoAlpha: 1,
          scale: 1,
          duration: tokens.ground.duration,
          ease: tokens.ground.ease,
        },
        at.lesson,
      );
      timeline.to(
        leader,
        { x: 0, y: 0, duration: tokens.step.duration, ease: tokens.step.ease },
        at.lesson,
      );
      beatIn(lesson[0], at.lesson1);
      beatIn(lesson[1], at.lesson2);

      // Respect earned both ways: one arc from the leader to the block, then one back.
      beatIn(lesson[2], at.lesson3);
      timeline.set(arcs, { autoAlpha: 1 }, at.arcs);
      arcLines.forEach((line, index) => {
        const start = at.arcs + index * tokens.arcs.gap;
        timeline
          .fromTo(
            line,
            { strokeDashoffset: DRAWN },
            { strokeDashoffset: 0, duration: tokens.arcs.duration },
            start,
          )
          .fromTo(
            arcHeads[index],
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: tokens.arcs.head },
            start + tokens.arcs.duration,
          );
      });
      beatOut(lesson, at.exit - out);
      timeline.to(arcs, { autoAlpha: 0, duration: out }, at.exit - out);

      // 4. Carried on: back onto the route, then down it and out towards the next chapter.
      //    The line is drawn at the same pace, so its tip stays under the peg.
      beatIn(carry[0], at.carry1);
      if (leader) {
        timeline
          .to(
            leader,
            {
              x: number(leader, "exitDx"),
              y: number(leader, "exitDy"),
              duration: tokens.exit.duration,
              ease: tokens.exit.ease,
            },
            at.exit,
          )
          .to(
            leader,
            {
              y: number(leader, "exitDy") + number(leader, "ride"),
              duration: tokens.ride.duration,
              ease: tokens.ride.ease,
            },
            at.ride,
          );
      }
      timeline.fromTo(
        route,
        { strokeDashoffset: DRAWN },
        {
          strokeDashoffset: 0,
          duration: tokens.ride.duration,
          ease: tokens.ride.ease,
        },
        at.ride,
      );
      beatIn(carry[1], at.carry2);

      // A short rest at the end, so the last line can be read before the scene lets go.
      timeline.set({}, {}, at.end);
    },
    wayIn,
  );

  // GSAP cannot put back what it did not write: when motion is switched off, show the
  // full count and stand every peg in its drawn place again.
  return () => {
    release();
    if (numeral) numeral.textContent = total;
    placed.forEach((peg) =>
      peg.setAttribute("transform", drawn[pegs.indexOf(peg)]),
    );
  };
};
