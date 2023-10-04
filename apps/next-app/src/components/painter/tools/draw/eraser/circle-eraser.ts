import { createCirclePoints, drawMemoizedCircle } from "../../utils";
import { Eraser } from "./eraser";

export class CircleEraser extends Eraser<"Circle Eraser"> {
  readonly name = "Circle Eraser";

  /**
   * The points of the circle are memoized so that we don't have to
   * recalculate them every time we draw.
   */
  private readonly memoizedPoints: THREE.Vector2[];

  constructor(diameter: number) {
    super(diameter);
    this.memoizedPoints = createCirclePoints(diameter);
  }

  protected paint(params: {
    fill: (pos: THREE.Vector2) => void;
    size: number;
    pos: THREE.Vector2;
    resolution: THREE.Vector2;
  }): void {
    return drawMemoizedCircle({
      ...params,
      diameter: this.size,
      offsets: this.memoizedPoints,
    });
  }
}
