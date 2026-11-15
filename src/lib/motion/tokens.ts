// Motion tokens for the GSAP scenes. CSS motion tokens live in src/styles/tokens.css.

/** The breakpoint where scenes switch from the phone layout to the desktop layout. */
export const DESKTOP = "(width >= 60rem)";

/** Shared by every held scene. */
export const stage = {
  /** Seconds the scene trails the scrollbar, so motion glides instead of ticking. */
  scrub: 0.6,
  /** A scene's timeline is built once its frame is within this many screen heights. */
  buildAhead: 1,
  /** Units on a scene's way-in timeline: the screen of scrolling before it is held. */
  approach: 4,
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
  /** On the way in (of stage.approach units): the ruler slides in beside the route. */
  approach: { ruler: 1.8 },
  ruler: { fromX: -80, duration: 0.9, ease: "power2.out" },
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
  screens: { desktop: 3.9, phone: 3.5 },
  /** On the way in (of stage.approach units): the town builds, from the top down. */
  approach: { town: 0.4, water: 0.8, tower: 1.3, bridge: 1.7 },
  /** When each thing starts, in units on the held scene's timeline. */
  at: {
    title: 0,
    programme: 0.3,
    flowers: 2.0,
    school: 3.2,
    pin: 4.9,
    now: 5.6,
    books: 7.3,
    // The three books are dropped first, then opened one by one.
    drop: 7.6,
    dropStep: 0.5,
    open: 9.3,
    openStep: 1.3,
    route: 13.4,
    end: 15.4,
  },
  ridge: { fromY: 40, duration: 0.6, ease: "power2.out" },
  water: { fromY: 50, duration: 0.7, ease: "power2.out" },
  tower: { fromY: 60, duration: 0.6, ease: "back.out(1.4)" },
  /** The bridge's sections arrive one after another, from the bank the route is on. */
  spans: { fromY: -30, duration: 0.4, stagger: 0.25, ease: "power2.out" },
  flowers: { duration: 0.3, stagger: 0.12, ease: "back.out(3)" },
  pin: { fromY: -90, duration: 0.55, ease: "bounce.out" },
  /** A closed book is one page wide and lies in the middle of its open width. */
  book: { fromY: -90, duration: 0.5, ease: "bounce.out", closedShift: -25 },
  open: { duration: 0.7 },
  route: { duration: 1.2 },
} as const;

/**
 * Behind the bar: the room, the house, the pour, responsibility and growth, learning
 * the new. In every moment the objects move first, then the line arrives, then it
 * rests (CLAUDE.md §4). One unit is about a quarter of a screen of scrolling.
 */
export const bar = {
  /** Screens of scrolling the scene is held for. */
  screens: { desktop: 9, phone: 8.5 },
  /** On the way in (of stage.approach units): the room builds, from the top down. */
  approach: { room: 0.5, wall: 1.0, globes: 1.4, counter: 2.2, edge: 2.7 },
  /** When each thing starts, in units on the held scene's timeline. */
  at: {
    title: 0,
    joined1: 0.2,
    stools: 2.0,
    glasses: 2.4,
    joined2: 3.6,
    bottle: 5.6,
    pour: 6.1,
    fill: 6.3,
    flood: 6.9,
    pourEnd: 7.2,
    // On the red, one step at a time: the shaker, the jigger and its measure, the
    // scoop and its ice, the second tin, the shake, a rest, then the line.
    shaker: 8.0,
    jigger: 8.9,
    jiggerTip: 9.4,
    measure: 9.9,
    measureEnd: 10.5,
    jiggerLeave: 11.0,
    scoop: 11.6,
    scoopTip: 12.2,
    cubes: 12.5,
    scoopLeave: 14.3,
    cap: 15.0,
    shake: 15.7,
    rest: 19.7,
    today: 20.2,
    drain: 21.9,
    // The shaker tips over the last glass and pours it.
    serve: 22.8,
    stream: 23.7,
    streamEnd: 24.8,
    leave: 25.4,
    tray: 25.9,
    responsibility: 26.6,
    ice: 28.4,
    peel: 28.8,
    growth: 29.3,
    learning1: 31.2,
    tools: 32.9,
    learning2: 34.4,
    route: 34.8,
    end: 37.4,
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
  /** Every stream grows from the lip, and later runs out, over this long. */
  stream: { duration: 0.3, pause: 0.2 },
  fill: { duration: 0.6, ease: "power1.inOut" },
  /** Red rises to cover the frame, and later drains away at the same pace. */
  flood: { duration: 0.9, ease: "power2.inOut", reachesHeader: 0.9 },
  /** The shaker drops onto the red and stands. */
  shaker: { fromY: -80, duration: 0.5, ease: "back.out(1.4)" },
  /** The jigger comes in upright above the tin (hover), then turns over its rim. */
  jigger: {
    fromX: -70,
    fromY: -150,
    hover: -90,
    duration: 0.45,
    tip: 125,
    ease: "power2.out",
  },
  /** The scoop comes in from the side with its cubes, and tips over the rim. */
  scoop: { fromX: -120, duration: 0.5, tip: 28, ease: "power2.out" },
  /** The cubes tumble in one after another. */
  cube: { duration: 0.5, stagger: 0.32, turn: 120 },
  cap: { fromY: -90, duration: 0.4, ease: "back.out(1.2)" },
  /** The scrolling shakes it: leaning over, then swings along its length. */
  shake: { lean: 28, travel: 22, swings: 16, duration: 3.5, settle: 0.2 },
  /** Over the last glass: smaller, tipped so the drink leaves from the rim's corner. */
  serve: {
    scale: 0.6,
    duration: 0.8,
    tip: 118,
    fill: 0.7,
    leave: 0.5,
    ease: "power2.inOut",
  },
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
