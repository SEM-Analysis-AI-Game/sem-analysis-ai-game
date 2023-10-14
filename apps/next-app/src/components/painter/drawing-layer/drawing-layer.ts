import * as THREE from "three";
import { Dispatch } from "react";
import {
  PointContainer,
  deletePoint,
  firstPointWhere,
  forEachPoint,
  getPoint,
  hasPoint,
  setPoint,
} from "../point-container";
import { breadthFirstTraversal } from "./bft";
import { PainterStatistics, StatisticsEvent } from "../statistics";
import { RendererState, fillPixel } from "../renderer-state";
import { ActionState } from "../tools";

// The alpha is boosted by this amount when a pixel is on the border of a segment.
const kBorderAlphaBoost = 0.5;

/**
 * This is the alpha used to fill in points when drawing.
 */
const kDrawAlpha = 0.5;

/**
 * The drawing layer is responsible for updating the renderer state
 * and tracking drawn segments. Segments are given 1-based indexes.
 */
export type DrawingLayer = {
  /**
   * The drawing layer can directly write to the renderer state. The renderer
   * state is not used for React state, but rather for WebGL state.
   */
  readonly rendererState: RendererState;

  /**
   * The segment buffer stores the segment ID (1-indexed) for each
   * pixel as a flattened 2D array (row-major). A -1 indicates that no
   * segment has been drawn at that pixel. This is used for fast lookups
   * of the segment for a given pixel. This is mutable because it is
   * potentially updated on every frame.
   */
  readonly segmentBuffer: Int32Array;

  /**
   * the segment map stores the color and points for each segment
   * the number of neighbors (adjacent pixels of the same segment)
   * each point has is stored in the point container. If a point
   * has < 4 neighbors, it is on the boundary of the segment. This
   * is updated on every frame potentially so it is mutable.
   */
  readonly segmentMap: Map<
    number,
    {
      color: THREE.Color;
      points: PointContainer<{ numNeighbors: number }>;
    }
  >;

  /**
   * Dispatches update events to the statistics reducer.
   */
  readonly updateStatistics: Dispatch<StatisticsEvent>;
};

/**
 * Increase the total number of segments by one.
 */
export function incrementSegments(drawingLayer: DrawingLayer): void {
  const randomColor = new THREE.Color(
    Math.random(),
    Math.random(),
    Math.random()
  );
  drawingLayer.segmentMap.set(drawingLayer.segmentMap.size + 1, {
    color: randomColor,
    points: {
      size: 0,
      points: new Map(),
    },
  });
}

/**
 * Returns a new drawing layer with the given pixel size, and a
 * reference to update the statistics reducer.
 */
export function initialState(
  rendererState: RendererState,
  updateStatistics: Dispatch<StatisticsEvent>
): DrawingLayer {
  return {
    updateStatistics,
    rendererState,
    segmentMap: new Map(),
    segmentBuffer: new Int32Array(
      rendererState.pixelSize.x * rendererState.pixelSize.y
    ).fill(-1),
  };
}

/**
 * Gets the segment index (1-based) for a given pixel.
 */
export function getSegment(
  drawingLayer: DrawingLayer,
  pos: THREE.Vector2
): number {
  return drawingLayer.segmentBuffer[
    pos.y * drawingLayer.rendererState.pixelSize.x + pos.x
  ];
}

/**
 * Used for finding adjacent pixels.
 */
export const kAdjacency = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as [number, number][];

/**
 * Used for finding diagonal + adjacent pixels.
 */
