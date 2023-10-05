"use client";

import { useMemo } from "react";
import { useStatistics } from ".";

export function SegmentInfo(props: {
  padding: THREE.Vector2;
  size: THREE.Vector2;
}): JSX.Element {
  const [statistics] = useStatistics();

  const centroidWidgets = useMemo(() => {
    const centroids: Map<number, THREE.Vector2> = new Map();
    for (let [segment, data] of statistics.segments) {
      if (data.numPoints > 0) {
        centroids.set(
          segment,
          data.positionSums.clone().divideScalar(data.numPoints)
        );
      }
    }

    const widgets: JSX.Element[] = [];

    for (let [segment, centroid] of centroids) {
      widgets.push(
        <h1
          className="absolute z-10 -translate-x-1/2 translate-y-1/2 text-2xl text-center rounded-full"
          key={segment}
          style={{ left: `${centroid.x}px`, bottom: `${centroid.y}px` }}
        >
          {segment}
        </h1>
      );
    }

    return widgets;
  }, [statistics]);

  return (
    <div
      className="absolute"
      style={{
        width: `${props.size.x}px`,
        height: `${props.size.y}px`,
        left: `${props.padding.x}px`,
        bottom: `${props.padding.y}px`,
      }}
    >
      {centroidWidgets}
    </div>
  );
}
