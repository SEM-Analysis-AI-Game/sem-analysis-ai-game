import { ToolNames } from "../../tool";
import { DrawTool } from "../draw";

export abstract class Brush<Name extends ToolNames> extends DrawTool<Name> {
  constructor(size: number) {
    super(size);
  }

  protected drawingSegment(activeSegment: number): number {
    return activeSegment;
  }
}
