// Scroll-position helpers. They run with motion on or off: neither moves anything.

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

// 2. [data-enter] elements are marked data-inview the first time they are a fifth of
//    the way up the screen. CSS uses the mark to play a short on-enter animation.
const entered = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute("data-inview", "");
      entered.unobserve(entry.target);
    }
  },
  { rootMargin: "0px 0px -20% 0px" },
);
for (const element of document.querySelectorAll("[data-enter]")) {
  entered.observe(element);
}
