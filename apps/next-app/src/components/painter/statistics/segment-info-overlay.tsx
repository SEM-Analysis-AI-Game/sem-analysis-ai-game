"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { useStatistics } from ".";
import { SegmentDisplay } from "./segment-display";
import { useControls } from "../controls";

export function SegmentInfoOverlay(props: {
  padding: THREE.Vector2;
  canvasSize: THREE.Vector2;
  backgroundResolution: THREE.Vector2;
}): JSX.Element {
  const [statistics] = useStatistics();

  const [controls] = useControls();

  const centroidWidgets = useMemo(() => {
    const meansWithZoom: Map<number, THREE.Vector2> = new Map();
    for (let [segment, data] of statistics.segments) {
      if (data.numPoints > 0) {
        const mean = data.centroid.clone();
        const meanWithZoom = mean
          .clone()
          .multiplyScalar(2)
          .sub(props.backgroundResolution)
          .multiplyScalar(Math.sqrt(controls.zoom))
          .add(props.backgroundResolution)
          .divideScalar(2);
        if (
          meanWithZoom.x >= 0 &&
          meanWithZoom.y >= 0 &&
          meanWithZoom.x <= props.backgroundResolution.x &&
          meanWithZoom.y <= props.backgroundResolution.y
        ) {
          meansWithZoom.set(segment, meanWithZoom);
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
        <SegmentDisplay
          key={segment}
          segment={segment}
          canvasSize={props.canvasSize}
          position={centroid
            .clone()
            .multiply(
              props.canvasSize.clone().divide(props.backgroundResolution)
            )}
        />
      );
    }

    return widgets;
  }, [statistics, controls.zoom]);

  return (
    <div
      className={`absolute ${controls.cursorDown ? "pointer-events-none" : ""}`}
      style={{
        width: `${props.canvasSize.x}px`,
        height: `${props.canvasSize.y}px`,
      }}
    >
      {centroidWidgets}
    </div>
  );
}
