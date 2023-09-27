import * as THREE from "three";
import { Brush } from "./brush";
import { drawCircle } from "../../utils";

export class CircleBrush extends Brush {
  readonly name = "Circle Brush";

  constructor(diameter: number, color: THREE.Color) {
    super(diameter, color);
  }

  protected widthInDirection(): number {
    return Math.round(this.size / 2);
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
