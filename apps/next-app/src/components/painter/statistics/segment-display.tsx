import * as THREE from "three";
import { PropsWithChildren, useState } from "react";
import { useStatistics } from "./provider";

const kFontScale = 0.25;

export function SegmentDisplay(
  props: PropsWithChildren<{
    key: number;
    segment: number;
    position: THREE.Vector2;
    canvasSize: THREE.Vector2;
  }>
): JSX.Element {
  const [statistics] = useStatistics();

  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`absolute z-10 -translate-x-1/2 translate-y-1/2 text-center rounded-full ${
        props.position.x === -1 && props.position.y === -1 ? "hidden" : ""
      }`}
      style={{ left: `${props.position.x}px`, bottom: `${props.position.y}px` }}
    >
      <button onClick={(e) => console.log(e)}>
        <h1
          style={{
            fontSize: Math.max(
              Math.sqrt(statistics.segments.get(props.segment)!.numPoints) *
                kFontScale,
              12
            ),
          }}
        >
          {props.segment}
        </h1>
      </button>
    </div>
  );
}
