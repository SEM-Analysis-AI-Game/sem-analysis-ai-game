import * as THREE from "three";
import { createCirclePoints, drawMemoizedCircle } from "../../utils";
import { brushTool } from "./brush";
import { DrawTool } from "../draw";

export type CircleBrush = DrawTool<"Circle Brush"> & {
  /**
   * The points of the circle are memoized so that we don't have to
   * recalculate them every time we draw.
   */
  readonly memoizedPoints: THREE.Vector2[];
};

export function circleBrush(diameter: number): CircleBrush {
  const memoizedPoints = createCirclePoints(diameter);
  return {
    ...brushTool("Circle Brush", diameter, (fill, size, pos, resolution) =>
      paint(memoizedPoints, fill, pos, resolution, size)
    ),
    memoizedPoints,
  };
}

function paint(
  memoizedPoints: THREE.Vector2[],
  fill: (pos: THREE.Vector2) => void,
  pos: THREE.Vector2,
  resolution: THREE.Vector2,
  diameter: number
): void {
  return drawMemoizedCircle({
    fill,
    resolution,
    pos,
    diameter,
    offsets: memoizedPoints,
  });
}
