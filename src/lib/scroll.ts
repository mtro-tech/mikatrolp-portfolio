// Page helpers that run with motion on or off: none of them animates anything.
import { DESKTOP } from "./motion/tokens";

const root = document.documentElement;

// 1. The header shows the chapter the reader is in.
const stage = document.querySelector<HTMLElement>("[data-stage]");
const chapters = document.querySelectorAll<HTMLElement>("[data-stage-name]");

if (stage && chapters.length > 0) {
  // A chapter is "current" while it covers a line 40% down the screen.
  const current = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          stage.textContent =
            (entry.target as HTMLElement).dataset.stageName ?? "";
        }
      }
    },
    { rootMargin: "-40% 0px -60% 0px" },
  );
  for (const chapter of chapters) current.observe(chapter);
}

// 2. Scale facts for the drawings, as CSS variables.
//    --route-scale: how many screen pixels one drawing unit is (page width / viewBox width).
//    route.css divides stroke widths by it, so the line is equally thick at every width.
//    --stage-fit: a staged scene's drawing is as wide as the page; on a short screen it
//    would be cut off, so the frame gets the factor that makes its height fit.
const desktop = matchMedia(DESKTOP);
const VIEW = {
  desktop: { width: 1440, height: 810 },
  phone: { width: 390, height: 700 },
};

function measure() {
  const view = desktop.matches ? VIEW.desktop : VIEW.phone;
  const scale = root.clientWidth / view.width;
  root.style.setProperty("--route-scale", scale.toFixed(4));

  for (const frame of document.querySelectorAll<HTMLElement>(
    "[data-stage-frame]",
  )) {
    const held = root.dataset.motion === "on";
    const fit = held
      ? Math.min(1, frame.clientHeight / (view.height * scale))
      : 1;
    frame.style.setProperty("--stage-fit", fit.toFixed(4));
  }
}

measure();
addEventListener("resize", measure);
// The motion toggle changes whether stages are held, and so their height.
new MutationObserver(measure).observe(root, {
  attributes: true,
  attributeFilter: ["data-motion"],
});
