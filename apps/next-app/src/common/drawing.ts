import { breadthFirstTraversal } from "./bft";
import { getBrush } from "./brush";

export type DrawEvent = {
  from: readonly [number, number];
  to: readonly [number, number];
  size: number;
};

export type FillEvent = {
  points: Map<string, { boundary: boolean }>;
};

/**
 * The settings for filling a pixel in the draw function.
 */
export enum FillBoundaryType {
  boundary,
  notBoundary,
  retain,
}

/**
 * Draws the brush shape at a given position.
 *
 * By passing in a Map<number, { newBoundaryPoints: Set<string> }> for
 * effectedSegments, the function will fill in the new boundary points for each
 * segment that is effected by the drawing.
 */
function draw(
  getSegment: (pos: readonly [number, number]) => number,
  setSegment: (pos: readonly [number, number]) => void,
  fill: (pos: readonly [number, number], type: FillBoundaryType) => void,
  activeSegment: number,
  pos: readonly [number, number],
  resolution: readonly [number, number],
  brushSize: number,
  effectedSegments: Map<number, { newBoundaryPoints: Set<string> }> | null
): void {
  for (const point of getBrush(brushSize)) {
    const pixelPos = [pos[0] + point.pos[0], pos[1] + point.pos[1]] as const;
    if (
      pixelPos[0] >= 0 &&
      pixelPos[1] >= 0 &&
      pixelPos[0] < resolution[0] &&
      pixelPos[1] < resolution[1]
    ) {
      const oldSegment = getSegment(pixelPos);
      effectedSegments
        ?.get(oldSegment)
        ?.newBoundaryPoints.delete(`${pixelPos[0]},${pixelPos[1]}`);
      setSegment(pixelPos);

      const isBoundary =
        point.boundaryEdges.filter((offset) => {
          const pos = [
            offset[0] + pixelPos[0],
            offset[1] + pixelPos[1],
          ] as const;
          if (
            pos[0] < 0 ||
            pos[1] < 0 ||
            pos[0] >= resolution[0] ||
            pos[1] >= resolution[1]
          ) {
            return true;
          } else {
            const segment = getSegment(pos);
            if (segment !== activeSegment) {
              if (segment !== -1) {
                if (effectedSegments) {
                  let segmentEntry = effectedSegments.get(segment);
                  if (!segmentEntry) {
                    segmentEntry = {
                      newBoundaryPoints: new Set<string>(),
                    };
                    effectedSegments.set(segment, segmentEntry);
                  }
                  segmentEntry.newBoundaryPoints.add(`${pos[0]},${pos[1]}`);
                }
                fill(pos, FillBoundaryType.boundary);
              }
              return true;
            }
          }
          return false;
        }).length > 0 ||
        pixelPos[0] === 0 ||
        pixelPos[1] === 0 ||
        pixelPos[0] === resolution[0] - 1 ||
        pixelPos[1] === resolution[1] - 1;

      fill(
        pixelPos,
        isBoundary ? FillBoundaryType.boundary : FillBoundaryType.notBoundary
      );
    }
  }
}

/**
 * the factor to divide the brush size when interpolating across a segment
 */
const kDrawingSmoothStep = 4;

/**
 * Draws a smooth brush stroke between two points.
 */
