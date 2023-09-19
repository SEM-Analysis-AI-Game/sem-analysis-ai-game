import * as THREE from "three";
import { DrawTool } from "../draw";

const kFillColor = new THREE.Color(0x000000);

export abstract class Eraser extends DrawTool {
  constructor(size: number) {
    super(size, kFillColor, 0.0);
  }

  protected paintCursorOverlay(drawingPoints: Uint8Array): void {
    this.paint(
      drawingPoints,
      new THREE.Vector2(this.size / 2, this.size / 2),
      this.size,
      new THREE.Vector2(this.size, this.size),
      kFillColor,
      1
    );
    this.paint(
      drawingPoints,
      new THREE.Vector2(this.size / 2, this.size / 2),
      this.size - 2,
      new THREE.Vector2(this.size, this.size),
      kFillColor,
      0
    );
  }

  protected abstract paint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2,
    color: THREE.Color,
    alpha: number
  ): void;
}
