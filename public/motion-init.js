// Decides before first paint whether motion runs: the visitor's saved choice wins,
// otherwise the system setting. Loaded as a small blocking file from our own origin,
// because the CSP does not allow inline scripts that Astro has not hashed.
(() => {
  let saved = null;
  try {
    saved = localStorage.getItem("motion");
  } catch {
    // Storage can be blocked; fall back to the system setting.
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.dataset.motion =
    saved === "on" || saved === "off" ? saved : reduce ? "off" : "on";
})();
