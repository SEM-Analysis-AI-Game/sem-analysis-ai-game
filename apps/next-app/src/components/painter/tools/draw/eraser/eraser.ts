import { DrawTool } from "../draw";

export abstract class Eraser extends DrawTool {
  constructor(size: number) {
    super(size, 0.0);
  }
}
