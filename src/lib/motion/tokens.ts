// Motion tokens for the GSAP scenes. CSS motion tokens live in src/styles/tokens.css.

/** The breakpoint where scenes switch from the phone layout to the desktop layout. */
export const DESKTOP = "(width >= 60rem)";

/** Shared by every held scene. */
export const stage = {
  /** Seconds the scene trails the scrollbar, so motion glides instead of ticking. */
  scrub: 0.6,
  /** A scene's timeline is built once its frame is within this many screen heights. */
  buildAhead: 1,
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

/** Foundations: the ruler, 60 pegs, one goes first, carried on. A short stop. */
export const foundations = {
  /** Screens of scrolling the scene is held for, on every screen size. */
  screens: 2.5,
  /** When each moment starts, in units on the scene's timeline. */
  at: {
    title: 0,
    ruler: 0.1,
    rank: 0.3,
    count: 1.2,
    lesson: 3.1,
    follow: 3.6,
    arcs: 5.0,
    carry: 6.4,
    ride: 6.9,
    end: 8.6,
  },
  ruler: { fromX: -80, duration: 0.6, ease: "power2.out" },
  /** The pegs pop up on the ticks one by one while the numeral counts with them. */
  count: { duration: 1.2, pop: 0.15, popEase: "back.out(3)", dot: 0.42 },
  ground: { duration: 0.6, ease: "power2.out", fromScale: 0.9 },
  /** The leader steps out first; the others follow one after another. */
  step: { duration: 0.6, ease: "back.out(1.4)" },
  follow: { span: 1.2, duration: 0.5, ease: "power2.inOut" },
  /** One arc each way, the second a moment after the first. */
  arcs: { duration: 0.6, gap: 0.5, head: 0.2 },
  /** Back onto the route, then down it and out of the frame. */
  exit: { duration: 0.5, ease: "power2.inOut" },
  ride: { duration: 1.3, ease: "power1.in" },
} as const;

/** Behind the bar: the counter, the pour, three glasses, the tools. */
export const bar = {
  /** Screens of scrolling the scene is held for. */
  screens: { desktop: 3.5, phone: 3 },
  /** When each moment starts, in units on the scene's timeline. */
  at: {
    title: 0,
    counter: 0.1,
    lamp: 0.3,
    glasses: 0.6,
    joined: 0.4,
    joinedStep: 1.1,
    pour: 3.7,
    fill: 3.9,
    flood: 4.4,
    today: 5.1,
    drain: 6.5,
    growth: 7.3,
    growthStep: 0.8,
    shelf: 9.9,
    tools: 10.1,
    toolStep: 0.4,
    route: 10.5,
    end: 12,
  },
  counter: { fromY: 40, duration: 0.6, ease: "power2.out" },
  /** The route running across as the counter's top edge. */
  edge: { duration: 0.8 },
  lamp: { fromY: -260, duration: 0.8, ease: "bounce.out" },
  glasses: { fromX: 90, duration: 0.5, stagger: 0.2, ease: "back.out(1.6)" },
  bottle: { fromY: -50, duration: 0.4, ease: "power2.out" },
  pour: { duration: 0.3 },
  fill: { duration: 0.6, ease: "power1.inOut" },
  /** Red rises to cover the frame, and later drains away at the same pace. */
  flood: { duration: 0.9, ease: "power2.inOut" },
  garnish: { fromY: -40, duration: 0.4, ease: "back.out(2.5)" },
  shelf: { fromX: 60, duration: 0.5, ease: "power2.out" },
  tool: { fromY: -36, duration: 0.45, ease: "back.out(2)" },
  route: { duration: 1.2 },
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
  /** The pin drops onto Lucerne and bounces to rest. */
  pin: { fromY: -90, duration: 0.55, ease: "bounce.out" },
  /** Tags drop onto the rail one after another and swing to rest. */
  tags: {
    duration: 0.7,
    stagger: 0.22,
    ease: "back.out(2.2)",
    fromY: -70,
    fromRotation: 14,
  },
} as const;
