/**
 * The points that make up a brush.
 */
type BrushPoints = readonly {
  /**
   * The position of the point relative to the center of the brush. if a point is
   * on the boundary of the brush, it will have its edges stored in boundaryEdges.
   */
  pos: readonly [number, number];

  /**
   * Used for tracking segment boundaries while drawing. The edges are stored as
   * directions in the form [x, y] where x and y are -1, 0, or 1. for example,
   * the edge [1, 0] is the right edge of the brush, or [0, -1] is the bottom edge
   * of the brush. diagonal edges are not stored.
   */
  boundaryEdges: readonly (readonly [number, number])[];
}[];

const kMaxBrushSize = 100;
const kMinBrushSize = 5;
const kBrushSizeInterval = 5;

/**
 * The points in the brush. The brush is a circle.
 */
const kBrushes: readonly BrushPoints[] = (() => {
  const brushes = [];
  for (let i = kMinBrushSize; i <= kMaxBrushSize; i += kBrushSizeInterval) {
    const points: {
      pos: readonly [number, number];
      boundaryEdges: readonly (readonly [number, number])[];
    }[] = [];
    const radius = Math.ceil(i / 2);
    for (let x = -radius; x < radius; x++) {
      for (let y = -radius; y < radius; y++) {
        const lengthSquared = x * x + y * y;
        const radiusSquared = radius * radius;
        if (lengthSquared < radiusSquared) {
          const boundaryEdges: (readonly [number, number])[] = [];

          function checkOffset(offset: readonly [number, number]) {
            const lengthSquared =
              (offset[0] + x) * (offset[0] + x) +
              (offset[1] + y) * (offset[1] + y);
            if (lengthSquared >= radiusSquared) {
              boundaryEdges.push(offset);
            }
          }
          if (x < 0) {
            checkOffset([-1, 0]);
          } else if (x > 0) {
            checkOffset([1, 0]);
          }

          if (y < 0) {
            checkOffset([0, -1]);
          } else if (y > 0) {
            checkOffset([0, 1]);
          }

          points.push({
            boundaryEdges,
            pos: [x, y],
          });
        }
      }
    }
    brushes.push(points);
  }
  return brushes;
})();

/**
 * Gets the points that make up a brush of a given size.
 */
export function getBrush(size: number): BrushPoints {
  return kBrushes[Math.floor((size - kMinBrushSize) / kBrushSizeInterval)];
}
