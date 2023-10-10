import * as THREE from "three";
import { Dispatch, SetStateAction } from "react";
import { Tool, ToolNames } from "../tool";
import { DrawingLayer } from "../../drawing-layer";
import { ActionHistory, CanvasAction } from "../../action-history";
import { PainterStatistics } from "../../statistics";

/**
 * This is the alpha used to fill in points when drawing.
 */
export const kDrawAlpha = 0.5;

/**
 * Tool for drawing strokes with the cursor.
 */
export abstract class DrawTool<Name extends ToolNames> extends Tool<Name> {
  /**
   * The cursor position on the last frame.
   */
  private lastCursorPos: THREE.Vector2 | null;

  /**
   * The action that is being drawn, or null if the cursor is not down.
   */
  private drawAction: CanvasAction | null;

  constructor(size: number) {
    super(size);
    this.lastCursorPos = null;
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
    cursorPos: THREE.Vector2,
    zoom: number,
    pan: THREE.Vector2,
    setZoom: Dispatch<SetStateAction<number>>,
    setPan: Dispatch<SetStateAction<THREE.Vector2>>,
    statistics: PainterStatistics,
    setStatistics: Dispatch<SetStateAction<PainterStatistics>>,
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

        // update the statistics for the old segment and the new segment
        setStatistics((stats) => {
          if (drawSegment !== -1) {
            const drawingSegmentStats = stats.segments.get(drawSegment);
            if (drawingSegmentStats) {
              if (drawingSegmentStats.numPoints > 0) {
                drawingSegmentStats.centroid
                  .multiplyScalar(drawingSegmentStats.numPoints)
                  .add(pos)
                  .divideScalar(drawingSegmentStats.numPoints + 1);
              } else {
                drawingSegmentStats.centroid.set(pos.x, pos.y);
              }
              drawingSegmentStats.numPoints++;
            } else {
              stats.segments.set(drawSegment, {
                numPoints: 1,
                centroid: pos.clone(),
                medianEstimate: new THREE.Vector2(),
              });
            }
          }
          if (oldSegment !== -1) {
            const oldSegmentStats = stats.segments.get(oldSegment);
            if (oldSegmentStats) {
              oldSegmentStats.centroid
                .multiplyScalar(oldSegmentStats.numPoints)
                .sub(pos)
                .divideScalar(oldSegmentStats.numPoints - 1);
              oldSegmentStats.numPoints--;
            } else {
              throw new Error("old segment not found");
            }
          }
          return {
            segments: stats.segments,
          };
        });

        // Updates the segment in the drawing layer. Passing drawAction
        // as the last argument will cause the updates boundaries to be
        // recorded in the action history.
        drawingLayer.setSegment(pos.x, pos.y, drawSegment, drawAction);
      };

      // paint the point at the cursor position
      this.paint({
        fill,
        size: this.size,
        pos: cursorPos,
        resolution: drawingLayer.pixelSize,
      });

      // if the cursor was already down on the last frame as well,
      // interpolate between the last cursor position and the current
      // cursor position and paint all the points in between.
      if (this.lastCursorPos) {
        // current point in the interpolation
        const current = cursorPos.clone();

        // step vector for the interpolation. This is length of the brush
        // divided by 2. This ensures that the interpolation will always
        // cover the entire brush.
        const step = this.lastCursorPos
          .clone()
          .sub(cursorPos)
          .normalize()
          .multiplyScalar(this.size / 2);

        // the dot product is positive when the interpolation is not complete.
        while (step.dot(this.lastCursorPos.clone().sub(current)) > 0) {
          this.paint({
            fill,
            size: this.size,
            pos: current.clone().floor(),
            resolution: drawingLayer.pixelSize,
          });
          current.add(step);
        }
      }

      // record the last cursor position so we can interpolate on the next frame
      // as well.
      this.lastCursorPos = cursorPos.clone();
    } else {
      // clearing the last cursor position will cause the next cursor press
      // to initialize a new draw action.
      this.lastCursorPos = null;
      if (this.drawAction) {
        // calculate any splitting of segments
        drawingLayer.recomputeSegments(this.drawAction, setStatistics);

        // push onto undo/redo stack
        history.push(this.drawAction);

        // clear the draw action
        this.drawAction = null;
      }
    }
  }
}
