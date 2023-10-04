import * as THREE from "three";
import { Tool } from "../tool";
import { DrawingLayer } from "../../drawing-layer";
import { Dispatch, SetStateAction } from "react";
import { ActionHistory, CanvasAction } from "../../action-history";

/**
 * This is the alpha used to fill in points when drawing.
 */
export const kDrawAlpha = 0.5;

/**
 * Tool for drawing strokes with the cursor.
 */
export abstract class DrawTool extends Tool {
  /**
   * The mouse position on the last frame.
   */
  private lastMousePos: THREE.Vector2 | null;

  /**
   * The action that is being drawn, or null if the cursor is not down.
   */
  private drawAction: CanvasAction | null;

  constructor(size: number) {
    super(size);
    this.lastMousePos = null;
    this.drawAction = null;
  }

  /**
   * Function for applying the brush to the drawing layer.
   */
  protected abstract paint(params: {
    fill: (pos: THREE.Vector2) => void;
    size: number;
    pos: THREE.Vector2;
    resolution: THREE.Vector2;
  }): void;

  /**
   * The segment that is being drawn. Tools can override this for
   * finer control over the drawing.
   */
  protected abstract drawingSegment(activeSegment: number): number;

  public frameCallback(
    cursorDown: boolean,
    zooming: boolean,
    mousePos: THREE.Vector2,
    zoom: number,
    pan: THREE.Vector2,
    setZoom: Dispatch<SetStateAction<number>>,
    setPan: Dispatch<SetStateAction<THREE.Vector2>>,
    drawingLayer: DrawingLayer,
    history: ActionHistory,
    activeSegment: number
  ): void {
    // don't draw if zooming
    if (cursorDown && !zooming) {
      // if the cursor has just been pressed, initialize the draw action
      if (!this.drawAction) {
        this.drawAction = new CanvasAction(drawingLayer);
      }
      const drawAction = this.drawAction;

      const fill = (pos: THREE.Vector2) => {
        // the segment we are drawing over
        const oldSegment = drawingLayer.segment(pos.x, pos.y);

        // the new segment to draw
        const drawSegment = this.drawingSegment(activeSegment);

        // if we have already drawn over the point, we won't write it into
        // the action history again, because undoing resets back to the
        // state before drawing any points, so only the first point we
        // draw over needs to be recorded.
        if (!drawAction.paintedPoints.hasPoint(pos.x, pos.y)) {
          drawAction.paintedPoints.setPoint(pos.x, pos.y, {
            newSegment: drawSegment,
            oldSegment: oldSegment,
          });
        }

        // Updates the segment in the drawing layer. Passing drawAction
        // as the last argument will cause the updates boundaries to be
        // recorded in the action history.
        drawingLayer.setSegment(pos.x, pos.y, drawSegment, drawAction);
      };

      // paint the point at the mouse position
      this.paint({
        fill,
        size: this.size,
        pos: mousePos,
        resolution: drawingLayer.pixelSize,
      });

      // if the cursor was already down on the last frame as well,
      // interpolate between the last mouse position and the current
      // mouse position and paint all the points in between.
      if (this.lastMousePos) {
        // current point in the interpolation
        const current = mousePos.clone();

        // step vector for the interpolation. This is length of the brush
        // divided by 2. This ensures that the interpolation will always
        // cover the entire brush.
        const step = this.lastMousePos
          .clone()
          .sub(mousePos)
          .normalize()
          .multiplyScalar(this.size / 2);

        // the dot product is positive when the interpolation is not complete.
        while (step.dot(this.lastMousePos.clone().sub(current)) > 0) {
          this.paint({
            fill,
            size: this.size,
            pos: current.clone().floor(),
            resolution: drawingLayer.pixelSize,
          });
          current.add(step);
        }
      }

      // record the last mouse position so we can interpolate on the next frame
      // as well.
      this.lastMousePos = mousePos.clone();
    } else {
      // clearing the last mouse position will cause the next cursor press
      // to initialize a new draw action.
      this.lastMousePos = null;
      if (this.drawAction) {
        // calculate any splitting of segments
        drawingLayer.recomputeSegments(this.drawAction);

        // push onto undo/redo stack
        history.push(this.drawAction);

        // clear the draw action
        this.drawAction = null;
      }
    }
  }
}
