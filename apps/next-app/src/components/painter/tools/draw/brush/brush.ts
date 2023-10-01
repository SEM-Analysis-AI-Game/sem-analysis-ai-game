import { DrawTool } from "../draw";

const kDrawAlpha = 0.5;

export abstract class Brush extends DrawTool {
  constructor(color: THREE.Color, size: number) {
    super(color, size, kDrawAlpha);
  }
}
