import { DrawingLayer } from "./drawing-layer";
import { PointContainer } from "./point-container";

export class CanvasAction {
  public readonly paintedPoints: PointContainer<{
    oldSegment: number;
    newSegment: number;
  }>;
  public readonly drawingLayer: DrawingLayer;
  public readonly affectedSegments: Set<number>;

  constructor(drawingLayer: DrawingLayer) {
    this.affectedSegments = new Set();
    this.paintedPoints = new PointContainer();
    this.drawingLayer = drawingLayer;
  }
}
