import * as THREE from "three";
import { DrawTool } from "../draw";

const kFillColor = new THREE.Color(0x000000);

export abstract class Eraser extends DrawTool {
  constructor(size: number) {
    super(size, kFillColor, 0.0);
  }

  protected paintCursorOverlay(data: Uint8Array): void {
    this.eraserPaint(
      data,
      new THREE.Vector2(this.size / 2, this.size / 2).floor(),
      Math.floor(this.size),
      new THREE.Vector2(this.size, this.size).floor(),
      1.0
    );
    this.paint(
      data,
      new THREE.Vector2(this.size / 2, this.size / 2).floor(),
      Math.floor(this.size) - 4,
      new THREE.Vector2(this.size, this.size).floor()
    );
  }

  protected abstract eraserPaint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2,
    alpha: number
  ): void;

  protected paint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void {
    this.eraserPaint(data, pos, size, resolution, this.alpha);
  }
}
