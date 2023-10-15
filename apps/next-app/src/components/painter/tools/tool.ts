import {
  CircleBrush,
  CircleEraser,
  SquareBrush,
  SquareEraser,
  circleBrush,
  circleEraser,
  squareBrush,
  squareEraser,
} from "./draw";
import { PanTool, panTool } from "./pan";

type Tools =
  | [CircleEraser, typeof circleEraser]
  // | [SquareEraser, typeof squareEraser]
  | [CircleBrush, typeof circleBrush]
  // | [SquareBrush, typeof squareBrush]
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
  // "Square Eraser": squareEraser,
  "Circle Brush": circleBrush,
  // "Square Brush": squareBrush,
  Pan: panTool,
};
