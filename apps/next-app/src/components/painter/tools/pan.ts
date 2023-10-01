import * as THREE from "three";
import { Tool } from "./tool";
import { Controls } from "../controls";
import { DrawingLayer } from "../drawing-layer";
import { Dispatch, SetStateAction } from "react";

export class PanTool extends Tool {
  readonly name = "Pan";

  constructor(color: THREE.Color, size: number) {
    super(color, size);
  }

  public frameCallback(
    cursorDown: boolean,
    zooming: boolean,
    previousMousePos: THREE.Vector2,
    mousePos: THREE.Vector2,
    setControls: Dispatch<SetStateAction<Controls>>,
    drawingLayer: DrawingLayer
  ): void {
    setControls((controls) => {
      if (cursorDown) {
        const maxPan = new THREE.Vector2(1, 1).subScalar(
          1 / Math.sqrt(controls.zoom)
        );
        return {
          ...controls,
          pan: controls.pan
            .clone()
            .add(
              previousMousePos
                .clone()
                .sub(mousePos)
                .divide(drawingLayer.pixelSize)
            )
            .clamp(maxPan.clone().negate(), maxPan),
        };
      }
      return controls;
    });
  }
}
