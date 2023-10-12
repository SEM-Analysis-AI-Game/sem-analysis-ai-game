import * as THREE from "three";
import { Dispatch } from "react";
import { DrawingLayer } from "../drawing-layer";
import { Controls, ControlsEvent } from "../controls";

function handleFrame(
  state: PanTool,
  cursorPos: THREE.Vector2,
  controls: Controls,
  drawingLayer: DrawingLayer,
  updateControls: Dispatch<ControlsEvent>
): void {
  if (controls.cursorDown) {
    if (state.lastCursorPos) {
      updateControls({
        type: "pan",
        newPan: controls.pan
          .clone()
          .sub(
            cursorPos
              .clone()
              .sub(state.lastCursorPos!)
              .divide(drawingLayer.rendererState.pixelSize)
          ),
      });
    }
    state.lastCursorPos = cursorPos.clone();
  } else {
    state.lastCursorPos = null;
  }
}

export type PanTool = {
  readonly name: "Pan";
  readonly handleFrame: typeof handleFrame;

  /**
   * The pan tool will hold onto the tool size so we can
   * use it next time we switch to a drawing tool.
   */
  readonly size: number;

  /**
   * The cursor position on the last frame.
   */
  lastCursorPos: THREE.Vector2 | null;
};

export function panTool(size: number): PanTool {
  return {
    name: "Pan",
    lastCursorPos: null,
    size,
    handleFrame,
  };
}
