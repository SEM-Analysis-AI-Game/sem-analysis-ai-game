import * as THREE from "three";
import { drawSquare } from "../../utils";
import { brushTool } from "./brush";
import { DrawTool } from "../draw";

export type SquareBrush = DrawTool<"Square Brush">;

export function squareBrush(length: number): SquareBrush {
  return brushTool("Square Brush", length, (fill, size, pos, resolution) =>
    paint(fill, pos, resolution, size)
  );
}

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
