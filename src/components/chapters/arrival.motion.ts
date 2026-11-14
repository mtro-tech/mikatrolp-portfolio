// Peak 1, scroll part: the view moves into the map.
// The reader should feel they are leaving the overview and setting off: the scene
// closes in on the pin, the name lifts away, and the route starts running down.
// (The load sequence before it is CSS, in ArrivalScene.astro and Arrival.astro.)
import { gsap } from "gsap";
import type { Scene } from "../../lib/motion";
import { arrival as tokens } from "../../lib/motion/tokens";

// The pin's position in the desktop drawing (ArrivalScene.astro, viewBox 1440 × 900,
// centred horizontally and anchored to the bottom).
// The scroll-drawn route path declares pathLength="1000" (ArrivalScene.astro).
const ROUTE_LENGTH = 1000;

const VIEW = { width: 1440, height: 900, pinX: 1040, pinY: 700 };

export const arrivalScene: Scene = ({ isDesktop }) => {
  const stage = document.querySelector<HTMLElement>("[data-arrival]");
  if (!stage) return;

  const scene = stage.querySelector("[data-arrival-scene]");
  const copy = stage.querySelector("[data-arrival-copy]");
  // Two drawings exist; only the one for this screen size is rendered.
  const route = [...stage.querySelectorAll("[data-route-start]")].find(
    (path) => path.getClientRects().length > 0,
  );
  if (!scene || !copy || !route) return;

  const headerHeight = () =>
    document.querySelector("header")?.offsetHeight ?? 0;
  const start = () => `top ${headerHeight()}`;

  if (!isDesktop) {
    // Phones: nothing is pinned. The rail simply draws as the hero scrolls away.
    gsap.fromTo(
      route,
      { strokeDashoffset: ROUTE_LENGTH },
      {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start,
          end: "bottom center",
          scrub: true,
        },
      },
    );
    return;
  }

  const pinOrigin = () => {
    const unit = Math.max(
      stage.clientWidth / VIEW.width,
      stage.clientHeight / VIEW.height,
    );
    const x = stage.clientWidth / 2 + (VIEW.pinX - VIEW.width / 2) * unit;
    const y = stage.clientHeight - (VIEW.height - VIEW.pinY) * unit;
    return `${x}px ${y}px`;
  };

  gsap
    .timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: stage,
        start,
        end: tokens.pinLength,
        pin: true,
        scrub: tokens.scrub,
        invalidateOnRefresh: true,
      },
    })
    .to(
      scene,
      {
        scale: tokens.zoom,
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
};
