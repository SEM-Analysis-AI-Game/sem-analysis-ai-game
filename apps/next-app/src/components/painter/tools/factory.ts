import { CircleBrush, CircleEraser, SquareBrush, SquareEraser } from "./draw";
import { PanTool } from "./pan";
import { ToolNames } from "./tool";

type ToolFactory<Name extends ToolNames> = Name extends "Circle Brush"
  ? typeof CircleBrush
  : Name extends "Square Brush"
  ? typeof SquareBrush
  : Name extends "Circle Eraser"
  ? typeof CircleEraser
  : Name extends "Square Eraser"
  ? typeof SquareEraser
  : Name extends "Pan"
  ? typeof PanTool
  : never;

export const kToolFactory: { [Key in ToolNames]: ToolFactory<Key> } = {
  "Circle Eraser": CircleEraser,
  "Square Eraser": SquareEraser,
  "Circle Brush": CircleBrush,
  "Square Brush": SquareBrush,
  Pan: PanTool,
} as const;
