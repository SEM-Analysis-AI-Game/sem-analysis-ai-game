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

  constructor(toolSize: number, toolColor: THREE.Color, tool: Tools) {
    this.toolSize = toolSize;
    this.toolColor = toolColor;
    this.tool = tool;
  }
}

const kPanSpeed = 3.25;

export class TexturePainterLoadedState extends TexturePainterInitialState {
  public readonly drawings: Uint8Array[];
  public readonly background: THREE.Texture;
  public readonly zoom: number;
  public readonly pan: THREE.Vector2;
  public readonly hideCursor: boolean;
  public readonly cursorDown: boolean;

  constructor(
    toolSize: number,
    toolColor: THREE.Color,
    tool: Tools,
    hideCursor: boolean,
    cursorDown: boolean,
    drawingPoints: Uint8Array[],
    background: THREE.Texture,
    zoom: number,
    pan: THREE.Vector2
  ) {
    super(toolSize, toolColor, tool);
    this.drawings = drawingPoints;
    this.background = background;
    this.zoom = zoom;
    this.pan = pan;
    this.hideCursor = hideCursor;
    this.cursorDown = cursorDown;
  }
}

export type TexturePainterAction =
  | SetToolAction
  | HideCursorAction
  | SetToolSizeAction
  | SetToolColorAction
  | SetCursorDownAction
  | SetZoomAction
  | ApplyPanAction
  | LoadedBackgroundAction;

export class ApplyPanAction {
  public readonly pan: THREE.Vector2;

  constructor(pan: THREE.Vector2) {
    this.pan = pan;
  }
}

export class SetZoomAction {
  public readonly zoom: number;
  public readonly mousePosition: THREE.Vector2;

  constructor(zoom: number, mousePosition: THREE.Vector2) {
    this.zoom = zoom;
    this.mousePosition = mousePosition;
  }
}

export class SetCursorDownAction {
  public readonly cursorDown: boolean;

  constructor(cursorDown: boolean) {
    this.cursorDown = cursorDown;
  }
}

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
        action.hideCursor ? false : state.cursorDown,
        state.drawings,
        state.background,
        state.zoom,
        state.pan
      );
    } else {
      return state;
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
        state.background,
        state.zoom,
        state.pan
      );
    } else {
      return new TexturePainterInitialState(
        state.toolSize,
        state.toolColor,
        tool
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
        state.background,
        state.zoom,
        state.pan
      );
    } else {
      return new TexturePainterInitialState(
        action.toolSize,
        state.toolColor,
        tool
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
        state.background,
        state.zoom,
        state.pan
      );
    } else {
      return new TexturePainterInitialState(
        state.toolSize,
        action.toolColor,
        tool
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
      true,
      false,
      drawings,
      action.background,
      1.0,
      new THREE.Vector2()
    );
  } else if (action instanceof SetCursorDownAction) {
    if (state instanceof TexturePainterLoadedState) {
      return new TexturePainterLoadedState(
        state.toolSize,
        state.toolColor,
        state.tool,
        state.hideCursor,
        action.cursorDown,
        state.drawings,
        state.background,
        state.zoom,
        state.pan
      );
    } else {
      return state;
    }
  } else if (action instanceof SetZoomAction) {
    if (state instanceof TexturePainterLoadedState) {
      const panBounds = new THREE.Vector2(1.0, 1.0).subScalar(
        1.0 / Math.sqrt(action.zoom)
      );
      return new TexturePainterLoadedState(
        state.toolSize,
        state.toolColor,
        state.tool,
        state.hideCursor,
        state.cursorDown,
        state.drawings,
        state.background,
        action.zoom,
        action.mousePosition
          .clone()
          .divideScalar(action.zoom)
          .multiplyScalar(Math.max((action.zoom - state.zoom) * 0.5, 0))
          .add(state.pan)
          .clamp(panBounds.clone().negate(), panBounds)
      );
    } else {
      return state;
    }
  } else if (action instanceof ApplyPanAction) {
    if (state instanceof TexturePainterLoadedState) {
      const zoomFactor = Math.sqrt(state.zoom);
      const panBounds = new THREE.Vector2(1.0, 1.0).subScalar(
        1.0 / Math.sqrt(state.zoom)
      );
      return new TexturePainterLoadedState(
        state.toolSize,
        state.toolColor,
        state.tool,
        state.hideCursor,
        state.cursorDown,
        state.drawings,
        state.background,
        state.zoom,
        state.pan
          .clone()
          .add(
            action.pan
              .clone()
              .divide(
                new THREE.Vector2(
                  state.background.image.width,
                  state.background.image.height
                ).divideScalar(zoomFactor)
              )
              .multiplyScalar(kPanSpeed)
          )
          .clamp(panBounds.clone().negate(), panBounds)
      );
    } else {
      return state;
    }
  } else {
    throw new Error(`Unknown action: ${action}`);
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
        new CircleBrush(params.toolSize, params.toolColor)
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
