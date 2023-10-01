import { drawCircle } from "../../utils";
import { Eraser } from "./eraser";

export class CircleEraser extends Eraser {
  readonly name = "Circle Eraser";

  constructor(color: THREE.Color, diameter: number) {
    super(color, diameter);
  }

  protected paint(params: {
    fill: (pos: THREE.Vector2) => void;
    size: number;
    pos: THREE.Vector2;
    resolution: THREE.Vector2;
  }): void {
    return drawCircle({
      ...params,
      diameter: this.size,
    });
  }
}
