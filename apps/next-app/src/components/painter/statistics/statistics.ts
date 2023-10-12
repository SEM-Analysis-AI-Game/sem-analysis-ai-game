import * as THREE from "three";

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

type Update = {
  type: "update";
  pos: THREE.Vector2;
  numPoints: number;
  oldSegment: number;
  newSegment: number;
};

type Clear = {
  type: "clear";
};

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
            medianEstimate: new THREE.Vector2(),
          };
          segments.set(event.newSegment, newSegmentEntry);
        }
        if (newSegmentEntry.numPoints > 0) {
          newSegmentEntry.centroid
            .multiplyScalar(newSegmentEntry.numPoints)
            .add(event.pos)
            .divideScalar(newSegmentEntry.numPoints + event.numPoints);
        } else {
          newSegmentEntry.centroid = event.pos
            .clone()
            .divideScalar(event.numPoints);
        }
        newSegmentEntry.numPoints += event.numPoints;
      }

      if (event.oldSegment !== -1) {
        let oldSegmentEntry = segments.get(event.oldSegment);
        if (!oldSegmentEntry) {
          oldSegmentEntry = {
            numPoints: 0,
            centroid: new THREE.Vector2(),
            medianEstimate: new THREE.Vector2(),
          };
          segments.set(event.oldSegment, oldSegmentEntry);
        }
        oldSegmentEntry.centroid
          .multiplyScalar(oldSegmentEntry.numPoints)
          .sub(event.pos)
          .divideScalar(oldSegmentEntry.numPoints - event.numPoints);
        oldSegmentEntry.numPoints -= event.numPoints;
      }
      return { segments };
  }
}
