// Behind the bar, staged: the room, the house, the pour, responsibility and growth,
// learning the new.
// What the reader should feel: walking into a warm, dim bar that builds around them
// (it builds while the chapter scrolls into view); then the one generous moment of the
// chapter, when the pour runs over and red fills the screen: a shaker is filled there
// step by step and the reader's own scrolling shakes it, the playful heart of the
// chapter ("today I tend bar there"), and the last glass is poured from it; then the
// events arriving on a tray and, because of them, the drinks getting finished one by
// one, which is the growth the copy talks about; and last the tools coming to life in
// their niches, as curiosity, not a list.
// Pace (CLAUDE.md §4): in every moment the objects move first, then the line arrives,
// then it rests before anything else starts.
// Pours: liquid leaves from the lowest lip of the tipped vessel, and a stream has run
// out completely before its vessel moves away, so it is never seen on its own.
// Idle motion (the globes, the drinks, the tools working, the flood's bubbles) is CSS.
import type { Scene } from "../../lib/motion";
import {
  beatMoves,
  holdStage,
  toneHeader,
  undrawnAfter,
  visible,
} from "../../lib/motion/stage";
import { bar as tokens, stage } from "../../lib/motion/tokens";

// Scroll-drawn paths declare pathLength="1000" (BarScene.astro).
const DRAWN = 1000;

