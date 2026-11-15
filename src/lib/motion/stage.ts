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
 * Call inside a Scene (src/lib/motion), so gsap.matchMedia() reverts it for us, and
 * return the cleanup it gives back from the scene.
 *
 * The hold itself is set up at once, so the page has its final height from the start.
 * The timeline is filled only when the frame comes near (CLAUDE.md §5: lazy-init):
 * building every scene's tweens at page load made the browser re-measure the page
 * hundreds of times in one long task. Until then the scene's CSS keeps its pieces
 * off stage.
 *
 * `approach` fills a second timeline that plays while the frame scrolls into view,
 * from its top entering the bottom of the screen until it is held. A scene builds its
 * place there, so the route never arrives at an empty page between two chapters. Its
 * positions are units too; the whole way in is `stage.approach` units long.
 */
export function holdStage(
  frame: Element,
  screens: number,
  build: (timeline: gsap.core.Timeline) => void,
  approach?: (timeline: gsap.core.Timeline) => void,
): () => void {
  // The frame's section: the frame itself is taken out of the flow while it is held.
  const section = frame.closest("section") ?? frame;
  const entering =
    approach &&
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: () => `top ${headerHeight()}`,
        scrub: tokens.scrub,
        invalidateOnRefresh: true,
      },
    });
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
  // A plain observer, not a ScrollTrigger callback: those can run while ScrollTrigger is
  // re-measuring the page, which is no moment to create tweens.
  const near = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      near.disconnect();
      // The way in first: the held part may start from what it leaves behind.
      if (entering && approach) {
        approach(entering);
        entering.set({}, {}, tokens.approach);
        entering.progress(entering.scrollTrigger?.progress ?? 0);
      }
      build(timeline);
      // If the reader jumped straight into the scene, show the moment they are at.
      timeline.progress(timeline.scrollTrigger?.progress ?? 0);
    },
    { rootMargin: `${tokens.buildAhead * 100}% 0px` },
  );
  near.observe(section);
  return () => {
    near.disconnect();
    // A scene may have coloured the header (toneHeader); GSAP cannot revert that.
    delete document.querySelector("header")?.dataset.tone;
  };
}

/**
 * While a scene fills the frame with a colour, the header takes that colour too, so the
 * page reads as one surface (Header.astro styles data-tone). `from` and `to` are
 * timeline positions. The tone follows the timeline's position, not start and end
 * events, so it is right however the reader got here: jumping, or scrolling backwards.
 */
export function toneHeader(
  timeline: gsap.core.Timeline,
  tone: "ink" | "red",
  from: number,
  to: number,
) {
  const header = document.querySelector("header");
  if (!header) return;
  timeline.eventCallback("onUpdate", () => {
    const time = timeline.time();
    if (time >= from && time < to) header.dataset.tone = tone;
    else if (header.dataset.tone === tone) delete header.dataset.tone;
  });
}

/**
 * How text beats arrive and leave on a stage's timeline. Text fades with opacity only
 * (never visibility), so every line stays available to screen readers the whole time,
 * whatever is on stage.
 */
export function beatMoves(timeline: gsap.core.Timeline) {
  const beatIn = (target: gsap.TweenTarget, position: number) =>
    timeline.fromTo(
      target,
      { opacity: 0, y: tokens.beatIn.y },
      {
        opacity: 1,
        y: 0,
        duration: tokens.beatIn.duration,
        ease: tokens.beatIn.ease,
      },
      position,
    );
  const beatOut = (target: gsap.TweenTarget, position: number) =>
    timeline.to(
      target,
      {
        opacity: 0,
        y: tokens.beatOut.y,
        duration: tokens.beatOut.duration,
        ease: tokens.beatOut.ease,
      },
      position,
    );
  return { beatIn, beatOut };
}

/**
 * For a route drawn in two goes (first a stretch that belongs to an object, later the
 * rest): the dash offset, of 1000, at which the first stretch is done. The path gives
 * that stretch's length as data-edge-length; 0 means the whole path is the first stretch.
 * Measured when asked, because an exit path bends with the window (src/lib/scroll.ts).
 */
export function undrawnAfter(route: SVGPathElement | null) {
  const length = Number(route?.dataset.edgeLength ?? 0);
  const total = route?.getTotalLength() ?? 0;
  return length && total ? 1000 * (1 - length / total) : 0;
}

/** The drawing shown at the current screen size (each scene has a desktop and a phone one). */
export function visible<T extends Element>(root: ParentNode, selector: string) {
  return [...root.querySelectorAll<T>(selector)].find(
    (element) => element.getClientRects().length > 0,
  );
}
