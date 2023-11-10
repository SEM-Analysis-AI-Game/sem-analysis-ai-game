import { breadthFirstTraversal, kAdjacency } from "./bft";
import { getBrush } from "./brush";
import {
  DrawEvent,
  DrawResponse,
  FloodFillEvent,
  FloodFillResponse,
  State,
} from "./state";

/**
 * Checks if a position is within the bounds of the canvas.
 */
function inBounds(
  pos: readonly [number, number],
  resolution: readonly [number, number]
): boolean {
  return (
    pos[0] >= 0 &&
    pos[1] >= 0 &&
    pos[0] < resolution[0] &&
    pos[1] < resolution[1]
  );
}

/**
 * Get the data for a pixel at a given position on the canvas.
 */
export function getPixelData<StateType extends State>(
  state: StateType,
  pos: readonly [number, number]
): StateType["canvas"][number] | undefined {
  return state.canvas[pos[1] * state.resolution[0] + pos[0]];
}

/**
 * The possible number of adjacent pixels that belong to the same segment
 * as a given pixel.
 */
type NumNeighbors = 0 | 1 | 2 | 3 | 4;

/**
 * Increments the numNeighbors count while retaining type info.
 */
function incrementNumNeighbors(numNeighbors: NumNeighbors): NumNeighbors {
  switch (numNeighbors) {
    case 0:
      return 1;
    case 1:
      return 2;
    case 2:
      return 3;
    case 3:
      return 4;
    case 4:
      return 4;
  }
}

/**
 * Decrements the numNeighbors count while retaining type info.
 */
function decrementNumNeighbors(numNeighbors: NumNeighbors): NumNeighbors {
  switch (numNeighbors) {
    case 0:
      return 0;
    case 1:
      return 0;
    case 2:
      return 1;
    case 3:
      return 2;
    case 4:
      return 3;
  }
}

/**
 * Sets the data for a pixel at a given position on the canvas.
 */
function setSegment<StateType extends State>(
  onUpdateSegment: (
    pos: readonly [number, number],
    oldData: StateType["canvas"][number] | null,
    newData: StateType["canvas"][number]
  ) => void,
  state: State,
  pos: readonly [number, number],
  numNeighbors: NumNeighbors,
  segment: number
) {
  let data = state.canvas[pos[1] * state.resolution[0] + pos[0]];

  // only update the data if it has changed
  if (
    !data ||
    data.segment !== segment ||
    data.inSegmentNeighbors !== numNeighbors
  ) {
    const copy = { ...data };

    // no existing data, call createPixelData to create it
    if (!data) {
      data = {
        segment,
        inSegmentNeighbors: numNeighbors,
      };
      state.canvas[pos[1] * state.resolution[0] + pos[0]] = data;
    }

    // update the data
    data.segment = segment;
    data.inSegmentNeighbors = numNeighbors;

    if (
      copy.segment !== data.segment ||
      copy.inSegmentNeighbors !== data.inSegmentNeighbors
    ) {
      onUpdateSegment(pos, copy, data);
    }
  }
}

/**
 * Sets data for a pixel that is not on the boundary of a segment.
 */
function setNonBoundarySegment<StateType extends State>(
  onUpdateSegment: (
    pos: readonly [number, number],
    oldData: StateType["canvas"][number] | null,
    newData: StateType["canvas"][number]
  ) => void,
  state: State,
  pos: readonly [number, number],
  segment: number
) {
  setSegment(onUpdateSegment, state, pos, 4, segment);
}

/**
 * Sets data for a pixel that may be on the boundary of a segment.
 */
