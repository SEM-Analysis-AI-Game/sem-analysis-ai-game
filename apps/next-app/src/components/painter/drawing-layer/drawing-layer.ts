import * as THREE from "three";
import { CanvasAction } from "../action-history";
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
import { DrawingLayerUniforms } from "./uniforms";
import { kDrawAlpha } from "../tools";
import { Dispatch } from "react";
import { StatisticsEvent } from "../statistics";

// The alpha is boosted by this amount when a pixel is on the border of a segment.
const kBorderAlphaBoost = 0.5;

/**
 * The drawing layer is responsible for updating shader uniforms and
 * tracking drawn segments. Segments are given 1-based indexes.
 */
export type DrawingLayer = {
  readonly pixelSize: THREE.Vector2;

  /**
   * all of the shader uniform data is stored in this class
   */
  readonly uniforms: DrawingLayerUniforms;

  /**
   * the segment buffer stores the segment ID (1-indexed) for each
   * pixel as a flattened 2D array (row-major). A -1 indicates that no
   * segment has been drawn at that pixel.
   */
  readonly segmentBuffer: Int32Array;

  /**
   * the segment map stores the color and points for each segment
   * the number of neighbors (adjacent pixels of the same segment)
   * each point has is stored in the point container. If a point
   * has < 4 neighbors, it is on the boundary of the segment.
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

  /**
   * The segment currently being drawn
   */
  activeSegment: number;
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
  pixelSize: THREE.Vector2,
  updateStatistics: Dispatch<StatisticsEvent>
): DrawingLayer {
  return {
    updateStatistics,
    pixelSize,
    segmentMap: new Map(),
    segmentBuffer: new Int32Array(pixelSize.x * pixelSize.y).fill(-1),
    uniforms: new DrawingLayerUniforms(pixelSize),
    activeSegment: -1,
  };
}

/**
 * Gets the segment index (1-based) for a given pixel.
 */
export function getSegment(
  drawingLayer: DrawingLayer,
  pos: THREE.Vector2
): number {
  return drawingLayer.segmentBuffer[pos.y * drawingLayer.pixelSize.x + pos.x];
}

const kAdjacency = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as [number, number][];

/**
 * Given an action, finds and applies splits in segments
 * that were effected by the action. The splits are
 * written to the action's paintedPoints so they can
 * be undone.
 */
