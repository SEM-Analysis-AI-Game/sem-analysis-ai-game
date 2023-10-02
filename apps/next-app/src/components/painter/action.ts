import { DrawingLayer } from "./drawing-layer";
import { PointContainer } from "./point-container";

export class CanvasAction {
  public readonly paintedPoints: PointContainer<{
    oldSegment: number;
    newSegment: number;
  }>;
  public readonly drawingLayer: DrawingLayer;
  public readonly effectedSegments: Set<number>;

  constructor(drawingLayer: DrawingLayer) {
    this.effectedSegments = new Set();
    this.paintedPoints = new PointContainer();
    this.drawingLayer = drawingLayer;
  }
}
