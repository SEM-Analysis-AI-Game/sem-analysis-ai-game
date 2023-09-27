import * as THREE from "three";
import { Eraser } from "./eraser";
import { drawCircle } from "../../utils";

export class CircleEraser extends Eraser {
  readonly name = "Circle Eraser";

  constructor(diameter: number) {
    super(diameter);
  }

  protected widthInDirection(): number {
    return Math.floor(this.size / 2);
  }

  protected eraserPaint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2,
    alpha: number
  ): void {
    drawCircle({
      data,
      pos,
      resolution,
      diameter: size,
      color: this.color,
      alpha: alpha,
    });
  }
}
