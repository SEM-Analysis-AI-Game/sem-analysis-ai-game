import { DrawTool } from "../draw";

export abstract class Eraser extends DrawTool {
  constructor(size: number) {
    super(size);
  }

  /**
   * By returning -1, we are removing segments from the
   * drawing layer.
   */
  protected drawingSegment(): number {
    return -1;
  }
}
