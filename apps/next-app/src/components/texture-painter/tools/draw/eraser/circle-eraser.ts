import * as THREE from "three";
import { Eraser } from "./eraser";
import { drawCircleDirect, drawCircleLayered } from "../../utils";

export class CircleEraser extends Eraser {
  readonly name = "Circle Eraser";

  constructor(diameter: number) {
    super(diameter);
  }

  protected widthInDirection(): number {
    return Math.floor(this.size / 2);
  }

  protected directPaint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2,
    alpha: number
  ): void {
    drawCircleDirect(data, pos, size, resolution, this.color, alpha);
  }

  protected paint(
    drawings: Uint8Array[],
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): Set<number> {
    return drawCircleLayered(
      drawings,
      pos,
      size,
      resolution,
      this.color,
      this.alpha
    );
  }
}
