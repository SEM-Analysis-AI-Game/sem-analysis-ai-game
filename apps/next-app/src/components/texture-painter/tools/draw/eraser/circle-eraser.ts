import * as THREE from "three";
import { Eraser } from "./eraser";
import { drawCircle } from "../../utils";

export class CircleEraser extends Eraser {
  readonly name = "Circle Eraser";

  constructor(diameter: number) {
    super(diameter);
  }

  protected widthInDirection(dir: THREE.Vector2): number {
    return this.size / 2;
  }

  protected paint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void {
    drawCircle({
      data,
      pos,
      resolution,
      diameter: size,
      color: this.color,
      alpha: this.alpha,
    });
  }
}
