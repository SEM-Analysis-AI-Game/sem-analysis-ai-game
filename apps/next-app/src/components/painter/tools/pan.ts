import * as THREE from "three";
import { Dispatch, SetStateAction } from "react";
import { Tool } from "./tool";
import { DrawingLayer } from "../drawing-layer";
import { ActionHistory } from "../action-history";
import { PainterStatistics } from "../statistics";

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
    setZoom: Dispatch<SetStateAction<number>>,
    setPan: Dispatch<SetStateAction<THREE.Vector2>>,
    statistics: PainterStatistics,
    setStatistics: Dispatch<SetStateAction<PainterStatistics>>,
    drawingLayer: DrawingLayer,
    history: ActionHistory,
    activeSegment: number
  ): void {
    if (cursorDown) {
      if (this.lastCursorPos) {
        const panBounds = new THREE.Vector2(1, 1).subScalar(
          1.0 / Math.sqrt(zoom)
        );
        setPan(
          pan
            .clone()
            .sub(
              cursorPos
                .clone()
                .sub(this.lastCursorPos!)
                .divide(drawingLayer.pixelSize)
            )
            .clamp(panBounds.clone().negate(), panBounds)
        );
      }
      this.lastCursorPos = cursorPos.clone();
    } else {
      this.lastCursorPos = null;
    }
  }
}
