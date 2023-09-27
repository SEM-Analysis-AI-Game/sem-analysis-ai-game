import * as THREE from "three";
import { Eraser } from "./eraser";
import { drawSquare } from "../../utils";
import { lerp } from "three/src/math/MathUtils.js";

export class SquareEraser extends Eraser {
  readonly name = "Square Eraser";

  constructor(diameter: number) {
    super(diameter);
  }

  protected widthInDirection(dir: THREE.Vector2): number {
    return Math.floor(
      lerp(
        this.size / 2,
        this.size / Math.sqrt(2),
        Math.abs(Math.sin(dir.angle()) * Math.cos(dir.angle())) * 2
      )
    );
  }

  protected eraserPaint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2,
    alpha: number
  ): void {
    drawSquare({
      data,
      pos,
      length: size,
      resolution,
      color: this.color,
      alpha: alpha,
    });
  }
}
