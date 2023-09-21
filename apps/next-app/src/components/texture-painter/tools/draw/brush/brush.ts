import * as THREE from "three";
import { DrawTool } from "../draw";
import { fillPixel } from "../../utils";

const kBrushAlpha = 0.5;

export abstract class Brush extends DrawTool {
  constructor(size: number, color: THREE.Color) {
    super(size, color, kBrushAlpha);
  }

  protected paintCursorOverlay(data: Uint8Array): void {
    this.paint(
      (pos) =>
        fillPixel(data, {
          pos,
          fillColor: this.color,
          alpha: kBrushAlpha,
          resolution: new THREE.Vector2(this.size, this.size),
        }),
      new THREE.Vector2(this.size / 2, this.size / 2),
      this.size,
      new THREE.Vector2(this.size, this.size)
    );
  }
}
