import { createCirclePointsInCircle, drawCircle } from "../../utils";
import { Eraser } from "./eraser";

export class CircleEraser extends Eraser {
  readonly name = "Circle Eraser";
  private readonly memoizedPoints: THREE.Vector2[];

  constructor(diameter: number) {
    super(diameter);
    this.memoizedPoints = createCirclePointsInCircle(diameter);
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
      memoizedPoints: this.memoizedPoints,
    });
  }
}
