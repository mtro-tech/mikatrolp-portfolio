// Motion tokens for the GSAP peaks. CSS motion tokens live in src/styles/tokens.css.

/** The breakpoint where scenes switch from the phone layout to the desktop layout. */
export const DESKTOP = "(width >= 60rem)";

/** Peak 1: the scroll into the map at the end of the Arrival hero. */
export const arrival = {
  /** How long the hero stays pinned, as scroll distance: one screen. */
  pinLength: "+=100%",
  /** Seconds the scene trails the scrollbar, so the zoom glides instead of ticking. */
  scrub: 0.6,
  /** How far the view moves into the map, as a scale around the pin. */
  zoom: 1.75,
  zoomEase: "power2.inOut",
  /** The copy leaves upwards (percent of its own height) during the first half. */
  copyLift: -70,
  copyEase: "power1.in",
  copyDuration: 0.5,
  /** The route starts running down once the zoom is under way. */
  routeStart: 0.25,
  routeDuration: 0.75,
} as const;
