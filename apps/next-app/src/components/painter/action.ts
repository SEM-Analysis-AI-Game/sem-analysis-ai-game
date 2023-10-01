import { DrawingLayer } from "./drawing-layer";

export class CanvasAction {
  public readonly paintedPoints: Map<
    string,
    {
      pos: THREE.Vector2;
      oldSegment: number;
      newSegment: number;
    }
  >;
  public readonly drawingLayer: DrawingLayer;
  public readonly effectedSegments: Set<number>;
  public readonly drawnPoints: Set<string>;

  constructor(drawingLayer: DrawingLayer) {
    this.effectedSegments = new Set();
    this.drawnPoints = new Set();
    this.paintedPoints = new Map();
    this.drawingLayer = drawingLayer;
  }
}
