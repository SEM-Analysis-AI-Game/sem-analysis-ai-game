import * as THREE from "three";
import { ToolNames, Tools, kToolFactory } from "./tools";

export type TexturePainterState = {
  toolSize: number;
  toolColor: THREE.Color;
  tool: Tools;
  drawingPoints: Uint8Array;
};

export type TexturePainterAction = SetToolAction | SetToolAlphaAction;

export class SetToolAction {
  public readonly toolName: ToolNames;

  constructor(toolName: ToolNames) {
    this.toolName = toolName;
  }
}

export class SetToolAlphaAction {
  public readonly brushAlpha: number;

  constructor(brushAlpha: number) {
    this.brushAlpha = brushAlpha;
  }
}

export function texturePainterReducer(
  state: TexturePainterState,
  action: TexturePainterAction
): TexturePainterState {
  if (action instanceof SetToolAlphaAction) {
    const newState = { ...state, toolAlpha: action.brushAlpha };
    switch (state.tool.name) {
      case "Circle Brush":
      case "Square Brush":
        newState.tool = new kToolFactory[state.tool.name](
          state.toolSize,
          state.toolColor
        );
        return newState;
      case "Circle Eraser":
      case "Square Eraser":
        newState.tool = new kToolFactory[state.tool.name](state.toolSize);
        return newState;
    }
  } else if (action instanceof SetToolAction) {
    switch (action.toolName) {
      case "Circle Brush":
      case "Square Brush":
        const newBrush = new kToolFactory[action.toolName](
          state.toolSize,
          state.toolColor
        );
        return {
          ...state,
          tool: newBrush,
        };
      case "Circle Eraser":
      case "Square Eraser":
        const newEraser = new kToolFactory[action.toolName](state.toolSize);
        return {
          ...state,
          tool: newEraser,
        };
    }
  } else {
    throw new Error("Unknown action");
  }
}
