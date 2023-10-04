import {
  CircleBrush,
  CircleEraser,
  PanTool,
  SquareBrush,
  SquareEraser,
  Tool,
  ToolNames,
} from "../tools";

/**
 * The factory for the tools. This is used to create tools from their names.
 */
export const kToolFactory: {
  [Key in ToolNames]: new (size: number) => Tool<Key>;
} = {
  "Circle Eraser": CircleEraser,
  "Square Eraser": SquareEraser,
  "Circle Brush": CircleBrush,
  "Square Brush": SquareBrush,
  Pan: PanTool,
} as const;
