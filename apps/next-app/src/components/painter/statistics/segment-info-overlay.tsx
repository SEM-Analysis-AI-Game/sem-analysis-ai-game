"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { useStatistics } from ".";
import { useCursorDown, useZoom } from "../controls";
import { SegmentDisplay } from "./segment-display";

export function SegmentInfoOverlay(props: {
  padding: THREE.Vector2;
  size: THREE.Vector2;
}): JSX.Element {
  const [statistics] = useStatistics();

  const [cursorDown] = useCursorDown();

  const [zoom] = useZoom();

  const centroidWidgets = useMemo(() => {
    const meansWithZoom: Map<number, THREE.Vector2> = new Map();
    for (let [segment, data] of statistics.segments) {
      console.log(data);
      if (data.numPoints > 0) {
        const mean = data.centroid.clone();
        const mouseWithZoom = mean
          .clone()
          .multiplyScalar(2)
          .sub(props.size)
          .multiplyScalar(Math.sqrt(zoom))
          .add(props.size)
          .divideScalar(2);
        if (
          mouseWithZoom.x >= 0 &&
          mouseWithZoom.y >= 0 &&
          mouseWithZoom.x <= props.size.x &&
          mouseWithZoom.y <= props.size.y
        ) {
          meansWithZoom.set(segment, mouseWithZoom);
        } else {
          meansWithZoom.set(segment, new THREE.Vector2(-1, -1));
        }
      } else {
        meansWithZoom.set(segment, new THREE.Vector2(-1, -1));
      }
    }

    const widgets: JSX.Element[] = [];

    for (let [segment, centroid] of meansWithZoom) {
      widgets.push(
        <SegmentDisplay key={segment} segment={segment} position={centroid} />
      );
    }

    return widgets;
  }, [statistics, zoom]);

  return (
    <div
      className={`absolute ${cursorDown ? "pointer-events-none" : ""}`}
      style={{
        width: `${props.size.x}px`,
        height: `${props.size.y}px`,
      }}
    >
      {centroidWidgets}
    </div>
  );
}
