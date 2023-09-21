import * as THREE from "three";
import { Brush } from "./brush";
import { drawSquare } from "../../utils";

export class SquareBrush extends Brush {
  readonly name = "Square Brush";

  constructor(diameter: number, color: THREE.Color) {
    super(diameter, color);
  }

  protected paint(
    drawPoint: (pos: THREE.Vector2) => void,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void {
    drawSquare({
      drawPoint,
      pos,
      resolution,
      length: size,
    });
  }
}
