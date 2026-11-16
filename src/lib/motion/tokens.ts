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
  screens: { desktop: 3.7, phone: 3.3 },
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
    // One book: it drops, it opens, then the names are written in one by one.
    drop: 7.6,
    open: 8.4,
    names: 9.4,
    nameStep: 1.1,
    route: 12.9,
    end: 14.8,
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
  scoop: { fromX: -120, duration: 0.5, ease: "power2.out" },
  /** The cubes tumble in one after another. */
  cube: { duration: 0.5, stagger: 0.32, turn: 120 },
  cap: { fromY: -90, duration: 0.4, ease: "back.out(1.2)" },
  /** The scrolling shakes it: leaning over, then swings along its length. */
  shake: { lean: 28, travel: 22, swings: 16, duration: 3.5, settle: 0.2 },
  /** Over the last glass: smaller, tipped so the drink leaves from the rim's corner. */
  serve: {
    scale: 0.45,
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
 * Concierge of the future: the bell, the circuit, the key, the desk, the website.
 * Objects first, then the line, then a rest (CLAUDE.md §4). One unit is about a
 * quarter of a screen of scrolling.
 */
export const concierge = {
  /** Screens of scrolling the scene is held for. */
  screens: { desktop: 8, phone: 7.5 },
  /** On the way in (of stage.approach units): the desk, then the bell on it. */
  approach: { desk: 0.6, bell: 1.8 },
  /** When each thing starts, in units on the held scene's timeline. */
  at: {
    ring: 0,
    title: 0.6,
    ask: 0.9,
    lift: 3.4,
    door: 3.7,
    trunk: 4.4,
    circuit: 5.2,
    how: 8.8,
    key: 11.0,
    around: 11.8,
    people: 14.0,
    close: 16.6,
    office: 18.0,
    wiring: 18.6,
    behind1: 20.4,
    behind2: 22.6,
    project: 24.8,
    first: 25.6,
    frames: 26.6,
    more: 27.8,
    route: 29.4,
    end: 32,
  },
  desk: { fromY: 50, duration: 0.8, ease: "power2.out" },
  /** The bell lands on the desk and bounces to rest. */
  bell: { fromY: -80, duration: 0.55, ease: "bounce.out" },
  /** A ring: the dome dips under the route's touch and springs back. */
  ring: { dip: 5, down: 0.12, up: 0.35, ease: "back.out(3)", fade: 0.5 },
  /** The dome lifts off its base before the dark opens out of the bell. */
  lift: { y: -22, duration: 0.5, ease: "power2.out" },
  /** The dark scene opens from the bell and closes back into it. */
  door: { duration: 0.9, ease: "power2.inOut", reachesHeader: 0.85 },
  trunk: { duration: 0.8 },
  /** One trace of the circuit, the pause before the next, and its node lighting up. */
  trace: { duration: 0.8, stagger: 0.55, node: 0.2 },
  key: { fromY: -40, duration: 0.6, ease: "power2.out" },
  /** The things behind the desk appear one after another. */
  /** Then the traces reach them, quicker than in the dark: three short runs. */
  office: { fromY: 16, duration: 0.4, ease: "power2.out", stagger: 0.2 },
  wiring: { duration: 0.8, stagger: 0.3 },
  browser: { fromY: 24, duration: 0.5, ease: "power2.out", stagger: 0.3 },
  route: { duration: 1.2 },
} as const;

/**
 * Next destination: the flight to Hong Kong. Objects first, then the line, then a rest
 * (CLAUDE.md §4); during the flight the map keeps drifting under a line that rests.
 * One unit is about a quarter of a screen of scrolling.
 */
export const flight = {
  /** Screens of scrolling the scene is held for. */
  screens: { desktop: 7, phone: 6.5 },
  /** On the way in (of stage.approach units): the map, the pin, the waiting plane. */
  approach: { map: 0.6, pin: 1.6, plane: 2.3 },
  /** When each thing starts, in units on the held scene's timeline. */
  at: {
    title: 0,
    next: 0.3,
    takeOff: 2.6,
    dusk: 6.4,
    benchmark: 7.6,
    dawn: 12.4,
    harbour: 12.8,
    towers: 13.2,
    landed: 15.6,
    noBetter: 16.0,
    pin: 17.8,
    windows: 19.8,
    learn1: 21.2,
    learn2: 23.4,
    route: 25.4,
    end: 28,
  },
  map: { fromY: 40, duration: 0.7, ease: "power2.out" },
  /** A pin drops and bounces to rest (the Lucerne one on the way in, then Hong Kong's). */
  pin: { fromY: -90, duration: 0.55, ease: "bounce.out" },
  /** The sky closes in to night, and opens again, over this long. */
  /** In the dark the grid, the land and the clouds are dimmed to these opacities. */
  night: {
    duration: 0.9,
    reachesHeader: 0.6,
    grid: 0.18,
    land: 0.4,
    clouds: 0.5,
  },
  /** The whole flight is one even movement: slow off the pin, slow onto the quay. */
  /** Over the last share of the way (levelOut) the plane turns level for landing. */
  /** It waits a little way off the pin (start), where it can be seen. */
  flight: { ease: "sine.inOut", levelOut: 0.05, start: 0.012 },
  harbour: { fromY: 60, duration: 0.8, ease: "power2.out" },
  /** The towers rise one after another, like the houses of St. Gallen in the hero. */
  towers: { duration: 0.6, stagger: 0.07, ease: "power2.out" },
  /** Windows light up one by one. */
  windows: { duration: 0.2, stagger: 0.025 },
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
