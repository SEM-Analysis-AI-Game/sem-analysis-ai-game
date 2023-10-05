"use client";

import { useMemo } from "react";
import { useStatistics } from "../statistics";

export function SegmentInfo(): JSX.Element {
  const [statistics] = useStatistics();

  const centroids = useMemo(() => {
    const res: Map<number, THREE.Vector2> = new Map();
    for (let [segment, data] of statistics.segments) {
      res.set(segment, data.positionSums.clone().divideScalar(data.numPoints));
    }
    return res;
  }, [statistics]);

  return <></>;
}