export function smoothPaint<RecomputeSegments extends boolean>(
  getSegment: (pos: readonly [number, number]) => number,
  setSegment: (pos: readonly [number, number]) => void,
  fill: (pos: readonly [number, number], type: FillBoundaryType) => void,
  activeSegment: number,
  event: DrawEvent,
  resolution: readonly [number, number],
  recomputeSegments: RecomputeSegments
): RecomputeSegments extends true
  ? Map<number, { newBoundaryPoints: Set<string> }>
  : void {
  const effectedSegments = recomputeSegments
    ? new Map<number, { newBoundaryPoints: Set<string> }>()
    : null;

  // draw the starting point of the brush stroke
  draw(
    getSegment,
    setSegment,
    fill,
    activeSegment,
    event.from,
    resolution,
    event.size,
    effectedSegments
  );

  // current interpolation point
  const current: [number, number] = [event.to[0], event.to[1]];

  // distance between the start and end points of the brush stroke
  const length = Math.sqrt(
    Math.pow(current[0] - event.from[0], 2) +
      Math.pow(current[1] - event.from[1], 2)
  );

  // the step to take for each interpolation
  const step = [
    ((event.size / kDrawingSmoothStep) * (event.from[0] - current[0])) / length,
    ((event.size / kDrawingSmoothStep) * (event.from[1] - current[1])) / length,
  ];

  // interpolate between the end and start point of the brush stroke
  for (
    let i = 0;
    i < Math.floor(length / (event.size / kDrawingSmoothStep));
    i++
  ) {
    const currentPos = [
      Math.floor(current[0]),
      Math.floor(current[1]),
    ] as const;

    // draw at the current interpolation point
    draw(
      getSegment,
      setSegment,
      fill,
      activeSegment,
      currentPos,
      resolution,
      event.size,
      effectedSegments
    );

    current[0] += step[0];
    current[1] += step[1];
  }

  return effectedSegments as RecomputeSegments extends true
    ? Map<number, { newBoundaryPoints: Set<string> }>
    : void;
}

export function recomputeSegments(
  getSegment: (pos: readonly [number, number]) => number,
  setSegment: (pos: readonly [number, number], segment: number) => void,
  fill: (pos: readonly [number, number], type: FillBoundaryType) => void,
  isBoundary: (pos: readonly [number, number]) => boolean,
  nextSegmentIndex: { index: number },
  resolution: readonly [number, number],
  effectedSegments: Map<number, { newBoundaryPoints: Set<string> }>
): void {
  for (const effectedSegment of effectedSegments) {
    const segment = effectedSegment[0];
    const { newBoundaryPoints } = effectedSegment[1];
    while (newBoundaryPoints.size > 0) {
      let boundarySize = newBoundaryPoints.size;
      const bfsStart = newBoundaryPoints
        .values()
        .next()
        .value.split(",")
        .map((str: string) => parseInt(str)) as [number, number];
      newBoundaryPoints.delete(`${bfsStart[0]},${bfsStart[1]}`);
      const visited = breadthFirstTraversal(bfsStart, (pos) => {
        const stringify = `${pos[0]},${pos[1]}`;
        if (
          pos[0] >= 0 &&
          pos[1] >= 0 &&
          pos[0] < resolution[0] &&
          pos[1] < resolution[1] &&
          newBoundaryPoints.has(stringify)
        ) {
          newBoundaryPoints.delete(stringify);
          return true;
        }
        return false;
      });
      if (visited.size < boundarySize) {
        boundarySize -= visited.size;
        breadthFirstTraversal(bfsStart, (pos, exitLoop) => {
          if (
            pos[0] >= 0 &&
            pos[1] >= 0 &&
            pos[0] < resolution[0] &&
            pos[1] < resolution[1] &&
            getSegment(pos) === segment &&
            isBoundary(pos)
          ) {
            const stringify = `${pos[0]},${pos[1]}`;
            if (newBoundaryPoints.has(stringify)) {
              boundarySize--;
              if (boundarySize === 0) {
                exitLoop();
              }
            }
            return true;
          }
          return false;
        });
        if (boundarySize !== 0) {
          let set = false;
          breadthFirstTraversal(bfsStart, (pos) => {
            if (
              pos[0] >= 0 &&
              pos[1] >= 0 &&
              pos[0] < resolution[0] &&
              pos[1] < resolution[1] &&
              getSegment(pos) === segment
            ) {
              set = true;
              setSegment(pos, nextSegmentIndex.index);
              fill(pos, FillBoundaryType.retain);
              return true;
            }
            return false;
          });
          if (set) {
            nextSegmentIndex.index++;
          }
        }
      }
    }
  }
}
