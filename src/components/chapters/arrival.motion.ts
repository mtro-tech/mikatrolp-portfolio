// Peak 1, scroll part: the view moves into the map.
// The reader should feel they are leaving the overview and setting off: the scene
// closes in on the pin, the name lifts away, and the route starts running down.
// (The load sequence before it is CSS, in ArrivalScene.astro and Arrival.astro.)
import { gsap } from "gsap";
import type { Scene } from "../../lib/motion";
import { headerHeight, holdStage, visible } from "../../lib/motion/stage";
import { arrival as tokens } from "../../lib/motion/tokens";

// The scroll-drawn route path declares pathLength="1000" (ArrivalScene.astro).
const ROUTE_LENGTH = 1000;

// The pin's position in the desktop drawing (ArrivalScene.astro, viewBox 1440 × 900,
// scaled to the stage's width and anchored to its bottom).
const VIEW = { width: 1440, height: 900, pinX: 1040, pinY: 700 };

export const arrivalScene: Scene = ({ isDesktop }) => {
  const stage = document.querySelector<HTMLElement>("[data-arrival]");
  if (!stage) return;

  const scene = stage.querySelector("[data-arrival-scene]");
  const copy = stage.querySelector("[data-arrival-copy]");
  const route = visible(stage, "[data-route-start]");
  if (!scene || !copy || !route) return;

  if (!isDesktop) {
    // Phones: the hero is not held. The rail simply draws as the hero scrolls away.
    gsap.fromTo(
      route,
      { strokeDashoffset: ROUTE_LENGTH },
      {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: () => `top ${headerHeight()}`,
          end: "bottom center",
          scrub: true,
        },
      },
    );
    return;
  }

  const pinOrigin = () => {
    const unit = stage.clientWidth / VIEW.width;
    const x = VIEW.pinX * unit;
    const y = stage.clientHeight - (VIEW.height - VIEW.pinY) * unit;
    return `${x}px ${y}px`;
  };

  holdStage(stage, tokens.screens, (timeline) => {
    timeline
      .to(
        scene,
        {
          scale: tokens.zoom,
          // route.css divides stroke widths by --zoom, so the line keeps its thickness
          // on screen while the drawing grows.
          "--zoom": tokens.zoom,
          transformOrigin: pinOrigin,
          ease: tokens.zoomEase,
          duration: 1,
        },
        0,
      )
      .to(
        copy,
        {
          yPercent: tokens.copyLift,
          autoAlpha: 0,
          ease: tokens.copyEase,
          duration: tokens.copyDuration,
        },
        0,
      )
      .fromTo(
        route,
        { strokeDashoffset: ROUTE_LENGTH },
        { strokeDashoffset: 0, duration: tokens.routeDuration },
        tokens.routeStart,
      );
  });
};