function setBoundarySegment<StateType extends State>(
  onUpdateSegment: (
    pos: readonly [number, number],
    oldData: StateType["canvas"][number] | null,
    newData: StateType["canvas"][number]
  ) => void,
  state: State,
  pos: readonly [number, number],
  segment: number
) {
  // count the number of adjacent pixels that are in the same segment
  let numNeighbors: NumNeighbors = 0;
  const data = getPixelData(state, pos);
  for (const neighbor of kAdjacency) {
    const neighborPos = [pos[0] + neighbor[0], pos[1] + neighbor[1]] as const;
    if (inBounds(neighborPos, state.resolution)) {
      const neighborData = getPixelData(state, neighborPos);
      if (neighborData) {
        // if the neighbor is in the same segment, increment the count
        if (neighborData.segment === segment) {
          numNeighbors = incrementNumNeighbors(numNeighbors);
        }
        // if there was no data at this pixel previously or if the previous segment was
        // not the same as the event segment, then we need to update the neighbor data
        if (!data || data.segment !== segment) {
          let updatedNeighbor = false;
          if (neighborData.segment === segment) {
            neighborData.inSegmentNeighbors = incrementNumNeighbors(
              neighborData.inSegmentNeighbors
            );
            updatedNeighbor = true;
          } else if (data && data.segment === neighborData.segment) {
            neighborData.inSegmentNeighbors = decrementNumNeighbors(
              neighborData.inSegmentNeighbors
            );
            updatedNeighbor = true;
          }

          // fill the drawing pixel and call onUpdateSegment if the data was updated
          if (updatedNeighbor) {
            onUpdateSegment(neighborPos, neighborData, neighborData);
          }
        }
      }
    }
  }
  setSegment(onUpdateSegment, state, pos, numNeighbors, segment);
}

/**
 * Applies a draw event to the canvas, without any segment splits.
 *
 * @param onUpdateSegment Called when the data for a pixel is updated.
 */
export function applyDrawEvent<StateType extends State>(
  onUpdateSegment: (
    pos: readonly [number, number],
    oldData: StateType["canvas"][number] | null,
    newData: StateType["canvas"][number]
  ) => void,
  state: StateType,
  event: Omit<DrawResponse, "historyIndex">
): void {
  /**
   * Checks if a position is on the boundary of the canvas.
   */
  function onCanvasBoundary(pos: readonly [number, number]): boolean {
    return (
      pos[0] === 0 ||
      pos[1] === 0 ||
      pos[0] === state.resolution[0] - 1 ||
      pos[1] === state.resolution[1] - 1
    );
  }

  // boundary points for a rectangle drawn between event.from and event.to
  const rectangleBoundary = new Set<string>();

  /**
   * Adds all the points on a straight line from one point to another to
   * rectangleBoundary.
   */
  function drawLine(
    from: readonly [number, number],
    to: readonly [number, number]
  ) {
    const diff = [to[0] - from[0], to[1] - from[1]] as const;

    // length of the line
    const distance = Math.sqrt(diff[0] ** 2 + diff[1] ** 2);

    if (distance === 0) {
      return;
    }

    // normalized step
    const step = [diff[0] / distance, diff[1] / distance] as const;

    // draw the line
    for (let x = 0; x < distance; x++) {
      const pos = [
        Math.ceil(from[0] + step[0] * x),
        Math.ceil(from[1] + step[1] * x),
      ] as const;
      if (inBounds(pos, state.resolution)) {
        rectangleBoundary.add(`${pos[0]},${pos[1]}`);
      }
    }
  }

  const diff = [
    event.to[0] - event.from[0],
    event.to[1] - event.from[1],
  ] as const;

  // slope of the line drawn
  const slope =
    diff[0] !== 0
      ? diff[1] / diff[0]
      : Infinity * (diff[1] !== 0 ? Math.sign(diff[1]) : 0);

  // radius of the brush
  const perpendicularDistance = event.size / 2 - 1;

  // angle of the line drawn from the horizontal
  const angle = Math.atan(-1 / slope);

  // distance from the center of the line to the edge of the brush
  const xDistance = Math.cos(angle) * perpendicularDistance;
  const yDistance = Math.sin(angle) * perpendicularDistance;

  const rightEdgeStart = [
    Math.floor(event.from[0] + xDistance),
    Math.floor(event.from[1] + yDistance),
  ] as const;

  const leftEdgeStart = [
    Math.floor(event.from[0] - xDistance),
    Math.floor(event.from[1] - yDistance),
  ] as const;

  const rightEdgeEnd = [
    Math.floor(event.to[0] + xDistance),
    Math.floor(event.to[1] + yDistance),
  ] as const;

  const leftEdgeEnd = [
    Math.floor(event.to[0] - xDistance),
    Math.floor(event.to[1] - yDistance),
  ] as const;

  // draw the rectangle
  drawLine(rightEdgeStart, rightEdgeEnd);
  drawLine(leftEdgeStart, leftEdgeEnd);
  drawLine(rightEdgeEnd, leftEdgeEnd);
  drawLine(rightEdgeStart, leftEdgeStart);

  // if we drew any points on the rectangle, flood fill it
  if (rectangleBoundary.size > 0) {
    breadthFirstTraversal(
      [
        Math.floor((event.from[0] + event.to[0]) / 2),
        Math.floor((event.from[1] + event.to[1]) / 2),
      ],
      (pos) => {
        if (inBounds(pos, state.resolution)) {
          if (rectangleBoundary.has(`${pos[0]},${pos[1]}`)) {
            setBoundarySegment(onUpdateSegment, state, pos, event.segment);

            // the rectangle boundary will stop the traversal
            return false;
          } else {
            if (onCanvasBoundary(pos)) {
              setBoundarySegment(onUpdateSegment, state, pos, event.segment);
            } else {
              setNonBoundarySegment(onUpdateSegment, state, pos, event.segment);
            }
            return true;
          }
        } else {
          return false;
        }
      },
      false
    );
  }

  /**
   * Draws a circle at a given position.
   */
  function drawCircle(pos: readonly [number, number]): void {
    for (const { offset, boundary } of getBrush(event.size)) {
      const offsetPos = [pos[0] + offset[0], pos[1] + offset[1]] as const;
      if (inBounds(offsetPos, state.resolution)) {
        if (boundary || onCanvasBoundary(offsetPos)) {
          setBoundarySegment(onUpdateSegment, state, offsetPos, event.segment);
        } else {
          setNonBoundarySegment(
            onUpdateSegment,
            state,
            offsetPos,
            event.segment
          );
        }
      }
    }
  }

  // draw circles at the start and end of the line
  drawCircle(event.to);
  drawCircle(event.from);
}

