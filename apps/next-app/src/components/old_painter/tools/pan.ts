import * as THREE from "three";
import { Controls, ControlsEvent, panBounds } from "../controls";
import { Dispatch } from "react";

/**
 * Tracks a pan action.
 */
type PanToolAction = {
  /**
   * The cursor position on the last frame.
   */
  lastCursorPos: THREE.Vector2;

  /**
   * The current pan.
   */
  currentPan: THREE.Vector2;
};

export type PanTool = {
  readonly name: "Pan";
  readonly handleFrame: typeof handleFrame;

  /**
   * The pan tool will hold onto the tool size so we can
   * use it next time we switch to a drawing tool.
   */
  readonly size: number;

  /**
   * The current pan action state.
   */
  action: PanToolAction | null;
};

export function panTool(size: number): PanTool {
  return {
    name: "Pan",
    action: null,
    size,
    handleFrame,
  };
}

function handleFrame(
  state: PanTool,
  cursorPos: THREE.Vector2,
  controls: Controls,
  resolution: THREE.Vector2,
  updateControls: Dispatch<ControlsEvent>
): void {
  if (controls.cursorDown) {
    if (state.action) {
      const bounds = panBounds(controls.zoom);
      state.action.currentPan
        .add(
          state.action.lastCursorPos.clone().sub(cursorPos).divide(resolution)
        )
        .clamp(bounds.clone().negate(), bounds);
      updateControls({
        type: "pan",
        newPan: state.action.currentPan,
      });
    } else {
      state.action = {
        currentPan: controls.pan.clone(),
        lastCursorPos: cursorPos.clone(),
      };
    }
  } else {
    state.action = null;
  }
}
