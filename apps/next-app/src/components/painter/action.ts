import { DrawingLayer } from "./drawing-layer";

export class CanvasAction {
  public readonly paintedPoints: Map<
    string,
    {
      pos: THREE.Vector2;
      oldSegment: number;
      newSegment: number;
      oldAlpha: number;
      newAlpha: number;
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

  public redo(): void {
    for (let entry of this.paintedPoints.entries()) {
      this.drawingLayer.setSegment(
        entry[1].pos.x,
        entry[1].pos.y,
        entry[1].newAlpha,
        entry[1].newSegment
      );
    }
  }

  public undo(): void {
    for (let entry of this.paintedPoints.entries()) {
      this.drawingLayer.setSegment(
        entry[1].pos.x,
        entry[1].pos.y,
        entry[1].oldAlpha,
        entry[1].oldSegment
      );
    }
  }
}
