import * as THREE from "three";
import { createCirclePoints, drawMemoizedCircle } from "../../utils";
import { eraserTool } from "./eraser";
import { DrawTool } from "../draw";

export type CircleEraser = DrawTool<"Circle Eraser"> & {
  /**
   * The points of the circle are memoized so that we don't have to
   * recalculate them every time we draw.
   */
  readonly memoizedPoints: THREE.Vector2[];
};

export function circleEraser(diameter: number): CircleEraser {
  const memoizedPoints = createCirclePoints(diameter);
  return {
    ...eraserTool("Circle Eraser", diameter, (fill, size, pos, resolution) =>
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
