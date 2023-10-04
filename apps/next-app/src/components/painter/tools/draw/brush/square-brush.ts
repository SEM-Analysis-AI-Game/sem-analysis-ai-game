import * as THREE from "three";
import { Brush } from "./brush";
import { drawSquare } from "../../utils";

export class SquareBrush extends Brush<"Square Brush"> {
  readonly name = "Square Brush";

  constructor(diameter: number) {
    super(diameter);
  }

  protected paint(params: {
    fill: (pos: THREE.Vector2) => void;
    size: number;
    pos: THREE.Vector2;
    resolution: THREE.Vector2;
  }): void {
    return drawSquare({
      ...params,
      length: this.size,
    });
  }
}
