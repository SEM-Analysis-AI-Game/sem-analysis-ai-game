import * as THREE from "three";
import { DrawTool } from "../draw";
import { fillPixel } from "../../utils";

const kFillColor = new THREE.Color(0x000000);

export abstract class Eraser extends DrawTool {
  constructor(size: number) {
    super(size, kFillColor, 0.0);
  }

  protected paintCursorOverlay(data: Uint8Array): void {
    this.paint(
      (pos) =>
        fillPixel(data, {
          pos,
          resolution: new THREE.Vector2(this.size, this.size),
          fillColor: kFillColor,
          alpha: 1,
        }),
      new THREE.Vector2(this.size / 2, this.size / 2),
      this.size,
      new THREE.Vector2(this.size, this.size)
    );
    this.paint(
      (pos) =>
        fillPixel(data, {
          pos,
          resolution: new THREE.Vector2(this.size, this.size),
          fillColor: kFillColor,
          alpha: 0,
        }),
      new THREE.Vector2(this.size / 2, this.size / 2),
      this.size - 2,
      new THREE.Vector2(this.size, this.size)
    );
  }

  protected abstract paint(
    drawPoint: (pos: THREE.Vector2) => void,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void;
}
