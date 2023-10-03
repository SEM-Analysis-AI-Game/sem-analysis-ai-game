import * as THREE from "three";
import { Tool } from "../tool";
import { Controls } from "../../controls";
import { DrawingLayer } from "../../drawing-layer";
import { Dispatch, SetStateAction } from "react";
import { ActionHistory } from "../../action-history";
import { CanvasAction } from "../../action";
import { PointContainer } from "../../point-container";

export const kDrawAlpha = 0.5;

export abstract class DrawTool extends Tool {
  private lastMousePos: THREE.Vector2 | null = null;
  private drawAction: CanvasAction | null = null;

  constructor(size: number) {
    super(size);
  }

  protected abstract paint(params: {
    fill: (pos: THREE.Vector2) => void;
    size: number;
    pos: THREE.Vector2;
    resolution: THREE.Vector2;
  }): void;

  protected abstract drawingSegment(activeSegment: number): number;

  public frameCallback(
    cursorDown: boolean,
    zooming: boolean,
    mousePos: THREE.Vector2,
    controls: Controls,
    setControls: Dispatch<SetStateAction<Controls>>,
    drawingLayer: DrawingLayer,
    history: ActionHistory,
    activeSegment: number
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
        const oldSegment = drawingLayer.segment(pos.x, pos.y);
        const drawSegment = this.drawingSegment(activeSegment);
        if (!drawAction.paintedPoints.hasPoint(pos.x, pos.y)) {
          drawAction.paintedPoints.setPoint(pos.x, pos.y, {
            newSegment: drawSegment,
            oldSegment: oldSegment,
          });
        }
        const { newBoundaryPoints, removedBoundaryPoints } =
          drawingLayer.setSegment(pos.x, pos.y, drawSegment);
        if (oldSegment !== -1 && oldSegment !== drawSegment) {
          const oldBoundaryPointEntry =
            drawAction.effectedSegments.get(oldSegment);
          if (oldBoundaryPointEntry) {
            newBoundaryPoints.forEach((x, y) =>
              oldBoundaryPointEntry.newBoundaryPoints.setPoint(x, y, null)
            );
            removedBoundaryPoints.forEach((x, y) =>
              oldBoundaryPointEntry.newBoundaryPoints.deletePoint(x, y)
            );
          } else {
            drawAction.effectedSegments.set(oldSegment, {
              newBoundaryPoints,
            });
          }
        }
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
