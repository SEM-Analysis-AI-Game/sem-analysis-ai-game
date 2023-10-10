import * as THREE from "three";
import { Dispatch } from "react";
import { Tool } from "./tool";
import { DrawingLayer } from "../drawing-layer";
import { StatisticsUpdate } from "../statistics";
import { ActionHistoryEvent } from "../action-history";
import { ControlsEvent } from "../controls";

export class PanTool extends Tool<"Pan"> {
  readonly name = "Pan";

  /**
   * The cursor position on the last frame.
   */
  private lastCursorPos: THREE.Vector2 | null = null;

  // Size is only stored in this tool so that when we switch from pan to a drawing
  // tool we can preserve the size without needing some external state.
  constructor(size: number) {
    super(size);
  }

  public frameCallback(
    cursorDown: boolean,
    zooming: boolean,
    cursorPos: THREE.Vector2,
    zoom: number,
    pan: THREE.Vector2,
    updateControls: Dispatch<ControlsEvent>,
    updateStatistics: Dispatch<StatisticsUpdate>,
    drawingLayer: DrawingLayer,
    updateHistory: Dispatch<ActionHistoryEvent>
  ): void {
    if (cursorDown) {
      if (this.lastCursorPos) {
        updateControls({
          type: "pan",
          newPan: pan
            .clone()
            .sub(
              cursorPos
                .clone()
                .sub(this.lastCursorPos!)
                .divide(drawingLayer.pixelSize)
            ),
        });
      }
      this.lastCursorPos = cursorPos.clone();
    } else {
      this.lastCursorPos = null;
    }
  }
}
