import * as THREE from "three";
import { Tool } from "./tool";
import { Controls } from "../controls";
import { DrawingLayer } from "../drawing-layer";

export class PanTool extends Tool {
  readonly name = "Pan";

  constructor(color: THREE.Color, size: number) {
    super(color, size);
  }

  public frameCallback(
    cursorDown: boolean,
    controls: Controls,
    drawingLayer: DrawingLayer
  ): void {
    if (cursorDown) {
      const delta = controls.previousMousePos
        .clone()
        .sub(controls.mousePos)
        .divide(drawingLayer.pixelSize);
      const maxPan = new THREE.Vector2(1, 1).subScalar(
        1 / Math.sqrt(controls.zoom)
      );
      controls.pan.add(delta).clamp(maxPan.clone().negate(), maxPan);
    }
  }
}
