import * as THREE from "three";
import { Tool } from "../tool";
import { Controls } from "../../controls";
import { DrawingLayer } from "../../drawing-layer";
import { Dispatch, SetStateAction } from "react";
import { ActionHistory } from "../../action-history";
import { CanvasAction } from "../../action";

export abstract class DrawTool extends Tool {
  protected readonly alpha: number;

  private lastMousePos: THREE.Vector2 | null = null;
  private drawAction: CanvasAction | null = null;

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
    drawingLayer: DrawingLayer,
    history: ActionHistory
  ): void {
    if (cursorDown && !zooming) {
      if (!this.drawAction) {
        this.drawAction = new CanvasAction(drawingLayer);
      }
      const drawAction = this.drawAction;
      if (!drawAction) {
        throw new Error("Draw action not initialized");
      }

      const fill = (pos: THREE.Vector2) => {
        const mapKey = `${pos.x},${pos.y}`;
        const segment = drawingLayer.segment(pos.x, pos.y);
        const drawSegment =
          this.alpha === 0 ? -1 : drawingLayer.getActiveSegment();
        if (!drawAction.paintedPoints.has(mapKey)) {
          drawAction.paintedPoints.set(mapKey, {
            pos,
            newSegment: drawSegment,
            oldSegment: segment,
            oldAlpha: drawingLayer.alpha(pos.x, pos.y),
            newAlpha: this.alpha,
          });
        }
        if (segment !== -1 && segment !== drawingLayer.getActiveSegment()) {
          drawAction.effectedSegments.add(segment);
        }
        drawAction.drawnPoints.add(mapKey);
        drawingLayer.setSegment(pos.x, pos.y, this.alpha, drawSegment);
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
      if (this.drawAction) {
        drawingLayer.recomputeSegments(this.drawAction);
        history.push(this.drawAction);
        this.drawAction = null;
      }
    }
  }
}
