import { DrawTool } from "../draw";

export abstract class Brush extends DrawTool {
  constructor(size: number) {
    super(size);
  }

  protected drawingSegment(activeSegment: number): number {
    return activeSegment;
  }
}
