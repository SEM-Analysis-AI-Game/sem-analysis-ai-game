import { DrawTool, drawTool } from "../draw";

export function eraserTool<ToolName extends string>(
  name: ToolName,
  size: number,
  paint: (
    fill: (pos: THREE.Vector2) => void,
    size: number,
    pos: THREE.Vector2,
    resolution: THREE.Vector2
  ) => void
): DrawTool<ToolName> {
  // always chooses -1 as the segment to draw
  return drawTool(name, size, paint, () => -1);
}