// The shaker's drawing (Shaker.astro): its box is 320 units high, and its mouth, the
// point it turns around, is 50% across and 40.6% down. The rim is 58 units to each side.
const SHAKER = { units: 320, mouthX: 0.5, mouthY: 0.406, rim: 58 };

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
  const serve = one<SVGPathElement>("[data-serve]");
  const tray = one("[data-tray]");
  const ice = one('[data-garnish="ice"]');
  const peel = one('[data-garnish="peel"]');
  const tools = all("[data-tool]");
  const route = one<SVGElement>("[data-route]");
  const flood = frame.querySelector("[data-flood]");
  // The shaker is its own layer over the flood (BehindTheBar.astro, Shaker.astro).
  const shaker = frame.querySelector<HTMLElement>("[data-shaker]");
  const piece = (selector: string) => [
    ...(shaker?.querySelectorAll(selector) ?? []),
  ];
  const cubes = piece("[data-cube]");

  const title = frame.querySelector("[data-title]");
  const [joined1, joined2] = lines("joined");
  const [today] = lines("today");
  const [responsibility] = lines("responsibility");
  const [growth] = lines("growth");
  const [learning1, learning2] = lines("learning");

  const { at, approach } = tokens;
  const out = stage.beatOut.duration;
  // What is left undrawn of the route once the counter's edge is drawn.
  const edge = () => undrawnAfter(route as SVGPathElement | null);
  const number = (element: Element, name: string) =>
    Number((element as SVGElement).dataset[name]);

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

  // How far the shaker must move so that, tipped over the last glass, the low corner
  // of its rim is exactly where the stream into the glass comes out of it. Measured on screen
  // when asked, so it is right at every window size.
  const toGlass = () => {
    const matrix = serve?.getScreenCTM();
    if (!shaker || !serve || !matrix) return { x: 0, y: 0 };
    // The stream starts a little way up inside the tin; it comes out at the corner.
    const start = serve.getPointAtLength(number(serve, "inside"));
    const box = frame.getBoundingClientRect();
    const streamX = matrix.a * start.x + matrix.c * start.y + matrix.e;
    const streamY = matrix.b * start.x + matrix.d * start.y + matrix.f;
    // One drawing unit of the shaker on screen, at the size it pours at.
    const unit = (shaker.offsetHeight / SHAKER.units) * tokens.serve.scale;
    // Where the rim's corner sits relative to the mouth once the shaker is tipped.
    const tip = (tokens.serve.tip * Math.PI) / 180;
    const corner = {
      x: SHAKER.rim * Math.cos(tip) * unit,
      y: SHAKER.rim * Math.sin(tip) * unit,
    };
    return {
      x:
        streamX -
        box.left -
        (shaker.offsetLeft + shaker.offsetWidth * SHAKER.mouthX) -
        corner.x,
      y:
        streamY -
        box.top -
        (shaker.offsetTop + shaker.offsetHeight * SHAKER.mouthY) -
        corner.y,
    };
  };

  return holdStage(
    frame,
    isDesktop ? tokens.screens.desktop : tokens.screens.phone,
    (timeline) => {
      const { beatIn, beatOut } = beatMoves(timeline);
      const arrive = arriveOn(timeline);
      // A stream in the drawing: it grows down from the lip...
      const streamOn = (path: Element | null, position: number) =>
        timeline
          .set(path, { autoAlpha: 1 }, position)
          .fromTo(
            path,
            { strokeDashoffset: DRAWN },
            { strokeDashoffset: 0, duration: tokens.stream.duration },
            position,
          );
      // ...and when the pouring stops, its tail runs out downward.
      const streamOff = (path: Element | null, position: number) =>
        timeline
          .to(
            path,
            { strokeDashoffset: -DRAWN, duration: tokens.stream.duration },
            position,
          )
          .set(path, { autoAlpha: 0 }, position + tokens.stream.duration);

      // 1. The room already stands (it was built on the way in). The first line.
      beatIn(title, at.title);
      beatIn(joined1, at.joined1);
      beatOut(joined1, at.stools - out);

      // 2. The house: stools slide up, the glasses are set down one after another
      //    (empty: every drink waits below its glass). Then the second line.
      liquids.forEach((liquid) =>
        timeline.set(liquid, { y: number(liquid, "depth") + 6 }, 0),
      );
      arrive(stools, { y: tokens.stools.fromY }, tokens.stools, at.stools);
      arrive(glasses, { x: tokens.glasses.fromX }, tokens.glasses, at.glasses);
      beatIn(joined2, at.joined2);
      beatOut([title, joined2], at.bottle - out);

      // 3. Today: the bottle tips over the first glass, a stream falls from its lip,
      //    the glass fills, and then it runs over: red rises from below until it
      //    covers the frame. The stream runs out before the bottle goes.
      arrive(bottle, { y: tokens.bottle.fromY }, tokens.bottle, at.bottle);
      streamOn(pour, at.pour);
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
      streamOff(pour, at.pourEnd);
      timeline.to(
        bottle,
        { autoAlpha: 0, duration: tokens.bottle.duration },
        at.pourEnd + tokens.stream.duration + tokens.stream.pause,
      );
      // The header turns red once the flood has risen to it, and back as it drains.
      const reach = tokens.flood.duration * tokens.flood.reachesHeader;
      toneHeader(
        timeline,
        "red",
        at.flood + reach,
        at.drain + tokens.flood.duration - reach,
      );
      // Under cover of the flood the second drink is poured. The third glass stays
      // empty: it is waiting for the shaker.
      timeline.set(liquids[1], { y: 0 }, at.shaker);

      //    On the red, one step at a time. The shaker drops in.
      arrive(shaker, { y: tokens.shaker.fromY }, tokens.shaker, at.shaker);

      //    The jigger comes in upright above the tin, then turns around the corner
      //    of its rim while it comes down: the measure falls from that corner. When
      //    the measure has run out, the jigger turns back and leaves.
      const jigger = piece("[data-jigger]");
      const jiggerTip = piece("[data-jigger-tip]");
      timeline
        .fromTo(
          jigger,
          { autoAlpha: 0, x: tokens.jigger.fromX, y: tokens.jigger.fromY },
          {
            autoAlpha: 1,
            x: 0,
            y: tokens.jigger.hover,
            duration: tokens.jigger.duration,
            ease: tokens.jigger.ease,
          },
          at.jigger,
        )
        .to(
          jigger,
          { y: 0, duration: tokens.jigger.duration, ease: "power1.inOut" },
          at.jiggerTip,
        )
        .fromTo(
          jiggerTip,
          { rotation: 0 },
          {
            rotation: tokens.jigger.tip,
            // The corner of the rim (Shaker.astro draws it at the top right).
            transformOrigin: "100% 0%",
            duration: tokens.jigger.duration,
            ease: "power1.inOut",
          },
          at.jiggerTip,
        )
        .set(piece("[data-measure]"), { autoAlpha: 1 }, at.measure)
        .fromTo(
          piece("[data-measure]"),
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: "50% 0%",
            duration: tokens.stream.duration,
          },
          at.measure,
        )
        .fromTo(
          piece("[data-measure-tail]"),
          { scaleY: 1 },
          {
            scaleY: 0,
            transformOrigin: "50% 100%",
            duration: tokens.stream.duration,
          },
          at.measureEnd,
        )
        .to(
          jiggerTip,
          {
            rotation: 0,
            duration: tokens.jigger.duration,
            ease: "power1.inOut",
          },
          at.jiggerLeave,
        )
        .to(
          jigger,
          {
            autoAlpha: 0,
            x: tokens.jigger.fromX,
            y: tokens.jigger.fromY,
            duration: tokens.jigger.duration,
            ease: "power1.in",
          },
          at.jiggerLeave,
        );

      //    The scoop comes in from the side with five cubes lying in it, and tips
      //    over the rim; the ice turns with it. Then the cubes slide out through the
      //    lip one after another and drop into the tin's mouth. The scoop leaves.
      const scoopTurn = piece("[data-scoop-turn]");
      const scoopWall = piece("[data-scoop-wall]");
      const tipped = scoopWall[0] ? number(scoopWall[0], "tip") : 0;
      // Scoop and ice fade in as one group, so the ice never shows through the wall.
      arrive(
        piece("[data-scoop-enter]"),
        { x: tokens.scoop.fromX },
        tokens.scoop,
        at.scoop,
      );
      timeline.to(
        scoopTurn,
        {
          rotation: tipped,
          // The lip: the same corner of the scoop and of its load (Shaker.astro).
          transformOrigin: "100% 100%",
          duration: tokens.scoop.duration,
          ease: "power1.inOut",
        },
        at.scoopTip,
      );
      cubes.forEach((cube, index) => {
        const falls = at.cubes + index * tokens.cube.stagger;
        timeline
          // Along the scoop first, then down: out through the lip and into the tin.
          .to(
            cube,
            {
              x: number(cube, "dx"),
              duration: tokens.cube.duration,
              ease: "power1.out",
            },
            falls,
          )
          .to(
            cube,
            {
              y: number(cube, "dy"),
              rotation: tokens.cube.turn,
              transformOrigin: "50% 50%",
              duration: tokens.cube.duration,
              ease: "power2.in",
            },
            falls,
          );
      });
      // Only the scoop goes: the ice stays where it fell, inside the tin.
      timeline
        .to(
          scoopWall,
          {
            rotation: 0,
            duration: tokens.scoop.duration,
            ease: "power1.inOut",
          },
          at.scoopLeave,
        )
        .to(
          piece("[data-scoop]"),
          {
            autoAlpha: 0,
            x: tokens.scoop.fromX,
            duration: tokens.scoop.duration,
            ease: "power1.in",
          },
          at.scoopLeave,
        );

      //    The second tin closes it.
      arrive(piece("[data-cap]"), { y: tokens.cap.fromY }, tokens.cap, at.cap);

      //    The reader's scrolling shakes it: it leans over, then swings along its own
      //    length, with splash marks at each end of a swing. Scrubbed like everything
      //    else, so scrolling back shakes it backwards.
      const swing = tokens.shake.duration / tokens.shake.swings;
      // When the full swings start: after leaning over and the first half swing.
      const swings = at.shake + tokens.shake.settle + swing / 2;
      timeline
        .to(
          shaker,
          { rotation: tokens.shake.lean, duration: tokens.shake.settle },
          at.shake,
        )
        .fromTo(
          piece("[data-shake]"),
          { y: 0 },
          {
            y: -tokens.shake.travel,
            duration: swing / 2,
            ease: "sine.out",
          },
          at.shake + tokens.shake.settle,
        )
        .to(
          piece("[data-shake]"),
          {
            y: tokens.shake.travel,
            duration: swing,
            ease: "sine.inOut",
            repeat: tokens.shake.swings - 1,
            yoyo: true,
          },
          swings,
        )
        .to(
          piece("[data-shake]"),
          { y: 0, duration: swing / 2, ease: "sine.in" },
          swings + tokens.shake.duration,
        )
        .fromTo(
          piece('[data-splash="top"]'),
          { autoAlpha: 1 },
          {
            autoAlpha: 0,
            duration: swing,
            ease: "sine.inOut",
            repeat: tokens.shake.swings - 1,
            yoyo: true,
            // Not shown before the shaking starts.
            immediateRender: false,
          },
          swings,
        )
        .fromTo(
          piece('[data-splash="bottom"]'),
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: swing,
            ease: "sine.inOut",
            repeat: tokens.shake.swings - 1,
            yoyo: true,
            immediateRender: false,
          },
          swings,
        )
        .to(
          piece("[data-splash]"),
          { autoAlpha: 0, duration: tokens.shake.settle },
          at.rest,
        )
        .to(shaker, { rotation: 0, duration: tokens.shake.settle }, at.rest);

      //    Only now the line, on the red beside the resting shaker.
      beatIn(today, at.today);
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

      //    The red has gone. The shaker opens and, tipping as it goes so that it stays
      //    above the glasses, moves until the low corner of its rim is over the third
      //    glass. The drink falls from that corner; the glass fills; the stream runs
      //    out; only then does the shaker turn back and leave.
      timeline
        .to(
          piece("[data-cap]"),
          { autoAlpha: 0, y: tokens.cap.fromY, duration: tokens.cap.duration },
          at.serve,
        )
        .to(
          shaker,
          {
            x: () => toGlass().x,
            y: () => toGlass().y,
            scale: tokens.serve.scale,
            rotation: tokens.serve.tip,
            duration: tokens.serve.duration,
            ease: tokens.serve.ease,
          },
          at.serve,
        );
      streamOn(serve, at.stream);
      timeline.to(
        liquids[2],
        { y: 0, duration: tokens.serve.fill, ease: tokens.fill.ease },
        at.stream + tokens.stream.duration,
      );
      streamOff(serve, at.streamEnd);
      timeline.to(
        shaker,
        {
          autoAlpha: 0,
          rotation: tokens.serve.tip / 2,
          y: () => toGlass().y + tokens.shaker.fromY,
          duration: tokens.serve.leave,
          ease: "power1.in",
        },
        at.leave,
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
    // On the way in, the room builds from the top down: ceiling, back wall, the globes
    // one by one, the counter, and the route running across as its edge.
    (timeline) => {
      const arrive = arriveOn(timeline);
      arrive(
        ceiling,
        { y: tokens.ceiling.fromY },
        tokens.ceiling,
        approach.room,
      );
      arrive(wall, { y: tokens.wall.fromY }, tokens.wall, approach.wall);
      arrive(
        globes,
        { y: tokens.globes.fromY },
        tokens.globes,
        approach.globes,
      );
      arrive(
        counter,
        { y: tokens.counter.fromY },
        tokens.counter,
        approach.counter,
      );
      timeline.fromTo(
        route,
        { strokeDashoffset: DRAWN },
        { strokeDashoffset: edge, duration: tokens.edge.duration },
        approach.edge,
      );
    },
  );
};
