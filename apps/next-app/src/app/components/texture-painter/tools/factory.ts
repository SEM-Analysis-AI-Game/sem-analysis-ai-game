import { CircleBrush, CircleEraser, SquareBrush, SquareEraser } from "./draw";
import { ToolNames } from "./tool";

export type Tools = CircleBrush | SquareBrush | CircleEraser | SquareEraser;

type ToolFactory<Name extends ToolNames> = Name extends "Circle Brush"
  ? typeof CircleBrush
  : Name extends "Square Brush"
  ? typeof SquareBrush
  : Name extends "Circle Eraser"
  ? typeof CircleEraser
  : Name extends "Square Eraser"
  ? typeof SquareEraser
  : never;

export const kToolFactory: { [Key in ToolNames]: ToolFactory<Key> } = {
  "Circle Eraser": CircleEraser,
  "Square Eraser": SquareEraser,
  "Circle Brush": CircleBrush,
  "Square Brush": SquareBrush,
} as const;
