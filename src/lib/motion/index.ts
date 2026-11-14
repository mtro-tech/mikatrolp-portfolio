// The one place where GSAP and Lenis are set up (CLAUDE.md §5).
// Motion runs only while <html data-motion="on">. That attribute is set before first
// paint in Base.astro from the saved choice or, without one, the system setting.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { DESKTOP } from "./tokens";

gsap.registerPlugin(ScrollTrigger);

/** A chapter's scroll scene. Runs inside gsap.matchMedia(), so it is reverted for us. */
export type Scene = (context: { isDesktop: boolean }) => void;

const STORAGE_KEY = "motion";
const root = document.documentElement;
const media = gsap.matchMedia();
let lenis: Lenis | undefined;

const tick = (time: number) => lenis?.raf(time * 1000);

function start(scenes: Scene[]) {
  lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  media.add(
    { isDesktop: DESKTOP, isPhone: `not all and ${DESKTOP}` },
    (context) => {
      const isDesktop = Boolean(context.conditions?.isDesktop);
      for (const scene of scenes) scene({ isDesktop });
    },
  );
}

function stop() {
  media.revert();
  gsap.ticker.remove(tick);
  lenis?.destroy();
  lenis = undefined;
}

/** Start the page's scenes and connect the motion toggle. Call once per page. */
export function runMotion(scenes: Scene[]) {
  if (root.dataset.motion === "on") start(scenes);

  for (const button of document.querySelectorAll("[data-motion-toggle]")) {
    button.addEventListener("click", () => {
      const next = root.dataset.motion === "on" ? "off" : "on";
      root.dataset.motion = next;
      try {
        // The only thing this site stores in the browser (CLAUDE.md §7).
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage can be blocked; the choice then lasts for this page view only.
      }
      if (next === "on") start(scenes);
      else stop();
    });
  }
}
