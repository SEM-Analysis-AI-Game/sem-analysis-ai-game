import { DrawTool } from "../draw";

export abstract class Eraser extends DrawTool {
  constructor(color: THREE.Color, size: number) {
    super(color, size, 0.0);
  }
}
