import * as THREE from "three";
import { Dispatch, SetStateAction } from "react";
import { Tool } from "./tool";
import { DrawingLayer } from "../drawing-layer";
import { ActionHistory } from "../action-history";

/**
 * The multiplier for the pan speed. This should be refactored out.
 */
export const kPanMultiplier = 3.5;

export class PanTool extends Tool {
  readonly name = "Pan";

  /**
   * The mouse position on the last frame.
   */
  private lastMousePos: THREE.Vector2 | null = null;

  /**
   * Size is only stored in this tool so that when we switch from pan to a drawing
   * tool we can preserve the size without needing some external state.
   */
  constructor(size: number) {
    super(size);
  }

  public frameCallback(
    cursorDown: boolean,
    zooming: boolean,
    mousePos: THREE.Vector2,
    zoom: number,
    pan: THREE.Vector2,
    setZoom: Dispatch<SetStateAction<number>>,
    setPan: Dispatch<SetStateAction<THREE.Vector2>>,
    drawingLayer: DrawingLayer,
    history: ActionHistory,
    activeSegment: number
  ): void {
    if (cursorDown && this.lastMousePos) {
      const maxPan = new THREE.Vector2(1, 1)
        .subScalar(1.0 / Math.sqrt(zoom))
        .divideScalar(kPanMultiplier);
      setPan(
        pan
          .clone()
          .add(
            this.lastMousePos
              .clone()
              .sub(mousePos)
              .divide(drawingLayer.pixelSize)
          )
          .clamp(maxPan.clone().negate(), maxPan)
      );
    }
    this.lastMousePos = mousePos.clone();
  }
}
