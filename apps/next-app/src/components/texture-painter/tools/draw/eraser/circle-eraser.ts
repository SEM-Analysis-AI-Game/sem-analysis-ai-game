import * as THREE from "three";
import { Eraser } from "./eraser";
import { drawCircle } from "../../utils";

export class CircleEraser extends Eraser {
  readonly name = "Circle Eraser";

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
    drawCircle(data, {
      pos,
      resolution,
      diameter: size,
      fillPoint: () => ({ color, alpha }),
    });
  }
}