export function recomputeSegments(
  state: DrawingLayer,
  action: CanvasAction
): void {
  for (let segment of action.effectedSegments) {
    // these are all of the newly drawn boundary points
    // that were created by the action on the effected
    // segment
    const boundary = segment[1].newBoundaryPoints;

    // we will be removing points from the boundary container
    // and iterating until it is empty.
    while (boundary.size > 0) {
      // find a random point in the boundary container
      let bfsStart = firstPointWhere(boundary, () => true)!;

      // traverse the contiguous boundary points breadth-first
      // starting at the random point until we cannot traverse any further.
      const visited = breadthFirstTraversal(
        new THREE.Vector2(bfsStart[0], bfsStart[1]),
        (pos) =>
          hasPoint(boundary, pos.x, pos.y) &&
          pos.x >= 0 &&
          pos.y >= 0 &&
          pos.x < state.pixelSize.x &&
          pos.y < state.pixelSize.y,
        // for this breadth-first traversal we can walk diagonally because
        // border pixels diagonal to eachother are still considered
        // contiguous
        [...kAdjacency, [-1, -1], [1, -1], [-1, 1], [1, 1]]
      );

      // if we didn't visit all of the points in the boundary
      // container, that implies that there were more than one
      // new contiguous boundaries drawn on the effected segment.
      if (visited.size < boundary.size) {
        // we will create a new segment and flood fill the effected
        // segment breadth-first starting from our initial random
        // point.
        incrementSegments(state);
        const newSegment = state.segmentMap.size;
        const fillVisited = breadthFirstTraversal(
          new THREE.Vector2(bfsStart[0], bfsStart[1]),
          (pos, exitLoop) => {
            if (
              getSegment(state, pos) === segment[0] &&
              pos.x >= 0 &&
              pos.y >= 0 &&
              pos.x < state.pixelSize.x &&
              pos.y < state.pixelSize.y
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
          forEachPoint(fillVisited, (x, y) => {
            // for each point we flood filled, we will update the
            // action history for undo/redo if we have not already
            // painted it previously during this action
            if (!hasPoint(action.paintedPoints, x, y)) {
              setPoint(action.paintedPoints, x, y, {
                newSegment: newSegment,
                oldSegment: segment[0],
              });
            }

            // update the segment statistics for the new segment and the old
            state.updateStatistics({
              type: "update",
              oldSegment: segment[0],
              pos: new THREE.Vector2(x, y),
              newSegment,
            });

            // update the flood-filled pixels in the drawing layer
            setSegment(state, new THREE.Vector2(x, y), newSegment);
          });
        }
      } else {
        forEachPoint(visited, (x, y) => {
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
  action?: CanvasAction
): void {
  // the segment we are overwriting
  const oldSegment = getSegment(state, pos);

  // early return if we are not actually changing the segment
  if (oldSegment == segment) {
    return;
  }

  state.updateStatistics({
    type: "update",
    newSegment: segment,
    oldSegment,
    pos,
  });

  // update the segment buffer (this is a flattened 2D array row-major)
  state.segmentBuffer[pos.y * state.pixelSize.x + pos.x] = segment;

  // get adjacent points (clamped by resolution)
  const adjacent = kAdjacency
    .map((offsets) =>
      pos.clone().add(new THREE.Vector2(offsets[0], offsets[1]))
    )
    .filter(
      (neighbor) =>
        neighbor.x >= 0 &&
        neighbor.y >= 0 &&
        neighbor.x < state.pixelSize.x &&
        neighbor.y < state.pixelSize.y
    );

  // if we are overwriting a segment, we need to update the
  // old segments boundary points. Updates done here need to be
  // reported to the action argument if it is provided through the
  // effectedSegments map.
  if (oldSegment !== -1 && segment !== oldSegment) {
    const oldSegmentEntry = state.segmentMap.get(oldSegment)!;
    const point = getPoint(oldSegmentEntry.points, pos.x, pos.y)!;
    // if this point used to be a boundary point, we need to remove it
    // from the effectedSegments map in case we previously added it.
    // the effectedSegments map is meant to represent just the new
    // boundary points created at the end of this action.
    if (point.numNeighbors < 4 && action) {
      let effectedSegment = action.effectedSegments.get(oldSegment);
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
        state.uniforms.fillPixel(
          neighbor.x,
          neighbor.y,
          kDrawAlpha + kBorderAlphaBoost,
          oldSegmentEntry.color
        );
        // if there as an action argument passed in, we need to update the
        // effectedSegments map to reflect that this pixel is now a boundary
        // pixel.
        if (action) {
          let effectedSegment = action.effectedSegments.get(oldSegment);
          // create the data for this segment if it wasn't already created
          if (!effectedSegment) {
            effectedSegment = {
              newBoundaryPoints: {
                size: 0,
                points: new Map(),
              },
            };
            action.effectedSegments.set(oldSegment, effectedSegment);
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
    state.uniforms.fillPixel(pos.x, pos.y, 0, new THREE.Color());
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
    state.uniforms.fillPixel(
      pos.x,
      pos.y,
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
        state.uniforms.fillPixel(
          neighbor.x,
          neighbor.y,
          kDrawAlpha,
          segmentEntry.color
        );
      }
    }
  }
}

type Reset = {
  type: "reset";
  pixelSize: THREE.Vector2;
};

export type DrawingLayerEvent = Reset;

export function drawingLayerReducer(
  state: DrawingLayer,
  event: DrawingLayerEvent
): DrawingLayer {
  switch (event.type) {
    case "reset":
      return initialState(event.pixelSize, state.updateStatistics);
  }
}
