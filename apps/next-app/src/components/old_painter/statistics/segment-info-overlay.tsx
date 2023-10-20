"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { useStatistics } from ".";
import { SegmentDisplay } from "./segment-display";
import { useControls } from "../controls";

/**
 * Displays a collection of segments overlayed over the canvas.
 */
export function SegmentInfoOverlay(props: {
  canvasSize: THREE.Vector2;
  backgroundResolution: THREE.Vector2;
}): JSX.Element {
  const [statistics] = useStatistics();

  const [controls] = useControls();

  const segmentWidgets = useMemo(() => {
    const mediansWithZoom: Map<number, THREE.Vector2> = new Map();
    for (let [segment, data] of statistics.segments) {
      if (data.numPoints > 0) {
        const median = data.centroid.clone();
        const medianWithZoomAndPan = median
          .clone()
          .sub(
            controls.pan
              .clone()
              .divideScalar(2)
              .multiply(props.backgroundResolution)
          )
          .sub(props.backgroundResolution.clone().divideScalar(2))
          .multiplyScalar(Math.sqrt(controls.zoom))
          .add(props.backgroundResolution.clone().divideScalar(2));
        if (
          medianWithZoomAndPan.x >= 0 &&
          medianWithZoomAndPan.y >= 0 &&
          medianWithZoomAndPan.x <= props.backgroundResolution.x &&
          medianWithZoomAndPan.y <= props.backgroundResolution.y
        ) {
          mediansWithZoom.set(segment, medianWithZoomAndPan);
        } else {
          mediansWithZoom.set(segment, new THREE.Vector2(-1, -1));
        }
      } else {
        mediansWithZoom.set(segment, new THREE.Vector2(-1, -1));
      }
    }

    const widgets: JSX.Element[] = [];

    for (let [segment, centroid] of mediansWithZoom) {
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
  }, [statistics, controls]);

  return (
    <div
      className={`absolute ${controls.cursorDown ? "pointer-events-none" : ""}`}
      style={{
        width: `${props.canvasSize.x}px`,
        height: `${props.canvasSize.y}px`,
      }}
    >
      {segmentWidgets}
    </div>
  );
}