const kDiagonalAdjacency = [
  ...kAdjacency,
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as [number, number][];

/**
 * Given an action, finds and applies splits in segments
 * that were effected by the action. The splits are
 * written to the action's paintedPoints so they can
 * be undone.
 */
export function recomputeSegments(
  state: DrawingLayer,
  actionState: ActionState
): void {
  let firstSplitDone = false;
  for (let segment of actionState.effectedSegments) {
    // these are all of the newly drawn boundary points
    // that were created by the action on the effected
    // segment
    const boundary = segment[1].newBoundaryPoints;

    // we will be removing points from the boundary container
    // and iterating until it is empty.
    while (boundary.size > 0) {
      // find a random point in the boundary container
      let bftStart = firstPointWhere(boundary, () => true)!;

      // traverse the contiguous boundary points breadth-first
      // starting at the random point until we cannot traverse any further.
      const visited = breadthFirstTraversal(
        new THREE.Vector2(bftStart[0], bftStart[1]),
        (pos) =>
          hasPoint(boundary, pos.x, pos.y) &&
          pos.x >= 0 &&
          pos.y >= 0 &&
          pos.x < state.rendererState.pixelSize.x &&
          pos.y < state.rendererState.pixelSize.y,
        // for this breadth-first traversal we can walk diagonally because
        // border pixels diagonal to eachother are still considered
        // contiguous
        kDiagonalAdjacency
      );

      // if we didn't visit all of the points in the boundary
      // container, that implies that there were more than one
      // new contiguous boundaries drawn on the effected segment.
      if (visited.size < boundary.size) {
        // we will create a new segment and flood fill the effected
        // segment breadth-first starting from our initial random
        // point.
        // if the active segment is -1, we don't need to increment
        // segments on the first split.
        if (firstSplitDone || actionState.activeSegment !== -1) {
          incrementSegments(state);
        } else {
          firstSplitDone = true;
        }
        const newSegment = state.segmentMap.size;
        const fillVisited = breadthFirstTraversal(
          new THREE.Vector2(bftStart[0], bftStart[1]),
          (pos, exitLoop) => {
            if (
              getSegment(state, pos) === segment[0] &&
              pos.x >= 0 &&
              pos.y >= 0 &&
              pos.x < state.rendererState.pixelSize.x &&
              pos.y < state.rendererState.pixelSize.y
            ) {
              // if we encounter any boundary points, we will remove
              // them from the boundary container. This prevents further
              // calculation against any disconnected boundary points
              // that also form a boundary for the new segment we are drawing.
              deletePoint(boundary, pos.x, pos.y);

              // if we have removed all of the boundary points, we can exit
              // early.
              if (boundary.size === 0) {
                exitLoop();
              }
              return true;
            }
            return false;
          },
          kAdjacency
        );

        // if we exited the loop early then we have finished splitting the
        // segment and thus we can continue to the next effected segment.
        // otherwise, we need to now fill all of the visited pixels.
        if (boundary.size > 0) {
          const sum = new THREE.Vector2();

          forEachPoint(fillVisited, (x, y) => {
            const pos = new THREE.Vector2(x, y);
            sum.add(pos);

            // for each point we flood filled, we will update the
            // action history for undo/redo if we have not already
            // painted it previously during this action
            if (!hasPoint(actionState.historyAction.paintedPoints, x, y)) {
              setPoint(actionState.historyAction.paintedPoints, x, y, {
                newSegment: newSegment,
                oldSegment: segment[0],
              });
            }

            setSegment(state, pos, newSegment, null);
          });

          // update the statistics
          state.updateStatistics({
            type: "update",
            sum: sum,
            numPoints: fillVisited.size,
            oldSegment: segment[0],
            drawingLayer: state,
            newSegment,
          });
        }
      } else {
        forEachPoint(visited, (x, y) => {
          // remove the visited points from the boundary so
          // we dont revisit them.
          deletePoint(boundary, x, y);
        });
      }
    }
  }
}

/**
 * Updates a pixel value from one segment to another, then computes updates to
 * any segment boundaries. If a boundary point is created, it is added to the
 * action's effectedSegments so it can be used to determine if a segment needs
 * to be split. If no action is provided, the segment boundaries are still computed
 * but not recorded.
 *
 * This method will also update the shader uniforms to reflect changes.
 *
 * the segment is a 1-based index
 */
export function setSegment(
  state: DrawingLayer,
  pos: THREE.Vector2,
  segment: number,
  effectedSegments: Map<number, { newBoundaryPoints: PointContainer }> | null
) {
  // the segment we are overwriting
  const oldSegment = getSegment(state, pos);

  // early return if we are not actually changing the segment
  if (oldSegment === segment) {
    return;
  }

  // update the segment buffer (this is a flattened 2D array row-major)
  state.segmentBuffer[pos.y * state.rendererState.pixelSize.x + pos.x] =
    segment;

  // get adjacent points (clamped by resolution)
  const adjacent = kAdjacency
    .map((offsets) =>
      pos.clone().add(new THREE.Vector2(offsets[0], offsets[1]))
    )
    .filter(
      (neighbor) =>
        neighbor.x >= 0 &&
        neighbor.y >= 0 &&
        neighbor.x < state.rendererState.pixelSize.x &&
        neighbor.y < state.rendererState.pixelSize.y
    );

  // if we are overwriting a segment, we need to update the
  // old segments boundary points. Updates done here need to be
  // reported to the action argument if it is provided through the
  // effectedSegments map.
  if (oldSegment !== -1 && segment !== oldSegment) {
    if (!state.segmentMap.has(oldSegment)) {
      console.log("old segment does not exist", oldSegment);
      console.log(state);
    }
    const oldSegmentEntry = state.segmentMap.get(oldSegment)!;
    const point = getPoint(oldSegmentEntry.points, pos.x, pos.y)!;
    // if this point used to be a boundary point, we need to remove it
    // from the effectedSegments map in case we previously added it.
    // the effectedSegments map is meant to represent just the new
    // boundary points created at the end of this action.
    if (point.numNeighbors < 4 && effectedSegments) {
      let effectedSegment = effectedSegments.get(oldSegment);
      // create the data for this segment if it wasn't already created
      if (effectedSegment) {
        deletePoint(effectedSegment.newBoundaryPoints, pos.x, pos.y);
      }
    }

    // remove the point from the old segment's point container
    deletePoint(oldSegmentEntry.points, pos.x, pos.y);

    // each neighboring point (adjacent point of the old segment) is now
    // a boundary point, so we need to update the shader uniforms to highlight
    // them and also update the point container to reflect that they now have
    // 1 less neighbor (thus making them boundary points)
    for (let neighbor of adjacent.filter(
      (neighbor) => getSegment(state, neighbor) === oldSegment
    )) {
      const neighborEntry = getPoint(
        oldSegmentEntry.points,
        neighbor.x,
        neighbor.y
      )!;
      if (neighborEntry.numNeighbors === 4) {
        // this pixel used to not be a boundary pixel, but now it is.
        // update the shader uniforms to reflect this.
        fillPixel(
          state.rendererState,
          neighbor,
          kDrawAlpha + kBorderAlphaBoost,
          oldSegmentEntry.color
        );
        // if there as an action argument passed in, we need to update the
        // effectedSegments map to reflect that this pixel is now a boundary
        // pixel.
        if (effectedSegments) {
          let effectedSegment = effectedSegments.get(oldSegment);
          // create the data for this segment if it wasn't already created
          if (!effectedSegment) {
            effectedSegment = {
              newBoundaryPoints: {
                size: 0,
                points: new Map(),
              },
            };
            effectedSegments.set(oldSegment, effectedSegment);
          }
          setPoint(
            effectedSegment.newBoundaryPoints,
            neighbor.x,
            neighbor.y,
            null
          );
        }
      }
      // update the point container to reflect that this pixel now has 1 less
      // neighbor.
      setPoint(oldSegmentEntry.points, neighbor.x, neighbor.y, {
        numNeighbors: neighborEntry ? neighborEntry.numNeighbors - 1 : 0,
      });
    }
  }

  if (segment === -1 && oldSegment !== -1) {
    // we are erasing a segment, so we need to update the shader uniforms
    fillPixel(state.rendererState, pos, 0, new THREE.Color());
  } else if (segment !== -1) {
    const color = state.segmentMap.get(segment)!.color;
    const segmentEntry = state.segmentMap.get(segment)!;

    // get all of the adjacent pixels that are in the same segment
    const inSegmentNeighbors = adjacent.filter(
      (neighbor) => getSegment(state, neighbor) === segment
    );

    // update this pixel's point container entry to reflect that it has
    // the number of neighbors found above.
    setPoint(segmentEntry.points, pos.x, pos.y, {
      numNeighbors: inSegmentNeighbors.length,
    });

    // update the shader uniforms to reflect that this pixel is now
    // part of the segment (applying a boost if it is a boundary pixel)
    fillPixel(
      state.rendererState,
      pos,
      kDrawAlpha + (inSegmentNeighbors.length < 4 ? kBorderAlphaBoost : 0.0),
      color
    );

    // update each neighbor
    for (let neighbor of inSegmentNeighbors) {
      const newNumNeighbors =
        getPoint(segmentEntry.points, neighbor.x, neighbor.y)!.numNeighbors + 1;
      setPoint(segmentEntry.points, neighbor.x, neighbor.y, {
        numNeighbors: newNumNeighbors,
      });
      // if this point used to be a boundary point, and it now has 4 neighbors,
      // we should update the shader uniforms to reflect that it is no longer
      // a boundary point.
      if (newNumNeighbors === 4) {
        fillPixel(
          state.rendererState,
          neighbor,
          kDrawAlpha,
          segmentEntry.color
        );
      }
    }
  }
}

/**
 * Resets the drawing layer with a new renderer state reference.
 */
type Reset = {
  type: "reset";
  rendererState: RendererState;
};

export type DrawingLayerEvent = Reset;

/**
 * The drawing layer reducer is responsible for resetting the drawing
 * layer state.
 */
export function drawingLayerReducer(
  state: DrawingLayer,
  event: DrawingLayerEvent
): DrawingLayer {
  switch (event.type) {
    case "reset":
      return initialState(event.rendererState, state.updateStatistics);
  }
}
