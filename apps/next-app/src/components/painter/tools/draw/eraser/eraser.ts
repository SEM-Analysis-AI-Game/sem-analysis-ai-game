import { DrawTool } from "../draw";

export abstract class Eraser extends DrawTool {
  constructor(size: number) {
    super(size);
  }

  protected drawingSegment(activeSegment: number): number {
    return -1;
  }
}
