import {
  CircleBrush,
  CircleEraser,
  PanTool,
  SquareBrush,
  SquareEraser,
  circleBrush,
  circleEraser,
  panTool,
  squareBrush,
  squareEraser,
} from "../tools";

type Tools =
  | [CircleEraser, typeof circleEraser]
  | [SquareEraser, typeof squareEraser]
  | [CircleBrush, typeof circleBrush]
  | [SquareBrush, typeof squareBrush]
  | [PanTool, typeof panTool];

export type Tool = Tools[0];

export type ToolName = Tool["name"];

/**
 * The factory for the tools. This is used to create tools from their names.
 */
export const kToolFactory: {
  [T in Tools as T[0]["name"]]: T[1];
} = {
  "Circle Eraser": circleEraser,
  "Square Eraser": squareEraser,
  "Circle Brush": circleBrush,
  "Square Brush": squareBrush,
  Pan: panTool,
};
