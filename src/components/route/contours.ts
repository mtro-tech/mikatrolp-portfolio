// Map ground helpers: build-time path strings for contour rings and graticule lines.
// Deterministic (no randomness), so every build draws the same map.

type Point = [number, number];

const round = (n: number) => Math.round(n * 10) / 10;

/** One closed, slightly irregular contour ring around a centre. */
function ring(cx: number, cy: number, radius: number, seed: number): string {
  const count = 28;
  const points: Point[] = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    // Three slow waves make the ring look hand-surveyed instead of circular.
    const wobble =
      1 +
      0.1 * Math.sin(3 * angle + seed) +
      0.06 * Math.sin(5 * angle + seed * 2.3) +
      0.04 * Math.sin(2 * angle + seed * 0.7);
    return [
      cx + Math.cos(angle) * radius * wobble * 1.3,
      cy + Math.sin(angle) * radius * wobble * 0.8,
    ];
  });

  // Closed Catmull-Rom spline through the points, written as cubic Béziers.
  const at = (i: number) => points[(i + count) % count];
  let d = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 0; i < count; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d +=
      `C${round(p1[0] + (p2[0] - p0[0]) / 6)} ${round(p1[1] + (p2[1] - p0[1]) / 6)} ` +
      `${round(p2[0] - (p3[0] - p1[0]) / 6)} ${round(p2[1] - (p3[1] - p1[1]) / 6)} ` +
      `${round(p2[0])} ${round(p2[1])}`;
  }
  return `${d}Z`;
}

/** Concentric contour rings, like the hills on a hiking map. */
export function contours(
  cx: number,
  cy: number,
  options: { first: number; step: number; count: number; seed?: number },
): string[] {
  const { first, step, count, seed = 0 } = options;
  return Array.from({ length: count }, (_, i) =>
    ring(cx, cy, first + i * step, seed + i * 0.35),
  );
}

/** Gently curved lines of longitude and latitude across a width × height area. */
export function graticule(
  width: number,
  height: number,
  spacing: number,
): string[] {
  const lines: string[] = [];
  for (let x = spacing / 2; x < width; x += spacing) {
    lines.push(
      `M${x} -20Q${x + spacing * 0.15} ${height / 2} ${x - spacing * 0.05} ${height + 20}`,
    );
  }
  for (let y = spacing / 2; y < height; y += spacing) {
    lines.push(
      `M-20 ${y}Q${width / 2} ${y - spacing * 0.2} ${width + 20} ${y}`,
    );
  }
  return lines;
}
