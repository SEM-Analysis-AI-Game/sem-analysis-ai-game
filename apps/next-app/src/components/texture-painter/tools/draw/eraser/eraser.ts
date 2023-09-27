import * as THREE from "three";
import { DrawTool } from "../draw";

const kFillColor = new THREE.Color(0x000000);

export abstract class Eraser extends DrawTool {
  constructor(size: number) {
    super(size, kFillColor, 0.0);
  }

  protected paintCursorOverlay(data: Uint8Array): void {
    this.directPaint(
      data,
      new THREE.Vector2(this.size / 2, this.size / 2).floor(),
      Math.floor(this.size),
      new THREE.Vector2(this.size, this.size).floor(),
      1.0
    );
    this.directPaint(
      data,
      new THREE.Vector2(this.size / 2, this.size / 2).floor(),
      Math.floor(this.size) - (this.size % 2 === 1 ? 15 : 16),
      new THREE.Vector2(this.size, this.size).floor(),
      0.0
    );
  }
}
