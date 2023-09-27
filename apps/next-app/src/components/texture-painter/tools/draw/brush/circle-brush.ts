import * as THREE from "three";
import { Brush } from "./brush";
import { drawCircleDirect, drawCircleLayered } from "../../utils";

export class CircleBrush extends Brush {
  readonly name = "Circle Brush";

  constructor(diameter: number, color: THREE.Color) {
    super(diameter, color);
  }

  protected widthInDirection(): number {
    return Math.round(this.size / 2);
  }

  protected directPaint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void {
    drawCircleDirect(data, pos, size, resolution, this.color, this.alpha);
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
