// Motion tokens for the GSAP scenes. CSS motion tokens live in src/styles/tokens.css.

/** The breakpoint where scenes switch from the phone layout to the desktop layout. */
export const DESKTOP = "(width >= 60rem)";

/** Shared by every held scene. */
export const stage = {
  /** Seconds the scene trails the scrollbar, so motion glides instead of ticking. */
  scrub: 0.6,
  /** How a text beat arrives and leaves: it rises into place, then lifts away. */
  beatIn: { duration: 0.5, ease: "power2.out", y: 28 },
  beatOut: { duration: 0.35, ease: "power1.in", y: -20 },
} as const;

/** Peak 1: the scroll into the map at the end of the Arrival hero. */
export const arrival = {
  /** How long the hero is held, in screens. */
  screens: 1,
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

/** Check-in: key, door, map, languages. Positions are units on the scene's timeline. */
export const checkIn = {
  /** Screens of scrolling the scene is held for. */
  screens: { desktop: 4, phone: 3.5 },
  /** When each moment starts. The gaps are how long a beat stays readable. */
  at: {
    title: 0,
    began1: 0.3,
    began2: 1.5,
    plane: 1.5,
    turn: 2.9,
    door: 3.2,
    meaning: 4.0,
    meaningStep: 0.55,
    promise: 7.2,
    close: 8.4,
    map: 8.9,
    route: 9.3,
    leg1: 9.4,
    leg2: 10.6,
    tags: 11.6,
    end: 13,
  },
  /** The key turns a quarter, like a key in a lock, with a little overshoot. */
  turn: { rotation: 90, duration: 0.6, ease: "back.out(1.6)" },
  /** The dark scene opens from the keyhole and closes back into it. */
  door: { duration: 0.9, ease: "power2.inOut" },
  plane: { duration: 1.6, ease: "power1.inOut" },
  map: { duration: 0.8, ease: "power2.out", fromRotation: -8, fromScale: 0.86 },
  route: { duration: 1.9 },
  /** Tags drop onto the rail one after another and swing to rest. */
  tags: {
    duration: 0.7,
    stagger: 0.22,
    ease: "back.out(2.2)",
    fromY: -70,
    fromRotation: 14,
  },
} as const;
