"use client";

import * as THREE from "three";
import { CircleBrush, ToolNames, Tools, kToolFactory } from "./tools";
import { PropsWithChildren, useReducer } from "react";
import {
  TexturePainterActionDispatchContext,
  TexturePainterStateContext,
} from "./context";
import { kSubdivisions } from "./shaders";

export type TexturePainterState =
  | TexturePainterInitialState
  | TexturePainterLoadedState;

export class TexturePainterInitialState {
  public readonly toolSize: number;
  public readonly toolColor: THREE.Color;
  public readonly tool: Tools;
  public readonly hideCursor: boolean;
  public readonly cursorDown: boolean;

  constructor(
    toolSize: number,
    toolColor: THREE.Color,
    tool: Tools,
    hideCursor: boolean,
    cursorDown: boolean
  ) {
    this.toolSize = toolSize;
    this.toolColor = toolColor;
    this.tool = tool;
    this.hideCursor = hideCursor;
    this.cursorDown = cursorDown;
  }
}

export class TexturePainterLoadedState extends TexturePainterInitialState {
  public readonly drawings: Uint8Array[];
  public readonly background: THREE.Texture;

  constructor(
    toolSize: number,
    toolColor: THREE.Color,
    tool: Tools,
    hideCursor: boolean,
    cursorDown: boolean,
    drawingPoints: Uint8Array[],
    background: THREE.Texture
  ) {
    super(toolSize, toolColor, tool, hideCursor, cursorDown);
    this.drawings = drawingPoints;
    this.background = background;
  }
}

export type TexturePainterAction =
  | SetToolAction
  | HideCursorAction
  | SetToolSizeAction
  | SetToolColorAction
  | LoadedBackgroundAction;

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

export class LoadedBackgroundAction {
  public readonly background: THREE.Texture;

  constructor(background: THREE.Texture) {
    this.background = background;
  }
}

export function texturePainterReducer(
  state: TexturePainterState,
  action: TexturePainterAction
): TexturePainterState {
  if (action instanceof HideCursorAction) {
    if (state instanceof TexturePainterLoadedState) {
      return new TexturePainterLoadedState(
        state.toolSize,
        state.toolColor,
        state.tool,
        action.hideCursor,
        state.cursorDown,
        state.drawings,
        state.background
      );
    } else {
      return new TexturePainterInitialState(
        state.toolSize,
        state.toolColor,
        state.tool,
        action.hideCursor,
        state.cursorDown
      );
    }
  } else if (action instanceof SetToolAction) {
    const tool = new kToolFactory[action.toolName](
      state.toolSize,
      state.toolColor
    );
    if (state instanceof TexturePainterLoadedState) {
      return new TexturePainterLoadedState(
        state.toolSize,
        state.toolColor,
        tool,
        state.hideCursor,
        state.cursorDown,
        state.drawings,
        state.background
      );
    } else {
      return new TexturePainterInitialState(
        state.toolSize,
        state.toolColor,
        tool,
        state.hideCursor,
        state.cursorDown
      );
    }
  } else if (action instanceof SetToolSizeAction) {
    const tool = new kToolFactory[state.tool.name](
      action.toolSize,
      state.toolColor
    );
    if (state instanceof TexturePainterLoadedState) {
      return new TexturePainterLoadedState(
        action.toolSize,
        state.toolColor,
        tool,
        state.hideCursor,
        state.cursorDown,
        state.drawings,
        state.background
      );
    } else {
      return new TexturePainterInitialState(
        action.toolSize,
        state.toolColor,
        tool,
        state.hideCursor,
        state.cursorDown
      );
    }
  } else if (action instanceof SetToolColorAction) {
    const tool = new kToolFactory[state.tool.name](
      state.toolSize,
      action.toolColor
    );
    if (state instanceof TexturePainterLoadedState) {
      return new TexturePainterLoadedState(
        state.toolSize,
        action.toolColor,
        tool,
        state.hideCursor,
        state.cursorDown,
        state.drawings,
        state.background
      );
    } else {
      return new TexturePainterInitialState(
        state.toolSize,
        action.toolColor,
        tool,
        state.hideCursor,
        state.cursorDown
      );
    }
  } else if (action instanceof LoadedBackgroundAction) {
    const sections = Math.pow(kSubdivisions + 1, 2);
    const drawings = new Array(sections);
    for (let i = 0; i <= kSubdivisions; i++) {
      for (let j = 0; j <= kSubdivisions; j++) {
        drawings[i * (kSubdivisions + 1) + j] = new Uint8Array(
          Math.floor(
            (action.background.image.width * action.background.image.height) /
              sections
          ) * 4
        );
      }
    }
    return new TexturePainterLoadedState(
      state.toolSize,
      state.toolColor,
      state.tool,
      state.hideCursor,
      state.cursorDown,
      drawings,
      action.background
    );
  } else {
    return new TexturePainterInitialState(
      state.toolSize,
      state.toolColor,
      state.tool,
      state.hideCursor,
      state.cursorDown
    );
  }
}

export const kDefaultToolSize = 100;

export function TexturePainterProvider(props: PropsWithChildren): JSX.Element {
  const [state, dispatch] = useReducer(
    texturePainterReducer,
    { toolSize: kDefaultToolSize, toolColor: new THREE.Color(0xff0000) },
    (params) => {
      return new TexturePainterInitialState(
        params.toolSize,
        params.toolColor,
        new CircleBrush(params.toolSize, params.toolColor),
        false,
        false
      );
    }
  );

  return (
    <TexturePainterStateContext.Provider value={state}>
      <TexturePainterActionDispatchContext.Provider value={dispatch}>
        {props.children}
      </TexturePainterActionDispatchContext.Provider>
    </TexturePainterStateContext.Provider>
  );
}
