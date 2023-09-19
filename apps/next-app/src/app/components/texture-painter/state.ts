import * as THREE from "three";
import { ToolNames, Tools, kToolFactory } from "./tools";

export type TexturePainterState = {
  toolSize: number;
  toolColor: THREE.Color;
  tool: Tools;
  hideCursor: boolean;
  drawingPoints: Uint8Array;
};

export type TexturePainterAction =
  | SetToolAction
  | HideCursorAction
  | SetToolSizeAction
  | SetToolColorAction;

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

export class SetToolSizeAction {
  public readonly toolSize: number;

  constructor(toolSize: number) {
    this.toolSize = toolSize;
  }
}

export class SetToolColorAction {
  public readonly toolColor: THREE.Color;

  constructor(toolColor: THREE.Color) {
    this.toolColor = toolColor;
  }
}

export function texturePainterReducer(
  state: TexturePainterState,
  action: TexturePainterAction
): TexturePainterState {
  if (action instanceof HideCursorAction) {
    return { ...state, hideCursor: action.hideCursor };
  } else if (action instanceof SetToolAction) {
    return {
      ...state,
      tool: new kToolFactory[action.toolName](state.toolSize, state.toolColor),
    };
  } else if (action instanceof SetToolSizeAction) {
    return {
      ...state,
      toolSize: action.toolSize,
      tool: new kToolFactory[state.tool.name](action.toolSize, state.toolColor),
    };
  } else if (action instanceof SetToolColorAction) {
    return {
      ...state,
      toolColor: action.toolColor,
      tool: new kToolFactory[state.tool.name](state.toolSize, action.toolColor),
    };
  } else {
    throw new Error("Unknown action");
  }
}
