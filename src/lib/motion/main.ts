// The page's motion entry point: every chapter's scene is listed here, so GSAP and
// Lenis are started exactly once.
import { arrivalScene } from "../../components/chapters/arrival.motion";
import { runMotion } from "./index";

runMotion([arrivalScene]);
