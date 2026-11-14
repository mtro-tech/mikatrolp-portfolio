// Decides before first paint whether motion runs: the visitor's saved choice wins,
// otherwise the system setting. Loaded as a small blocking file from our own origin,
// because the CSP does not allow inline scripts that Astro has not hashed.
(() => {
  const root = document.documentElement;
  let saved = null;
  try {
    saved = localStorage.getItem("motion");
  } catch {
    // Storage can be blocked; fall back to the system setting.
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.dataset.motion =
    saved === "on" || saved === "off" ? saved : reduce ? "off" : "on";

  // Staged scenes hide their text until the animation script shows it beat by beat.
  // If that script never arrives (blocked, offline), fall back to the plain page so
  // no content stays hidden. src/lib/motion sets data-motion-ready when it has started.
  setTimeout(() => {
    if (root.dataset.motion === "on" && !("motionReady" in root.dataset)) {
      root.dataset.motion = "off";
    }
  }, 5000);
})();
