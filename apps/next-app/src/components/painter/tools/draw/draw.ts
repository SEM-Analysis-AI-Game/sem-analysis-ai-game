import * as THREE from "three";
import { Tool } from "../tool";
import { Controls } from "../../controls";
import { DrawingLayer } from "../../drawing-layer";

export abstract class DrawTool extends Tool {
  protected readonly alpha: number;

  constructor(color: THREE.Color, size: number, alpha: number) {
    super(color, size);
    this.alpha = alpha;
  }

  protected abstract paint(params: {
    fill: (pos: THREE.Vector2) => void;
    size: number;
    pos: THREE.Vector2;
    resolution: THREE.Vector2;
  }): void;

  public frameCallback(
    cursorDown: boolean,
    controls: Controls,
    drawingLayer: DrawingLayer
  ): void {
    if (cursorDown) {
      const pointsToDraw: {
        pos: THREE.Vector2;
        color: THREE.Color;
        alpha: number;
      }[] = [];
      const current = controls.mousePos.clone();
      const step = controls.previousMousePos
        .clone()
        .sub(controls.mousePos)
        .normalize()
        .multiplyScalar(this.size / 2);
      while (step.dot(controls.previousMousePos.clone().sub(current)) > 0) {
        this.paint({
          fill: (pos) => {
            pointsToDraw.push({
              pos,
              color: this.color,
              alpha: this.alpha,
            });
          },
          size: this.size,
          pos: current.clone().ceil(),
          resolution: drawingLayer.pixelSize,
        });
        current.add(step);
      }
      this.paint({
        fill: (pos) => {
          pointsToDraw.push({
            pos,
            color: this.color,
            alpha: this.alpha,
          });
        },
        size: this.size,
        pos: controls.previousMousePos,
        resolution: drawingLayer.pixelSize,
      });
      drawingLayer.drawPoints(pointsToDraw);
    }
  }
}
