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
  padding: THREE.Vector2;
  canvasSize: THREE.Vector2;
  backgroundResolution: THREE.Vector2;
}): JSX.Element {
  const [statistics] = useStatistics();

  const [controls] = useControls();

  const segmentWidgets = useMemo(() => {
    const mediansWithZoom: Map<number, THREE.Vector2> = new Map();
    for (let [segment, data] of statistics.segments) {
      if (data.numPoints > 0) {
        const median = data.medianEstimate.clone();
        const medianWithZoom = median
          .clone()
          .multiplyScalar(2)
          .sub(props.backgroundResolution)
          .multiplyScalar(Math.sqrt(controls.zoom))
          .add(props.backgroundResolution)
          .divideScalar(2);
        if (
          medianWithZoom.x >= 0 &&
          medianWithZoom.y >= 0 &&
          medianWithZoom.x <= props.backgroundResolution.x &&
          medianWithZoom.y <= props.backgroundResolution.y
        ) {
          mediansWithZoom.set(segment, medianWithZoom);
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
            )
          }
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
      {segmentWidgets}
    </div>
  );
}
