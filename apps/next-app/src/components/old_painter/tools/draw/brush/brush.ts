import { DrawTool, drawTool } from "../draw";

export function brushTool<ToolName extends string>(
  name: ToolName,
  size: number,
  paint: (
    fill: (pos: THREE.Vector2) => void,
    size: number,
    pos: THREE.Vector2,
    resolution: THREE.Vector2
  ) => void
): DrawTool<ToolName> {
  return drawTool(name, size, paint, (activeSegment) => activeSegment);
}
