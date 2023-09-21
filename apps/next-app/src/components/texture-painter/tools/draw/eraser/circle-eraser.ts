import * as THREE from "three";
import { Eraser } from "./eraser";
import { drawCircle } from "../../utils";

export class CircleEraser extends Eraser {
  readonly name = "Circle Eraser";

  constructor(diameter: number) {
    super(diameter);
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
