import * as THREE from "three";
import {
  DrawingLayer,
  breadthFirstTraversal,
  getSegment,
  kAdjacency,
} from "../drawing-layer";
import { forEachPoint } from "../point-container";

/**
 * Tracks data about the segments in the drawing layer.
 */
export type PainterStatistics = {
  segments: Map<
    number,
    {
      numPoints: number;
      centroid: THREE.Vector2;
      medianEstimate: THREE.Vector2;
    }
  >;
};

export type StatisticsEvent = Update | Clear;

/**
 * Update the statistics map with data for a collection of
 * points.
 */
type Update = {
  type: "update";
  sum: THREE.Vector2;
  numPoints: number;
  drawingLayer: DrawingLayer;
  oldSegment: number;
  newSegment: number;
};

/**
 * Clear the statistics map.
 */
type Clear = {
  type: "clear";
};

/**
 * The preferred number of pixels padding from the boundary for a median estimate.
 */
const kMedianPadding = 40;

function estimateMedian(
  drawingLayer: DrawingLayer,
  centroid: THREE.Vector2,
  segment: number
): THREE.Vector2 {
  // first we will the nearest point in the segment to the centroid
  const bestPoint = new THREE.Vector2(-1, -1);

  // if the centroid is not in the segment, we need to find an estimate
  if (getSegment(drawingLayer, bestPoint) !== segment) {
    let bestPointNeighbors = -1;
    forEachPoint(drawingLayer.segmentMap.get(segment)!.points, (x, y, data) => {
      const pos = new THREE.Vector2(x, y);
      if (pos.distanceTo(centroid) < bestPoint.distanceTo(centroid)) {
        bestPointNeighbors = data.numNeighbors;
        bestPoint.copy(pos);
      }
    });
    if (bestPointNeighbors < 4) {
      // the estimate will be on a boundary point, so we need to pad it
      // so that it is not on the boundary.
      // we will binary search for a padded point, this factor will be divided
      // by 2 on each iteration.
      let factor = 1.0;
      let foundValid = false;
      while (!foundValid && factor > 0.0) {
        // add padding to the boundary point in the opposite direction of the centroid
        const paddedBest = bestPoint
          .clone()
          .add(
            bestPoint
              .clone()
              .sub(centroid)
              .normalize()
              // multiply by the factor (for binary search)
              .multiplyScalar(kMedianPadding * factor)
          )
          .floor();
        // if the padded point is in the segment, we have found a valid estimate
        if (getSegment(drawingLayer, paddedBest) === segment) {
          bestPoint.copy(paddedBest);
          foundValid = true;
        } else {
          // otherwise, we need to reduce the factor and try again.
          // in the base case, this will floor the padded point to the boundary.
          factor /= 2;
        }
      }
    }
  } else {
    bestPoint.copy(centroid).floor();
  }

  return bestPoint;
}

/**
 * Returns an updated state given a previous state and an event.
 */
export function statisticsReducer(
  state: PainterStatistics,
  event: StatisticsEvent
): PainterStatistics {
  switch (event.type) {
    case "clear":
      return {
        segments: new Map(),
      };
    case "update":
      const segments = state.segments;
      if (event.newSegment !== -1) {
        let newSegmentEntry = segments.get(event.newSegment);
        if (!newSegmentEntry) {
          newSegmentEntry = {
            numPoints: 0,
            centroid: new THREE.Vector2(),
            medianEstimate: new THREE.Vector2(-1, -1),
          };
          segments.set(event.newSegment, newSegmentEntry);
        }
        if (newSegmentEntry.numPoints > 0) {
          newSegmentEntry.centroid
            .multiplyScalar(newSegmentEntry.numPoints)
            .add(event.sum)
            .divideScalar(newSegmentEntry.numPoints + event.numPoints);
        } else {
          newSegmentEntry.centroid = event.sum
            .clone()
            .divideScalar(event.numPoints);
        }
        newSegmentEntry.numPoints += event.numPoints;
        newSegmentEntry.medianEstimate = estimateMedian(
          event.drawingLayer,
          newSegmentEntry.centroid,
          event.newSegment
        );
      }

      if (event.oldSegment !== -1) {
        let oldSegmentEntry = segments.get(event.oldSegment);
        if (!oldSegmentEntry) {
          oldSegmentEntry = {
            numPoints: 0,
            centroid: new THREE.Vector2(),
            medianEstimate: new THREE.Vector2(-1, -1),
          };
          segments.set(event.oldSegment, oldSegmentEntry);
        }
        oldSegmentEntry.centroid
          .multiplyScalar(oldSegmentEntry.numPoints)
          .sub(event.sum)
          .divideScalar(oldSegmentEntry.numPoints - event.numPoints);
        oldSegmentEntry.numPoints -= event.numPoints;
        if (oldSegmentEntry.numPoints > 0) {
          oldSegmentEntry.medianEstimate = estimateMedian(
            event.drawingLayer,
            oldSegmentEntry.centroid,
            event.oldSegment
          );
        } else {
          oldSegmentEntry.medianEstimate = new THREE.Vector2(-1, -1);
        }
      }

      return { segments };
  }
}
