import * as THREE from "three";
import { Eraser } from "./eraser";
import { drawSquareDirect, drawSquareLayered } from "../../utils";

export class SquareEraser extends Eraser {
  readonly name = "Square Eraser";

  constructor(diameter: number) {
    super(diameter);
  }

  protected directPaint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2,
    alpha: number
  ): void {
    drawSquareDirect(data, pos, size, resolution, this.color, alpha);
  }

  protected paint(
    drawings: Uint8Array[],
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): Set<number> {
    return drawSquareLayered(
      drawings,
      pos,
      size,
      resolution,
      this.color,
      this.alpha
    );
  }
}
