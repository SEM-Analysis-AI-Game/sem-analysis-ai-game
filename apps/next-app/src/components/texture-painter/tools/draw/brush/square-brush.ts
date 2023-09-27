import * as THREE from "three";
import { Brush } from "./brush";
import { drawSquareDirect, drawSquareLayered } from "../../utils";
import { lerp } from "three/src/math/MathUtils.js";

export class SquareBrush extends Brush {
  readonly name = "Square Brush";

  constructor(diameter: number, color: THREE.Color) {
    super(diameter, color);
  }

  protected widthInDirection(dir: THREE.Vector2): number {
    return Math.round(
      lerp(
        this.size / 2,
        this.size / Math.sqrt(2),
        Math.abs(Math.sin(dir.angle()) * Math.cos(dir.angle())) * 2
      )
    );
  }

  protected directPaint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void {
    drawSquareDirect(data, pos, size, resolution, this.color, this.alpha);
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
