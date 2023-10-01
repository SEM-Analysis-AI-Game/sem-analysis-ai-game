import * as THREE from "three";
import { Brush } from "./brush";
import { drawCircle } from "../../utils";

export class CircleBrush extends Brush {
  readonly name = "Circle Brush";

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
