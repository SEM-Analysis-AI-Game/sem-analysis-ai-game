import * as THREE from "three";

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
  oldSegment: number;
  newSegment: number;
  src: string;
};

/**
 * Clear the statistics map.
 */
type Clear = {
  type: "clear";
};

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
        if (newSegmentEntry.numPoints < 0) {
          throw new Error(event.src);
        }
      }

      if (event.oldSegment !== -1) {
        let oldSegmentEntry = segments.get(event.oldSegment)!;
        oldSegmentEntry.centroid
          .multiplyScalar(oldSegmentEntry.numPoints)
          .sub(event.sum)
          .divideScalar(oldSegmentEntry.numPoints - event.numPoints);
        oldSegmentEntry.numPoints -= event.numPoints;
        if (oldSegmentEntry.numPoints < 0) {
          throw new Error(event.src);
        }
      }

      return { segments };
  }
}
