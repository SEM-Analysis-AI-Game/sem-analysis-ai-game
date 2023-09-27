import * as THREE from "three";
import { Brush } from "./brush";
import { drawSquareDirect, drawSquareLayered } from "../../utils";

export class SquareBrush extends Brush {
  readonly name = "Square Brush";

  constructor(diameter: number, color: THREE.Color) {
    super(diameter, color);
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
    const res = drawSquareLayered(
      drawings,
      pos,
      size,
      resolution,
      this.color,
      this.alpha
    );
    return res;
  }
}
