import * as THREE from "three";
import { Tool } from "../tool";
import { Controls } from "../../controls";
import { DrawingLayer } from "../../drawing-layer";
import { Dispatch, SetStateAction } from "react";
import { ActionHistory } from "../../action-history";
import { CanvasAction } from "../../action";

class DrawAction extends CanvasAction {
  public readonly paintedPoints: Map<
    string,
    { pos: THREE.Vector2; segment: number; alpha: number }
  >;
  public readonly drawingLayer: DrawingLayer;
  public readonly segment: number;
  public readonly alpha: number;

  constructor(drawingLayer: DrawingLayer, segment: number, alpha: number) {
    super();
    this.alpha = alpha;
    this.segment = segment;
    this.paintedPoints = new Map();
    this.drawingLayer = drawingLayer;
  }

  public redo(): void {
    for (let entry of this.paintedPoints.entries()) {
      this.drawingLayer.setSegment(
        entry[1].pos.x,
        entry[1].pos.y,
        this.alpha,
        this.segment
      );
    }
  }

  public undo(): void {
    for (let entry of this.paintedPoints.entries()) {
      this.drawingLayer.setSegment(
        entry[1].pos.x,
        entry[1].pos.y,
        entry[1].alpha,
        entry[1].segment
      );
    }
  }
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
    drawingLayer: DrawingLayer,
    history: ActionHistory
  ): void {
    if (cursorDown && !zooming) {
      if (!this.drawAction) {
        this.drawAction = new DrawAction(
          drawingLayer,
          this.alpha === 0.0 ? -1 : drawingLayer.getActiveSegment(),
          this.alpha
        );
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
            alpha: drawingLayer.alpha(pos.x, pos.y),
          });
        }
        drawingLayer.setSegment(
          pos.x,
          pos.y,
          this.alpha,
          this.alpha === 0 ? -1 : drawingLayer.getActiveSegment()
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
      if (this.drawAction) {
        history.push(this.drawAction);
        this.drawAction = null;
      }
    }
  }
}
