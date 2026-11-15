// The page's motion entry point: every chapter's scene is listed here, so GSAP and
// Lenis are started exactly once.
import { academyScene } from "../../components/chapters/academy.motion";
import { arrivalScene } from "../../components/chapters/arrival.motion";
import { barScene } from "../../components/chapters/behind-the-bar.motion";
import { checkInScene } from "../../components/chapters/check-in.motion";
import { foundationsScene } from "../../components/chapters/foundations.motion";
import { runMotion } from "./index";

runMotion([
  arrivalScene,
  checkInScene,
  foundationsScene,
  barScene,
  academyScene,
]);
