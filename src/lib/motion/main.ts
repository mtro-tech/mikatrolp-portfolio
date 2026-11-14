// The page's motion entry point: every chapter's scene is listed here, so GSAP and
// Lenis are started exactly once.
import { arrivalScene } from "../../components/chapters/arrival.motion";
import { checkInScene } from "../../components/chapters/check-in.motion";
import { runMotion } from "./index";

runMotion([arrivalScene, checkInScene]);
