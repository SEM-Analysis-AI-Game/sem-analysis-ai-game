import * as THREE from "three";
import { Eraser } from "./eraser";
import { drawSquare } from "../../utils";

export class SquareEraser extends Eraser {
  readonly name = "Square Eraser";

  constructor(diameter: number) {
    super(diameter);
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
