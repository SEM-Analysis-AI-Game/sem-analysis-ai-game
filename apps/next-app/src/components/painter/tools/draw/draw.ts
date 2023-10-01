import * as THREE from "three";
import { Tool } from "../tool";
import { Controls } from "../../controls";
import { DrawingLayer } from "../../drawing-layer";
import { Dispatch, SetStateAction } from "react";
import { CanvasAction } from "../../action";

class DrawAction extends CanvasAction {
  public readonly paintedPoints: Map<
    string,
    { pos: THREE.Vector2; segment: number }
  >;
  public readonly drawingLayer: DrawingLayer;

  constructor(drawingLayer: DrawingLayer) {
    super();
    this.paintedPoints = new Map();
    this.drawingLayer = drawingLayer;
  }

  public redo(): void {}

  public undo(): void {}
}

export abstract class DrawTool extends Tool {
  protected readonly alpha: number;

  private lastMousePos: THREE.Vector2 | null = null;
  private drawAction: DrawAction | null = null;

  constructor(size: number, alpha: number) {
    super(size);
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
    zooming: boolean,
    mousePos: THREE.Vector2,
    controls: Controls,
    setControls: Dispatch<SetStateAction<Controls>>,
    drawingLayer: DrawingLayer
  ): void {
    if (cursorDown && !zooming) {
      if (!this.drawAction) {
        this.drawAction = new DrawAction(drawingLayer);
      }
      const drawAction = this.drawAction;
      if (!drawAction) {
        throw new Error("Draw action not initialized");
      }
      const fill = (pos: THREE.Vector2) => {
        const mapKey = `${pos.x},${pos.y}`;
        if (!drawAction.paintedPoints.has(mapKey)) {
          drawAction.paintedPoints.set(mapKey, {
            pos,
            segment: drawingLayer.segment(pos.x, pos.y),
          });
        }
        drawingLayer.setSegment(
          pos.x,
          pos.y,
          this.alpha,
          drawingLayer.getActiveSegment()
        );
      };

      this.paint({
        fill,
        size: this.size,
        pos: mousePos,
        resolution: drawingLayer.pixelSize,
      });
      if (this.lastMousePos) {
        const current = mousePos.clone();
        const step = this.lastMousePos
          .clone()
          .sub(mousePos)
          .normalize()
          .multiplyScalar(this.size / 2);
        while (step.dot(this.lastMousePos.clone().sub(current)) > 0) {
          this.paint({
            fill,
            size: this.size,
            pos: current.clone().ceil(),
            resolution: drawingLayer.pixelSize,
          });
          current.add(step);
        }
      }
      this.lastMousePos = mousePos.clone();
    } else {
      this.lastMousePos = null;
    }
  }
}
