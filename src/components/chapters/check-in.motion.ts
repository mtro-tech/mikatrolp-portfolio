// Check-in, staged: the key, the door, the map, the languages.
// What the reader should feel: being handed a key, the door opening into what
// hospitality means (the one dark, intimate moment of the chapter), then stepping
// back out to see where the journey leads. Text arrives a beat at a time, so each
// thought gets its own moment.
// Idle motion (the key swaying, flecks, shimmer) is CSS, on inner elements.
import { gsap } from "gsap";
import type { Scene } from "../../lib/motion";
import { holdStage, visible } from "../../lib/motion/stage";
import { checkIn as tokens, stage } from "../../lib/motion/tokens";

// Scroll-drawn paths declare pathLength="1000" (CheckInScene.astro).
const ROUTE_LENGTH = 1000;

export const checkInScene: Scene = ({ isDesktop }) => {
  const section = document.querySelector<HTMLElement>("[data-check-in]");
  const frame = section?.querySelector<HTMLElement>("[data-stage-frame]");
  if (!section || !frame) return;

  const one = <T extends Element = Element>(selector: string) =>
    visible<T>(frame, selector) ?? null;
  const all = (selector: string) => [...frame.querySelectorAll(selector)];

  const backdrop = one<HTMLElement>("[data-backdrop]");
  const keyhole = one("[data-keyhole]");
  const keyTurn = one("[data-key-turn]");
  const plane = one<SVGGElement>("[data-plane]");
  const trail = one("[data-trail]");
  const flecks = one("[data-flecks]");
  const route = one("[data-route]");
  // Desktop: the map is a group in the one drawing. Phones: a layer of its own that
  // takes the key's place.
  const map = isDesktop ? one("[data-map]") : one("[data-map-layer]");
  const keyLayer = isDesktop ? null : one("[data-key-layer]");
  const mapDrawing = isDesktop ? null : one("[data-map-layer] [data-map]");
  const markers = all("[data-marker]").filter(
    (marker) => marker.getClientRects().length > 0,
  );

  const title = one("[data-title]");
  const began = all('[data-beat="began"]');
  const lines = all("[data-line]");
  const promise = all('[data-beat="promise"]');
  const leg = all('[data-beat="leg"]');
  const tagsLabel = one("[data-tags-label]");
  const tags = all("[data-tag]");
  const tagsRail = one(".tags");

  const { at } = tokens;

  // The dark scene grows from the keyhole. Where that is, and how large the circle
  // must get to reach the farthest corner, depends on the screen.
  const door = () => {
    const box = frame.getBoundingClientRect();
    const hole = keyhole?.getBoundingClientRect() ?? box;
    const x = hole.left + hole.width / 2 - box.left;
    const y = hole.top + hole.height / 2 - box.top;
    const reach = Math.hypot(
      Math.max(x, box.width - x),
      Math.max(y, box.height - y),
    );
    // The circle is 100px wide (CheckIn.astro), so its radius is 50px.
    return { x, y, scale: (reach / 50) * 1.05 };
  };

  holdStage(
    frame,
    isDesktop ? tokens.screens.desktop : tokens.screens.phone,
    (timeline) => {
      // Text fades with opacity only (never visibility), so every line stays available
      // to screen readers the whole time, whatever is on stage.
      const beatIn = (target: gsap.TweenTarget, position: number) =>
        timeline.fromTo(
          target,
          { opacity: 0, y: stage.beatIn.y },
          {
            opacity: 1,
            y: 0,
            duration: stage.beatIn.duration,
            ease: stage.beatIn.ease,
          },
          position,
        );
      const beatOut = (target: gsap.TweenTarget, position: number) =>
        timeline.to(
          target,
          {
            opacity: 0,
            y: stage.beatOut.y,
            duration: stage.beatOut.duration,
            ease: stage.beatOut.ease,
          },
          position,
        );

      // 1. How it began. The key is already hanging there as the scene arrives.
      beatIn(title, at.title);
      beatIn(began[0], at.began1);
      beatOut(began[0], at.began2 - stage.beatOut.duration);
      beatIn(began[1], at.began2);

      // The plane to Toronto crosses while the second beat is up.
      if (plane && trail) {
        const dx = Number(plane.dataset.dx);
        const dy = Number(plane.dataset.dy);
        timeline
          .set([plane, trail], { autoAlpha: 1 }, at.plane)
          .fromTo(
            trail,
            { strokeDashoffset: ROUTE_LENGTH },
            {
              strokeDashoffset: 0,
              duration: tokens.plane.duration,
              ease: tokens.plane.ease,
            },
            at.plane,
          )
          .fromTo(
            plane,
            { x: 0, y: 0 },
            {
              x: dx,
              y: dy,
              duration: tokens.plane.duration,
              ease: tokens.plane.ease,
            },
            at.plane,
          )
          .to(
            [plane, trail],
            { autoAlpha: 0, duration: stage.beatOut.duration },
            at.turn - stage.beatOut.duration,
          );
      }

      beatOut(began[1], at.turn - stage.beatOut.duration);
      beatOut(title, at.turn - stage.beatOut.duration);

      // 2. The key turns and the door opens into the dark scene.
      timeline.to(
        keyTurn,
        {
          rotation: tokens.turn.rotation,
          // The ring's centre: the group's box is 88 × 256 with the ring at the top.
          transformOrigin: "50% 17.19%",
          duration: tokens.turn.duration,
          ease: tokens.turn.ease,
        },
        at.turn,
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
      }
      timeline.fromTo(
        flecks,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: tokens.door.duration },
        at.door + tokens.door.duration / 2,
      );

      // What good hospitality means: the lines gather one by one and stay.
      lines.forEach((line, index) =>
        beatIn(line, at.meaning + index * at.meaningStep),
      );
      beatOut(lines, at.promise - stage.beatOut.duration);
      beatIn(promise, at.promise);
      beatOut(promise, at.close - stage.beatOut.duration);

      // 3. The door closes back into the keyhole and the key turns home.
      timeline.to(
        flecks,
        { autoAlpha: 0, duration: stage.beatOut.duration },
        at.close,
      );
      if (backdrop) {
        timeline.to(
          backdrop,
          {
            scale: 0,
            duration: tokens.door.duration,
            ease: tokens.door.ease,
          },
          at.close,
        );
      }
      timeline.to(
        keyTurn,
        {
          rotation: 0,
          transformOrigin: "50% 17.19%",
          duration: tokens.turn.duration,
          ease: tokens.turn.ease,
        },
        at.close + tokens.door.duration / 2,
      );

      // The map unfolds (on phones it takes the key's place) and the route crosses it.
      if (mapDrawing) timeline.set(mapDrawing, { autoAlpha: 1 }, 0);
      if (keyLayer) {
        timeline.to(
          keyLayer,
          { autoAlpha: 0, duration: stage.beatOut.duration },
          at.map - stage.beatOut.duration,
        );
      }
      timeline.fromTo(
        map,
        {
          autoAlpha: 0,
          scale: tokens.map.fromScale,
          rotation: tokens.map.fromRotation,
          transformOrigin: "50% 50%",
        },
        {
          autoAlpha: 1,
          scale: 1,
          rotation: 0,
          duration: tokens.map.duration,
          ease: tokens.map.ease,
        },
        at.map,
      );
      timeline.fromTo(
        route,
        { strokeDashoffset: ROUTE_LENGTH },
        { strokeDashoffset: 0, duration: tokens.route.duration },
        at.route,
      );
      // A marker pops as the line reaches each town.
      markers.forEach((marker, index) =>
        timeline.fromTo(
          marker,
          { scale: 0, transformOrigin: "50% 50%" },
          { scale: 1, duration: 0.3, ease: "back.out(3)" },
          at.route + tokens.route.duration * (index === 0 ? 0.12 : 0.62),
        ),
      );

      beatIn(leg[0], at.leg1);
      beatOut(leg[0], at.leg2 - stage.beatOut.duration);
      beatIn(leg[1], at.leg2);

      // 4. The languages drop onto their rail and swing to rest.
      // Phones have room for one thing at a time: the last beat makes way for the tags.
      if (!isDesktop) beatOut(leg[1], at.tags - stage.beatOut.duration);
      beatIn([tagsLabel, tagsRail], at.tags);
      timeline.fromTo(
        tags,
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

      // A short rest at the end, so the last beat can be read before the scene lets go.
      timeline.set({}, {}, at.end);
    },
  );
};
