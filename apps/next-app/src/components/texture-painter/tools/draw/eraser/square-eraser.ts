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
    return lerp(
      this.size / 2,
      Math.sqrt(this.size / 2),
      Math.abs(Math.sin(dir.angle()) * Math.cos(dir.angle())) * 2
    );
  }

  protected paint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void {
    drawSquare({
      data,
      pos,
      length: size,
      resolution,
      color: this.color,
      alpha: this.alpha,
    });
  }
}
