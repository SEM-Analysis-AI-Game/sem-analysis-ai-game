import { DrawingLayer } from "./drawing-layer";
import { PointContainer } from "./point-container";

export class CanvasAction {
  public readonly paintedPoints: PointContainer<{
    oldSegment: number;
    newSegment: number;
  }>;
  public readonly drawingLayer: DrawingLayer;
  public readonly effectedSegments: Map<
    number,
    { newBoundaryPoints: PointContainer }
  >;

  constructor(drawingLayer: DrawingLayer) {
    this.effectedSegments = new Map();
    this.paintedPoints = new PointContainer();
    this.drawingLayer = drawingLayer;
  }
}
