import * as THREE from "three";
import { Dispatch } from "react";
import { Tool } from "./tool";
import { DrawingLayer } from "../drawing-layer";
import { ActionHistoryEvent } from "../action-history";
import { Controls, ControlsEvent } from "../controls";
import { StatisticsEvent } from "../statistics";

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
    cursorPos: THREE.Vector2,
    controls: Controls,
    updateControls: Dispatch<ControlsEvent>,
    updateStatistics: Dispatch<StatisticsEvent>,
    drawingLayer: DrawingLayer,
    updateHistory: Dispatch<ActionHistoryEvent>
  ): void {
    if (controls.cursorDown) {
      if (this.lastCursorPos) {
        updateControls({
          type: "pan",
          newPan: controls.pan
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
