import * as THREE from "three";
import { Brush } from "./brush";
import { drawCircle } from "../../utils";

export class CircleBrush extends Brush {
  readonly name = "Circle Brush";

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
    drawCircle(data, {
      pos,
      resolution,
      diameter: size,
      fillPoint: () => ({ color, alpha }),
    });
  }
}
