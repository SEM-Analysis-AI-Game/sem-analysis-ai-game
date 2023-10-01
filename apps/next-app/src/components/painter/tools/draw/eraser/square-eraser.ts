import { Vector2 } from "three";
import { Eraser } from "./eraser";
import { drawSquare } from "../../utils";

export class SquareEraser extends Eraser {
  readonly name = "Square Eraser";

  constructor(color: THREE.Color, diameter: number) {
    super(color, diameter);
  }

  protected paint(params: {
    fill: (pos: Vector2) => void;
    size: number;
    pos: Vector2;
    resolution: Vector2;
  }): void {
    return drawSquare({
      ...params,
      length: this.size,
    });
  }
}
