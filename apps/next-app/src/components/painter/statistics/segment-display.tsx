import * as THREE from "three";
import { PropsWithChildren, useState } from "react";
import { useStatistics } from "./provider";
import { clamp } from "three/src/math/MathUtils.js";

const kFontScale = 0.25;

/**
 * HTML overlay for a single segment.
 */
export function SegmentDisplay(
  props: PropsWithChildren<{
    key: number;
    segment: number;
    position: THREE.Vector2;
    canvasSize: THREE.Vector2;
  }>
): JSX.Element {
  const [statistics] = useStatistics();

  return (
    <div
      className="absolute z-10 -translate-x-1/2 translate-y-1/2 text-center rounded-full"
      style={{
        left: `${props.position.x}px`,
        bottom: `${props.position.y}px`,
        scale: props.position.x < 0 && props.position.y < 0 ? 0 : 1,
      }}
    >
      <button onClick={(e) => console.log(e)}>
        <h1
          style={{
            fontSize: clamp(
              Math.sqrt(statistics.segments.get(props.segment)!.numPoints) *
                kFontScale,
              12,
              28
            ),
          }}
        >
          {props.segment}
        </h1>
      </button>
    </div>
  );
}
