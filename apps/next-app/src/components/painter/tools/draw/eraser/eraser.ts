import { ToolNames } from "../../tool";
import { DrawTool } from "../draw";

export abstract class Eraser<Name extends ToolNames> extends DrawTool<Name> {
  constructor(size: number) {
    super(size);
  }

  /**
   * By returning -1, we are pixels from segments.
   */
  protected drawingSegment(): number {
    return -1;
  }
}
