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

/**
 * Foundations: the ruler, 60 pegs, one goes first, carried on. Objects first, then the
 * line, then a rest (CLAUDE.md §4).
 */
export const foundations = {
  /** Screens of scrolling the scene is held for, on every screen size. */
  screens: 4,
  /** When each thing starts, in units on the scene's timeline. */
  at: {
    title: 0,
    ruler: 0.1,
    rank1: 0.9,
    count: 2.6,
    rank2: 4.2,
    lesson: 5.9,
    lesson1: 6.6,
    follow: 8.1,
    lesson2: 9.9,
    arcs: 11.4,
    lesson3: 12.8,
    exit: 14.5,
    carry1: 15.1,
    ride: 16.7,
    carry2: 18.1,
    end: 20,
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

/**
 * The academy: Lucerne's waterfront, the school, where I am now, the modules. Objects
 * first, then the line, then a rest (CLAUDE.md §4). One unit is about a quarter of a
 * screen of scrolling.
 */
export const academy = {
  /** Screens of scrolling the scene is held for. */
  screens: { desktop: 4.25, phone: 3.75 },
  /** When each thing starts, in units on the scene's timeline. */
  at: {
    town: 0,
    water: 0.3,
    tower: 0.9,
    bridge: 1.4,
    programme: 3.6,
    flowers: 5.3,
    school: 6.5,
    pin: 8.2,
    now: 8.9,
    books: 10.6,
    bookStep: 1.5,
    route: 15.4,
    end: 17.4,
  },
  ridge: { fromY: 40, duration: 0.6, ease: "power2.out" },
  water: { fromY: 50, duration: 0.7, ease: "power2.out" },
  tower: { fromY: 60, duration: 0.6, ease: "back.out(1.4)" },
  /** The bridge's sections arrive one after another, from the bank the route is on. */
  spans: { fromY: -30, duration: 0.4, stagger: 0.25, ease: "power2.out" },
  flowers: { duration: 0.3, stagger: 0.12, ease: "back.out(3)" },
  pin: { fromY: -90, duration: 0.55, ease: "bounce.out" },
  book: { fromY: -60, duration: 0.5, ease: "bounce.out" },
  /** A book opens shortly after it has landed; the first one waits for the label. */
  open: { afterLabel: 0.3, afterLanding: 0.15, duration: 0.5 },
  route: { duration: 1.2 },
} as const;

/**
 * Behind the bar: the room, the house, the pour, responsibility and growth, learning
 * the new. In every moment the objects move first, then the line arrives, then it
 * rests (CLAUDE.md §4). One unit is about a quarter of a screen of scrolling.
 */
export const bar = {
  /** Screens of scrolling the scene is held for. */
  screens: { desktop: 7.9, phone: 7.4 },
  /** When each thing starts, in units on the scene's timeline. */
  at: {
    room: 0,
    wall: 0.3,
    globes: 0.7,
    counter: 1.2,
    edge: 1.5,
    joined1: 2.3,
    stools: 4.1,
    glasses: 4.5,
    joined2: 5.7,
    bottle: 7.7,
    pour: 8.1,
    fill: 8.3,
    flood: 8.9,
    // On the red: the shaker is filled, closed and shaken, then the line.
    shaker: 9.9,
    jigger: 10.6,
    measure: 11.0,
    shakerIce: 11.8,
    cap: 12.6,
    shake: 13.2,
    rest: 15.5,
    today: 15.9,
    drain: 17.5,
    // The shaker moves over the last glass and pours it.
    serve: 18.4,
    tilt: 19.0,
    stream: 19.2,
    leave: 20.0,
    tray: 20.6,
    responsibility: 21.3,
    ice: 23.1,
    peel: 23.5,
    growth: 24.0,
    learning1: 25.9,
    tools: 27.6,
    learning2: 29.1,
    route: 29.5,
    end: 32.1,
  },
  ceiling: { fromY: -60, duration: 0.7, ease: "power2.out" },
  wall: { fromY: 30, duration: 0.6, ease: "power2.out" },
  globes: { fromY: -220, duration: 0.6, stagger: 0.25, ease: "back.out(1.4)" },
  counter: { fromY: 40, duration: 0.6, ease: "power2.out" },
  /** The route running across as the counter's top edge. */
  edge: { duration: 0.7 },
  stools: { fromY: 60, duration: 0.5, stagger: 0.2, ease: "power2.out" },
  glasses: { fromX: 90, duration: 0.5, stagger: 0.3, ease: "back.out(1.6)" },
  bottle: { fromY: -50, duration: 0.4, ease: "power2.out" },
  pour: { duration: 0.3 },
  fill: { duration: 0.6, ease: "power1.inOut" },
  /** Red rises to cover the frame, and later drains away at the same pace. */
  flood: { duration: 0.9, ease: "power2.inOut", reachesHeader: 0.9 },
  /** The shaker drops onto the red and stands. */
  shaker: { fromY: -80, duration: 0.5, ease: "back.out(1.4)" },
  /** The jigger comes in, tips over the tin, pours its measure and leaves. */
  jigger: {
    fromX: -70,
    fromY: -50,
    duration: 0.4,
    tip: 130,
    ease: "power2.out",
  },
  measure: { duration: 0.4 },
  shakerIce: { fromY: -170, duration: 0.35, stagger: 0.25, ease: "power2.in" },
  cap: { fromY: -90, duration: 0.4, ease: "back.out(1.2)" },
  /** The scrolling shakes it: leaning over, then swings along its length. */
  shake: { lean: 28, travel: 22, swings: 10, duration: 1.9, settle: 0.2 },
  /** Over the last glass: smaller, cap off, tipped until it pours. */
  serve: {
    scale: 0.6,
    duration: 0.6,
    tip: 118,
    tipDuration: 0.25,
    ease: "power2.inOut",
  },
  stream: { duration: 0.25, fill: 0.6 },
  tray: { fromX: -90, duration: 0.6, ease: "back.out(1.4)" },
  garnish: { fromY: -40, duration: 0.4, ease: "back.out(2.5)" },
  /** The tools land in their niches one after another. */
  tools: { fromY: -30, duration: 0.45, stagger: 0.45, ease: "back.out(2)" },
  route: { duration: 1.2 },
} as const;

/**
 * Check-in: key, door, map, languages. Positions are units on the scene's timeline;
 * one unit is about a quarter of a screen of scrolling. Objects first, then the line,
 * then a rest (CLAUDE.md §4).
 */
export const checkIn = {
  /** Screens of scrolling the scene is held for. */
  screens: { desktop: 6, phone: 5.5 },
  /** When each thing starts. The gaps after a line are how long it rests. */
  at: {
    title: 0,
    began1: 0.4,
    plane: 2.2,
    began2: 3.9,
    turn: 5.6,
    door: 5.9,
    meaning: 7.0,
    meaningStep: 0.9,
    promise: 12.0,
    close: 13.6,
    map: 14.7,
    route: 15.6,
    leg1: 17.6,
    leg2: 19.3,
    tags: 21.1,
    end: 24,
  },
  /** The key turns a quarter, like a key in a lock, with a little overshoot. */
  turn: { rotation: 90, duration: 0.6, ease: "back.out(1.6)" },
  /** The dark scene opens from the keyhole and closes back into it. */
  door: { duration: 0.9, ease: "power2.inOut", reachesHeader: 0.6 },
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
