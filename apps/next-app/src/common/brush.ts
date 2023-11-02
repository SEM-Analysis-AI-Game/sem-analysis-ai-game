type BrushPoints = readonly {
  offset: readonly [number, number];
  boundary: boolean;
}[];

const kMinBrushSize = 5;

const brushes: BrushPoints[] = [];

/**
 * Gets the points that make up a brush of a given size.
 */
export function getBrush(size: number): BrushPoints {
  const index = size - kMinBrushSize;
  if (!brushes[index]) {
    const points: { offset: readonly [number, number]; boundary: boolean }[] =
      [];
    const radius = Math.ceil(size / 2);
    for (let x = -radius; x < radius; x++) {
      for (let y = -radius; y < radius; y++) {
        const lengthSquared = x * x + y * y;
        const radiusSquared = radius * radius;
        if (lengthSquared < radiusSquared) {
          const xPlusOneSquared =
            (x + Math.sign(x) * 1) * (x + Math.sign(x) * 1) + y * y;
          const yPlusOneSquared =
            x * x + (y + Math.sign(y) * 1) * (y + Math.sign(y) * 1);
          points.push({
            offset: [x, y],
            boundary:
              xPlusOneSquared >= radiusSquared ||
              yPlusOneSquared >= radiusSquared,
          });
        }
      }
    }
    brushes[index] = points;
  }
  return brushes[index];
}
