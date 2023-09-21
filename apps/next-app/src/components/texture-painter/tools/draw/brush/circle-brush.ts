import * as THREE from "three";
import { Brush } from "./brush";
import { drawCircle } from "../../utils";

export class CircleBrush extends Brush {
  readonly name = "Circle Brush";

  constructor(diameter: number, color: THREE.Color) {
    super(diameter, color);
  }

  protected paint(
    drawPoint: (pos: THREE.Vector2) => void,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void {
    drawCircle({
      drawPoint,
      pos,
      resolution,
      diameter: size,
    });
  }
}