/**
 * Applies a draw event, using the correct segment depending on where the draw
 * event begins, and finds all segment splits and returns flood fill events for
 * them.
 *
 * @param onUpdateSegment Called when the data for a pixel is updated.
 * @param removeFill Called when a flood fill event is being created for each pixel
 *                   that would be effected.
 */
export function drawAndFindSplits<StateType extends State>(
  onUpdateSegment: (
    pos: readonly [number, number],
    oldData: StateType["canvas"][number] | null,
    newData: StateType["canvas"][number]
  ) => void,
  removeFill: (pos: readonly [number, number]) => void,
  state: StateType,
  event: DrawEvent
): {
  activeSegment: number;
  fills: FloodFillEvent[];
} {
  // get the correct segment for the draw event based on where it begins
  const oldSegment = getPixelData(state, event.from)?.segment ?? -1;
  const segment =
    event.type === "brush"
      ? oldSegment === -1
        ? state.nextSegmentIndex++
        : oldSegment
      : -1;

  // the keys are segment ids, and the values are newly created boundary points for
  // those segments
  const effectedSegments = new Map<number, Set<string>>();

  applyDrawEvent(
    (pos, oldData, newData) => {
      if (oldData && oldData.segment !== segment && oldData.segment !== -1) {
        let oldSegmentNewBoundaryPoints = effectedSegments.get(oldData.segment);
        const stringified = `${pos[0]},${pos[1]}`;
        if (oldSegmentNewBoundaryPoints) {
          oldSegmentNewBoundaryPoints.delete(stringified);
        } else {
          oldSegmentNewBoundaryPoints = new Set();
          effectedSegments.set(oldData.segment, oldSegmentNewBoundaryPoints);
        }
        if (
          oldData.segment === newData.segment &&
          newData.inSegmentNeighbors < 4
        ) {
          oldSegmentNewBoundaryPoints.add(stringified);
        }
      }
      onUpdateSegment(pos, oldData, newData);
    },
    state,
    { ...event, segment }
  );

  // create flood fill events for each segment that was split
  const fills: FloodFillEvent[] = [];
  for (const [effectedSegment, newBoundaryPoints] of effectedSegments) {
    // loop while there are still new boundary points remaining in the set
    while (newBoundaryPoints.size > 0) {
      // get a random point from the set to begin breadth first traversal
      const traversalStart = Object.freeze(
        (newBoundaryPoints.values().next().value as string)
          .split(",")
          .map((value) => parseInt(value)) as [number, number]
      );

      // traverse along the newly created boundary points to see if they are all
      // connected. if they are, we can stop early and avoid the extra work of
      // traversing all boundary points on the effected segment. visited will be
      // used as a set of all the points that can be used to flood fill the newly
      // created segment if a split occurs.
      const visited = breadthFirstTraversal(
        traversalStart,
        (pos) =>
          inBounds(pos, state.resolution) &&
          newBoundaryPoints.delete(`${pos[0]},${pos[1]}`),
        true
      );

      // if we traversed over every new boundary point, then the segment is not split
      // and we can stop. newBoundaryPoints will be empty if we traversed over every
      // new boundary point, and we can stop early.
      if (newBoundaryPoints.size > 0) {
        // traverse over all boundary points for the effected segment. this can potentially
        // be very expensive, thus is why we first check only the new boundary points to try
        // an early stop.
        breadthFirstTraversal(
          traversalStart,
          (pos, exitLoop) => {
            if (inBounds(pos, state.resolution)) {
              const data = getPixelData(state, pos);

              // if the pixel is in the effected segment and is a boundary point,
              // then continue the traversal.
              if (
                data &&
                data.segment === effectedSegment &&
                data.inSegmentNeighbors < 4
              ) {
                const stringify = `${pos[0]},${pos[1]}`;

                // visited consists of all the points that can be used to flood fill
                // the newly created segment if a split occurs. we should use the newly
                // created boundary points to populate this set.
                if (newBoundaryPoints.delete(stringify)) {
                  visited.add(stringify);
                  if (newBoundaryPoints.size === 0) {
                    exitLoop();
                  }
                } else {
                  // run a function whenever we traverse over a boundary point and that point
                  // should no longer be used as a starting point for a flood fill.
                  removeFill(pos);
                }
                return true;
              }
            }
            return false;
          },
          true
        );
        // if there are still new boundary points remaining, then the segment is split
        if (newBoundaryPoints.size > 0) {
          // create a flood fill event for the newly created segment
          fills.push({
            segment: state.nextSegmentIndex++,
            points: visited,
          });
        } else {
          fills.push({
            segment: effectedSegment,
            points: visited,
          });
        }
      } else {
        fills.push({
          segment: effectedSegment,
          points: visited,
        });
      }
    }
  }

  // return the segment that was used for the draw event and the flood fill events that were
  // created as a result.
  return { activeSegment: segment, fills };
}

