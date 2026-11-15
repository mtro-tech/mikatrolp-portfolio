// Behind the bar, staged: the room, the house, the pour, responsibility and growth,
// learning the new.
// What the reader should feel: walking into a warm, dim bar that builds around them;
// then the one generous moment of the chapter, when the pour runs over and red fills
// the screen ("today I tend bar there"); then the events arriving on a tray and, because
// of them, the drinks getting finished one by one, which is the growth the copy talks
// about; and last the tools coming to life in their niches, as curiosity, not a list.
// Pace (CLAUDE.md §4): in every moment the objects move first, then the line arrives,
// then it rests before anything else starts.
// Idle motion (the globes, the drinks, the tools working, the flood's bubbles) is CSS.
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

  const one = <T extends Element = Element>(selector: string) =>
    drawing.querySelector<T>(selector);
  const all = (selector: string) => [...drawing.querySelectorAll(selector)];
  const lines = (moment: string) => [
    ...frame.querySelectorAll(`[data-group="${moment}"] [data-line]`),
  ];

  const ceiling = one("[data-ceiling]");
  const wall = one("[data-wall]");
  const globes = all("[data-globe]");
  const counter = one("[data-counter]");
  const stools = all("[data-stool]");
  const glasses = all("[data-glass]");
  const liquids = all("[data-liquid]");
  const pour = one("[data-pour]");
  const bottle = one("[data-bottle]");
  const tray = one("[data-tray]");
  const ice = one('[data-garnish="ice"]');
  const peel = one('[data-garnish="peel"]');
  const tools = all("[data-tool]");
  const route = one<SVGElement>("[data-route]");
  const flood = frame.querySelector("[data-flood]");

  const title = frame.querySelector("[data-title]");
  const [joined1, joined2] = lines("joined");
  const [today] = lines("today");
  const [responsibility] = lines("responsibility");
  const [growth] = lines("growth");
  const [learning1, learning2] = lines("learning");

  const { at } = tokens;
  const out = stage.beatOut.duration;
  // What is left undrawn of the route (of 1000) once the counter's edge is drawn.
  // Measured when needed: the path's far end bends with the window (src/lib/scroll.ts).
  // On phones the edge is the whole drawn path (its edge length is given as 0).
  const edge = () => {
    const length = Number(route?.dataset.edgeLength ?? 0);
    const total = (route as SVGPathElement | null)?.getTotalLength() ?? 0;
    return length && total ? DRAWN * (1 - length / total) : 0;
  };
  const depth = (liquid: Element) =>
    Number((liquid as SVGElement).dataset.depth);

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

      // 1. The room builds: ceiling, back wall, the globes one by one, the counter,
      //    and the route running across as its edge. Then the first line.
      beatIn(title, at.room);
      arrive(ceiling, { y: tokens.ceiling.fromY }, tokens.ceiling, at.room);
      arrive(wall, { y: tokens.wall.fromY }, tokens.wall, at.wall);
      arrive(globes, { y: tokens.globes.fromY }, tokens.globes, at.globes);
      arrive(counter, { y: tokens.counter.fromY }, tokens.counter, at.counter);
      timeline.fromTo(
        route,
        { strokeDashoffset: DRAWN },
        { strokeDashoffset: edge, duration: tokens.edge.duration },
        at.edge,
      );
      beatIn(joined1, at.joined1);
      beatOut(joined1, at.stools - out);

      // 2. The house: stools slide up, the glasses are set down one after another
      //    (empty: every drink waits below its glass). Then the second line.
      liquids.forEach((liquid) =>
        timeline.set(liquid, { y: depth(liquid) + 6 }, 0),
      );
      arrive(stools, { y: tokens.stools.fromY }, tokens.stools, at.stools);
      arrive(glasses, { x: tokens.glasses.fromX }, tokens.glasses, at.glasses);
      beatIn(joined2, at.joined2);
      beatOut([title, joined2], at.bottle - out);

      // 3. Today: the bottle tips, a stream falls into the first glass, it fills, and
      //    then it runs over: red rises from below until it covers the frame.
      arrive(bottle, { y: tokens.bottle.fromY }, tokens.bottle, at.bottle);
      timeline
        .set(pour, { autoAlpha: 1 }, at.pour)
        .fromTo(
          pour,
          { strokeDashoffset: DRAWN },
          { strokeDashoffset: 0, duration: tokens.pour.duration },
          at.pour,
        )
        .to(
          [pour, bottle],
          { autoAlpha: 0, duration: tokens.pour.duration },
          at.flood,
        );
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

      // 4. Responsibility: the events arrive as a tray of small glasses. Then the line.
      arrive(tray, { x: tokens.tray.fromX }, tokens.tray, at.tray);
      beatIn(responsibility, at.responsibility);
      beatOut(responsibility, at.ice - out);

      //    ...and because of it, growth: the drinks are finished, ice into the second,
      //    a twist of peel onto the third. Then the line.
      arrive(ice, { y: tokens.garnish.fromY }, tokens.garnish, at.ice);
      arrive(peel, { y: tokens.garnish.fromY }, tokens.garnish, at.peel);
      beatIn(growth, at.growth);
      beatOut(growth, at.learning1 - out);

      // 5. Learning the new: the line first (it ends on a colon), then the tools land
      //    in their niches one by one and start working, then the line that names them.
      beatIn(learning1, at.learning1);
      beatOut(learning1, at.tools - out);
      arrive(tools, { y: tokens.tools.fromY }, tokens.tools, at.tools);
      beatIn(learning2, at.learning2);

      // The route leaves the counter's far end and runs on towards the next chapter.
      timeline.to(
        route,
        { strokeDashoffset: 0, duration: tokens.route.duration },
        at.route,
      );

      // A rest at the end, so the last line can be read before the scene lets go.
      timeline.set({}, {}, at.end);
    },
  );
};
