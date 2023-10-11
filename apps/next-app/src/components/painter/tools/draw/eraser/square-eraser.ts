import * as THREE from "three";
import { drawSquare } from "../../utils";
import { eraserTool } from "./eraser";
import { DrawTool } from "../draw";

function paint(
  fill: (pos: THREE.Vector2) => void,
  pos: THREE.Vector2,
  resolution: THREE.Vector2,
  length: number
): void {
  return drawSquare({
    fill,
    resolution,
    pos,
    length,
  });
}

export type SquareEraser = DrawTool<"Square Eraser">;

export function squareEraser(length: number): SquareEraser {
  return eraserTool("Square Eraser", length, (fill, size, pos, resolution) =>
    paint(fill, pos, resolution, size)
  );
}
