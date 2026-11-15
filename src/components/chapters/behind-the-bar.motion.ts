// Behind the bar, staged: the counter, the pour, the three glasses, the tools.
// What the reader should feel: arriving at a bar being set up; then the one generous
// moment of the chapter, when the pour runs over and red fills the screen ("today I
// tend bar there"); then, as it settles, three drinks each more finished than the
// last, which is the growth the copy talks about. The tools on the shelf come last,
// as the quiet proof of craft.
// Idle motion (the lamp, the drinks, the fizz, the bubbles in the flood) is CSS.
import type { Scene } from "../../lib/motion";
import { beatMoves, holdStage, visible } from "../../lib/motion/stage";
import { bar as tokens, stage } from "../../lib/motion/tokens";

// Scroll-drawn paths declare pathLength="1000" (BarScene.astro).
const DRAWN = 1000;

export const barScene: Scene = ({ isDesktop }) => {
  const frame = document.querySelector<HTMLElement>(
    "[data-bar] [data-stage-frame]",
  );
  // The drawing for this screen size (the other one is not displayed).
  const drawing = frame && visible<SVGSVGElement>(frame, "svg");
  if (!frame || !drawing) return;

  const one = (selector: string) => drawing.querySelector(selector);
  const all = (selector: string) => [...drawing.querySelectorAll(selector)];
  const text = (selector: string) => [...frame.querySelectorAll(selector)];

  const counter = one("[data-counter]");
  const lamp = one("[data-lamp]");
  const glasses = all("[data-glass]");
  const liquids = all("[data-liquid]");
  const pour = one("[data-pour]");
  const bottle = one("[data-bottle]");
  const ice = one('[data-garnish="ice"]');
  const peel = one('[data-garnish="peel"]');
  const shelf = one("[data-shelf]");
  const tools = all("[data-tool]");
  const route = one<SVGElement>("[data-route]");
  const flood = frame.querySelector("[data-flood]");

  const title = frame.querySelector("[data-title]");
  const joined = text('[data-group="joined"] [data-line]');
  const today = text('[data-group="today"] [data-line]');
  const growth = text('[data-group="growth"] [data-line]');
  const toolsLabel = frame.querySelector("[data-tools-label]");
  const toolNames = text("[data-tool-name]");

  const { at } = tokens;
  const out = stage.beatOut.duration;
  // What is left undrawn of the route (of 1000) once the counter's edge is drawn.
  const edge = Number(route?.dataset.edge ?? 0);
  const depth = (liquid: Element) =>
    Number((liquid as SVGElement).dataset.depth);

  return holdStage(
    frame,
    isDesktop ? tokens.screens.desktop : tokens.screens.phone,
    (timeline) => {
      const { beatIn, beatOut } = beatMoves(timeline);

      // 1. The counter: it rises into place and the route runs across as its top edge.
      //    The lamp drops in, the empty glasses slide on. The lines replace each other.
      beatIn(title, at.title);
      timeline.fromTo(
        counter,
        { autoAlpha: 0, y: tokens.counter.fromY },
        {
          autoAlpha: 1,
          y: 0,
          duration: tokens.counter.duration,
          ease: tokens.counter.ease,
        },
        at.counter,
      );
      timeline.fromTo(
        route,
        { strokeDashoffset: DRAWN },
        { strokeDashoffset: edge, duration: tokens.edge.duration },
        at.counter + tokens.counter.duration / 2,
      );
      timeline.fromTo(
        lamp,
        { autoAlpha: 0, y: tokens.lamp.fromY },
        {
          autoAlpha: 1,
          y: 0,
          duration: tokens.lamp.duration,
          ease: tokens.lamp.ease,
        },
        at.lamp,
      );
      // The glasses arrive empty: every drink waits below its glass.
      liquids.forEach((liquid) =>
        timeline.set(liquid, { y: depth(liquid) + 6 }, 0),
      );
      timeline.fromTo(
        glasses,
        { autoAlpha: 0, x: tokens.glasses.fromX },
        {
          autoAlpha: 1,
          x: 0,
          duration: tokens.glasses.duration,
          ease: tokens.glasses.ease,
          stagger: tokens.glasses.stagger,
        },
        at.glasses,
      );
      // Every moment's lines replace each other: `until` is when the last one leaves.
      const oneByOne = (
        lines: Element[],
        start: number,
        step: number,
        until: number,
      ) =>
        lines.forEach((line, index) => {
          beatIn(line, start + index * step);
          const next =
            index + 1 < lines.length ? start + (index + 1) * step : until;
          beatOut(line, next - out);
        });
      oneByOne(joined, at.joined, at.joinedStep, at.pour);
      beatOut(title, at.pour - out);

      // 2. The pour: a stream into the first glass, which fills. Then it runs over:
      //    red rises from below until it covers the frame.
      timeline
        .fromTo(
          bottle,
          { autoAlpha: 0, y: tokens.bottle.fromY },
          {
            autoAlpha: 1,
            y: 0,
            duration: tokens.bottle.duration,
            ease: tokens.bottle.ease,
          },
          at.pour - tokens.bottle.duration,
        )
        .to(bottle, { autoAlpha: 0, duration: tokens.pour.duration }, at.flood);
      timeline
        .set(pour, { autoAlpha: 1 }, at.pour)
        .fromTo(
          pour,
          { strokeDashoffset: DRAWN },
          { strokeDashoffset: 0, duration: tokens.pour.duration },
          at.pour,
        )
        .to(pour, { autoAlpha: 0, duration: tokens.pour.duration }, at.flood);
      timeline.to(
        liquids[0],
        { y: 0, duration: tokens.fill.duration, ease: tokens.fill.ease },
        at.fill,
      );
      timeline.fromTo(
        flood,
        { opacity: 1, yPercent: 101 },
        {
          yPercent: 0,
          duration: tokens.flood.duration,
          ease: tokens.flood.ease,
        },
        at.flood,
      );
      beatIn(today, at.today);
      // Under cover of the flood the other two drinks are poured.
      timeline.set(liquids.slice(1), { y: 0 }, at.today);

      // 3. It drains away, and three drinks stand there, each more finished than the
      //    last: plain, with ice, with a twist of peel.
      beatOut(today, at.drain - out);
      timeline.to(
        flood,
        {
          yPercent: 101,
          duration: tokens.flood.duration,
          ease: tokens.flood.ease,
        },
        at.drain,
      );
      oneByOne(growth, at.growth, at.growthStep, at.shelf);
      [ice, peel].forEach((garnish, index) =>
        timeline.fromTo(
          garnish,
          { autoAlpha: 0, y: tokens.garnish.fromY },
          {
            autoAlpha: 1,
            y: 0,
            duration: tokens.garnish.duration,
            ease: tokens.garnish.ease,
          },
          at.growth + index * at.growthStep + 0.2,
        ),
      );

      // 4. The tools: the shelf slides in and each tool lands on it as its name appears.
      timeline.fromTo(
        shelf,
        { autoAlpha: 0, x: tokens.shelf.fromX },
        {
          autoAlpha: 1,
          x: 0,
          duration: tokens.shelf.duration,
          ease: tokens.shelf.ease,
        },
        at.shelf,
      );
      beatIn(toolsLabel, at.shelf);
      tools.forEach((tool, index) => {
        const start = at.tools + index * at.toolStep;
        timeline.fromTo(
          tool,
          { autoAlpha: 0, y: tokens.tool.fromY },
          {
            autoAlpha: 1,
            y: 0,
            duration: tokens.tool.duration,
            ease: tokens.tool.ease,
          },
          start,
        );
        beatIn(toolNames[index], start);
      });

      // The route leaves the counter's far end and runs on towards the next chapter.
      timeline.to(
        route,
        { strokeDashoffset: 0, duration: tokens.route.duration },
        at.route,
      );

      // A short rest at the end, so the names can be read before the scene lets go.
      timeline.set({}, {}, at.end);
    },
  );
};
