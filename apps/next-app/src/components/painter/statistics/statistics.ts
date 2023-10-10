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

export class StatisticsUpdate {
  readonly x: number;
  readonly y: number;
  readonly oldSegment: number;
  readonly newSegment: number;

  constructor(x: number, y: number, oldSegment: number, newSegment: number) {
    this.x = x;
    this.y = y;
    this.oldSegment = oldSegment;
    this.newSegment = newSegment;
  }
}

export class StatisticsClear {
  constructor() {}
}

export function statisticsReducer(
  state: PainterStatistics,
  update: StatisticsUpdate | StatisticsClear
): PainterStatistics {
  if (update instanceof StatisticsClear) {
    return {
      segments: new Map(),
    };
  } else if (update instanceof StatisticsUpdate) {
    const segments = state.segments;
    if (update.newSegment !== -1) {
      let newSegmentEntry = segments.get(update.newSegment);
      if (!newSegmentEntry) {
        newSegmentEntry = {
          numPoints: 0,
          centroid: new THREE.Vector2(),
          medianEstimate: new THREE.Vector2(),
        };
        segments.set(update.newSegment, newSegmentEntry);
      }
      if (newSegmentEntry.numPoints > 0) {
        newSegmentEntry.centroid
          .multiplyScalar(newSegmentEntry.numPoints)
          .add(new THREE.Vector2(update.x, update.y))
          .divideScalar(newSegmentEntry.numPoints + 1);
      } else {
        newSegmentEntry.centroid.set(update.x, update.y);
      }
      newSegmentEntry.numPoints++;
    }

    if (update.oldSegment !== -1) {
      let oldSegmentEntry = segments.get(update.oldSegment);
      if (!oldSegmentEntry) {
        oldSegmentEntry = {
          numPoints: 0,
          centroid: new THREE.Vector2(),
          medianEstimate: new THREE.Vector2(),
        };
        segments.set(update.oldSegment, oldSegmentEntry);
      }
      oldSegmentEntry.centroid
        .multiplyScalar(oldSegmentEntry.numPoints)
        .sub(new THREE.Vector2(update.x, update.y))
        .divideScalar(oldSegmentEntry.numPoints - 1);
      oldSegmentEntry.numPoints--;
    }
    return { segments };
  } else {
    throw new Error("Invalid statistics update");
  }
}
