// Staged chapters (CLAUDE.md §4): a chapter's frame is held on screen while the reader
// scrolls through its timeline. Every chapter scene uses holdStage, so they all feel
// like one continuous stage.
import { gsap } from "gsap";
import { stage as tokens } from "./tokens";

export const headerHeight = () =>
  document.querySelector("header")?.offsetHeight ?? 0;

/**
 * Hold `frame` below the header for `screens` screen-heights of scrolling and scrub a
 * timeline over that distance. `build` fills the timeline; its positions are free units.
 * Call inside a Scene (src/lib/motion), so gsap.matchMedia() reverts it for us.
 */
export function holdStage(
  frame: Element,
  screens: number,
  build: (timeline: gsap.core.Timeline) => void,
): gsap.core.Timeline {
  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: frame,
      start: () => `top ${headerHeight()}`,
      end: () => `+=${window.innerHeight * screens}`,
      pin: true,
      scrub: tokens.scrub,
      invalidateOnRefresh: true,
    },
  });
  build(timeline);
  return timeline;
}

/** The drawing shown at the current screen size (each scene has a desktop and a phone one). */
export function visible<T extends Element>(root: ParentNode, selector: string) {
  return [...root.querySelectorAll<T>(selector)].find(
    (element) => element.getClientRects().length > 0,
  );
}