/**
 * Applies a flood fill event to the canvas.
 */
export function floodFill<
  StateType extends State,
  FillType extends FloodFillResponse | FloodFillEvent
>(
  onUpdateSegment: (
    pos: readonly [number, number],
    entry: StateType["canvas"][number],
    fill: FillType
  ) => void,
  state: State,
  fills: readonly FillType[],
  type: FillType extends FloodFillResponse
    ? "FloodFillResponse"
    : "FloodFillEvent"
): void {
  /**
   * Determines the starting point for the flood fill based on `type`.
   */
  function traversalStart(data: FillType) {
    if (type === "FloodFillResponse") {
      const typedFill = data as FloodFillResponse;
      return typedFill.startingPoint;
    } else {
      const typedFill = data as FloodFillEvent;
      return (typedFill.points.values().next().value as string)
        .split(",")
        .map((val) => parseInt(val)) as [number, number];
    }
  }

  for (const fill of fills) {
    const fillStart = traversalStart(fill);
    const data = getPixelData(state, fillStart);
    if (data && data.segment !== fill.segment) {
      const oldSegmentId = data.segment;
      breadthFirstTraversal(
        fillStart,
        (pos) => {
          if (inBounds(pos, state.resolution)) {
            const posData = getPixelData(state, pos);
            if (
              posData &&
              (posData.segment === fill.segment ||
                posData.segment === oldSegmentId)
            ) {
              if (posData.inSegmentNeighbors < 4) {
                setBoundarySegment(() => {}, state, pos, fill.segment);
              } else {
                setNonBoundarySegment(() => {}, state, pos, fill.segment);
              }
              onUpdateSegment(pos, posData, fill);
              return true;
            }
          }
          return false;
        },
        true
      );
    }
  }
}
