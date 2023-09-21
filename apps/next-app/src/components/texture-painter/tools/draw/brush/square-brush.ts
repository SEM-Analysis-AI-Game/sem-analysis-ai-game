import * as THREE from "three";
import { Brush } from "./brush";
import { drawSquare } from "../../utils";

export class SquareBrush extends Brush {
  readonly name = "Square Brush";

  constructor(diameter: number, color: THREE.Color) {
    super(diameter, color);
  }

  protected paint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2,
    color: THREE.Color,
    alpha: number
  ): void {
    drawSquare(data, {
      pos,
      resolution,
      length: size,
      fillPoint: () => ({ color, alpha }),
    });
  }
}
