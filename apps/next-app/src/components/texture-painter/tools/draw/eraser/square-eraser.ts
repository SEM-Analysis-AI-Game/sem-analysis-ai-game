import * as THREE from "three";
import { Eraser } from "./eraser";
import { drawSquare } from "../../utils";

export class SquareEraser extends Eraser {
  readonly name = "Square Eraser";

  constructor(diameter: number) {
    super(diameter);
  }

  protected paint(
    drawPoint: (pos: THREE.Vector2) => void,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void {
    drawSquare({
      drawPoint,
      pos,
      length: size,
      resolution,
    });
  }
}
