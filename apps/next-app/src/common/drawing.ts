import { ClientState } from "@/client";
import { breadthFirstTraversal } from "./bft";
import { getBrush } from "./brush";

/**
 * This is emitted by the client to the socket.io server, and then broadcasted
 * to all other clients in the same room. This is also stored in the raw log.
 */
export type DrawEvent = {
  from: readonly [number, number];
  to: readonly [number, number];
  size: number;
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
 * @param getSegment a function that returns the segment at a given position
 * @param setSegment a function that sets the segment at a given position
 * @param fill a function that performs some side-effect for each segment or
 *             boundary update.
 */
function draw(
  getSegment: (pos: readonly [number, number]) => number,
  setSegment: (pos: readonly [number, number]) => void,
  fill: (pos: readonly [number, number], type: FillBoundaryType) => void,
  activeSegment: number,
  pos: readonly [number, number],
  resolution: readonly [number, number],
  brushSize: number
): void {
  for (const point of getBrush(brushSize)) {
    const pixelPos = [pos[0] + point.pos[0], pos[1] + point.pos[1]] as const;
    if (
      pixelPos[0] >= 0 &&
      pixelPos[1] >= 0 &&
      pixelPos[0] < resolution[0] &&
      pixelPos[1] < resolution[1]
    ) {
      setSegment(pixelPos);

      const isBoundary =
        // check each boundary edge of the brush point
        point.boundaryEdges.filter((offset) => {
          const pos = [
            offset[0] + pixelPos[0],
            offset[1] + pixelPos[1],
          ] as const;
          // if the boundary edge is out of bounds, then it is a boundary
          if (
            pos[0] < 0 ||
            pos[1] < 0 ||
            pos[0] >= resolution[0] ||
            pos[1] >= resolution[1]
          ) {
            return true;
          } else {
            const segment = getSegment(pos);
            // if the point boundary edge is not the same segment as the active segment
            // then it is a boundary point of the segment it belongs to.
            if (segment !== activeSegment) {
              // if the point is not a part of a segment we do not need to run fill
              if (segment !== -1) {
                fill(pos, FillBoundaryType.boundary);
              }
              return true;
            }
          }
          return false;
        }).length > 0 ||
        // if the point is on the edge of the canvas, then it is a boundary
        pixelPos[0] === 0 ||
        pixelPos[1] === 0 ||
        pixelPos[0] === resolution[0] - 1 ||
        pixelPos[1] === resolution[1] - 1;

      // update boundary and color
      fill(
        pixelPos,
        isBoundary ? FillBoundaryType.boundary : FillBoundaryType.notBoundary
      );
    }
  }
}

/**
 * The factor to divide the brush size when interpolating across a segment
 */
const kDrawingSmoothStep = 4;

/**
 * Applies a draw event.
 */
export function applyDrawEvent(
  getSegment: (pos: readonly [number, number]) => number,
  setSegment: (pos: readonly [number, number]) => void,
  fill: (pos: readonly [number, number], type: FillBoundaryType) => void,
  activeSegment: number,
  event: DrawEvent,
  resolution: readonly [number, number]
): void {
  // draw the starting point of the brush stroke
  draw(
    getSegment,
    setSegment,
    fill,
    activeSegment,
    event.from,
    resolution,
    event.size
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
      event.size
    );

    current[0] += step[0];
    current[1] += step[1];
  }
}

/**
 * Draws a smooth brush stroke between two points and tracks newly created
 * boundary points on old segments.
 */
export function smoothPaint(
  getSegment: (pos: readonly [number, number]) => number,
  setSegment: (pos: readonly [number, number], segment: number) => void,
  fill: (pos: readonly [number, number], type: FillBoundaryType) => void,
  state: { nextSegmentIndex: number },
  event: DrawEvent,
  resolution: readonly [number, number]
): Map<number, { newBoundaryPoints: Set<string> }> {
  const effectedSegments = new Map<
    number,
    { newBoundaryPoints: Set<string> }
  >();

  let activeSegment = getSegment(event.from);

  if (activeSegment === -1) {
    activeSegment = state.nextSegmentIndex;
    state.nextSegmentIndex++;
  }

  applyDrawEvent(
    getSegment,
    (pos) => {
      const oldSegment = getSegment(pos);
      let oldSegmentEntry = effectedSegments.get(oldSegment);
      if (oldSegmentEntry) {
        oldSegmentEntry.newBoundaryPoints.delete(`${pos[0]},${pos[1]}`);
      }
      setSegment(pos, activeSegment);
    },
    (pos, type) => {
      const segment = getSegment(pos);
      if (segment !== activeSegment) {
        let entry = effectedSegments.get(segment);
        if (!entry) {
          entry = { newBoundaryPoints: new Set<string>() };
          effectedSegments.set(segment, entry);
        }
        if (type === FillBoundaryType.boundary) {
          entry.newBoundaryPoints.add(`${pos[0]},${pos[1]}`);
        }
      }
      fill(pos, type);
    },
    activeSegment,
    event,
    resolution
  );

  return effectedSegments;
}

/**
 * Finds and fills new segment splits given a set of effected segments and
 * their new boundary points that were created by the last draw.
 */
export function recomputeSegments(
  getSegment: (pos: readonly [number, number]) => number,
  setSegment: (pos: readonly [number, number], segment: number) => void,
  fill: (pos: readonly [number, number], type: FillBoundaryType) => void,
  isBoundary: (pos: readonly [number, number]) => boolean,
  state: { nextSegmentIndex: number },
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
              setSegment(pos, state.nextSegmentIndex);
              fill(pos, FillBoundaryType.retain);
              return true;
            }
            return false;
          });
          if (set) {
            state.nextSegmentIndex++;
          }
        }
      }
    }
  }
}
