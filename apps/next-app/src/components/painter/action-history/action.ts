import { DrawingLayer } from "../drawing-layer";
import { PointContainer } from "../point-container";

/**
 * This class represents an action that can be undone or redone.
 */
export class CanvasAction {
  /**
   * The points that were painted by this action.
   */
  public readonly paintedPoints: PointContainer<{
    oldSegment: number;
    newSegment: number;
  }>;

  /**
   * The drawing layer that this action was applied to.
   */
  public readonly drawingLayer: DrawingLayer;

  /**
   * The segments that were effected by this action.
   *
   * The key is the segment ID, and the value is the new boundary points that
   * were created by this action. These boundary points are used to determine
   * if a segment needs to be split.
   */
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
