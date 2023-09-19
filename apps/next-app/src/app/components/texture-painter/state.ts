import * as THREE from "three";
import { ToolNames, Tools, kToolFactory } from "./tools";

export type TexturePainterState = {
  toolSize: number;
  toolColor: THREE.Color;
  tool: Tools;
  hideCursor: boolean;
  drawingPoints: Uint8Array;
};

export type TexturePainterAction = SetToolAction | HideCursorAction;

export class SetToolAction {
  public readonly toolName: ToolNames;

  constructor(toolName: ToolNames) {
    this.toolName = toolName;
  }
}

export class HideCursorAction {
  public readonly hideCursor: boolean;

  constructor(hideCursor: boolean) {
    this.hideCursor = hideCursor;
  }
}

export function texturePainterReducer(
  state: TexturePainterState,
  action: TexturePainterAction
): TexturePainterState {
  if (action instanceof HideCursorAction) {
    return { ...state, hideCursor: action.hideCursor };
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
