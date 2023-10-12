import * as THREE from "three";
import { Dispatch } from "react";
import {
  DrawingLayer,
  getSegment,
  recomputeSegments,
  setSegment,
} from "../../drawing-layer";
import { ActionHistoryEvent, CanvasAction } from "../../action-history";
import { hasPoint, setPoint } from "../../point-container";
import { Controls } from "../../controls";

function handleFrame(
  state: DrawTool<string>,
  cursorPos: THREE.Vector2,
  controls: Controls,
  drawingLayer: DrawingLayer,
  activeSegment: number,
  updateHistory: Dispatch<ActionHistoryEvent>
): void {
  // don't draw if zooming
  if (controls.cursorDown && !controls.zooming) {
    // if the cursor has just been pressed, initialize the draw action
    if (!state.drawAction) {
      state.drawAction = {
        paintedPoints: {
          size: 0,
          points: new Map(),
        },
        effectedSegments: new Map(),
      };
    }
    const drawAction = state.drawAction;

    const drawingStatistics = new Map<
      number,
      { numPoints: number; sum: THREE.Vector2 }
    >();
    // the new segment to draw
    const drawSegment = state.drawingSegment(activeSegment);

    const fill = (pos: THREE.Vector2) => {
      // the segment we are drawing over
      const oldSegment = getSegment(drawingLayer, pos);

      // if we have already drawn over the point, we won't write it into
      // the action history again, because undoing resets back to the
      // state before drawing any points, so only the first point we
      // draw over needs to be recorded.
      if (!hasPoint(drawAction.paintedPoints, pos.x, pos.y)) {
        setPoint(drawAction.paintedPoints, pos.x, pos.y, {
          newSegment: drawSegment,
          oldSegment: oldSegment,
        });
      }

      if (drawSegment !== oldSegment) {
        if (drawingStatistics.has(oldSegment)) {
          const stat = drawingStatistics.get(oldSegment)!;
          stat.numPoints++;
          stat.sum.add(pos);
        } else {
          drawingStatistics.set(oldSegment, {
            numPoints: 1,
            sum: pos.clone(),
          });
        }
      }

      // Updates the segment in the drawing layer. Passing drawAction
      // as the last argument will cause the updates boundaries to be
      // recorded in the action history.
      setSegment(drawingLayer, pos, drawSegment, drawAction);
    };

    // paint the point at the cursor position
    state.paint(
      fill,
      state.size,
      cursorPos,
      drawingLayer.rendererState.pixelSize
    );

    // if the cursor was already down on the last frame as well,
    // interpolate between the last cursor position and the current
    // cursor position and paint all the points in between.
    if (state.lastCursorPos) {
      // current point in the interpolation
      const current = cursorPos.clone();

      // step vector for the interpolation. This is length of the brush
      // divided by 2. This ensures that the interpolation will always
      // cover the entire brush.
      const step = state.lastCursorPos
        .clone()
        .sub(cursorPos)
        .normalize()
        .multiplyScalar(state.size / 2);

      // the dot product is positive when the interpolation is not complete.
      while (step.dot(state.lastCursorPos.clone().sub(current)) > 0) {
        state.paint(
          fill,
          state.size,
          current.clone().floor(),
          drawingLayer.rendererState.pixelSize
        );
        current.add(step);
      }
    }

    if (drawingStatistics.size > 0) {
      for (let [segment, stat] of drawingStatistics) {
        drawingLayer.updateStatistics({
          type: "update",
          numPoints: stat.numPoints,
          pos: stat.sum,
          oldSegment: segment,
          newSegment: drawSegment,
        });
      }
    }

    // record the last cursor position so we can interpolate on the next frame
    // as well.
    state.lastCursorPos = cursorPos.clone();
  } else {
    // clearing the last cursor position will cause the next cursor press
    // to initialize a new draw action.
    state.lastCursorPos = null;
    if (state.drawAction) {
      // calculate any splitting of segments
      recomputeSegments(drawingLayer, state.drawAction);

      // push onto undo/redo stack
      updateHistory({
        type: "push",
        action: state.drawAction,
      });

      // clear the draw action
      state.drawAction = null;
    }
  }
}

/**
 * Tool for drawing strokes with the cursor.
 */
export type DrawTool<ToolName extends string> = {
  readonly name: ToolName;
  readonly size: number;

  /**
   * Function for applying the brush to the drawing layer.
   */
  readonly paint: (
    fill: (pos: THREE.Vector2) => void,
    size: number,
    pos: THREE.Vector2,
    resolution: THREE.Vector2
  ) => void;

  readonly handleFrame: typeof handleFrame;

  /**
   * The segment that is being drawn. Tools can override this for
   * finer control over the drawing.
   */
  readonly drawingSegment: (activeSegment: number) => number;

  /**
   * The cursor position on the last frame.
   */
  lastCursorPos: THREE.Vector2 | null;

  /**
   * The action that is being drawn, or null if the cursor is not down.
   */
  drawAction: CanvasAction | null;
};

export function drawTool<ToolName extends string>(
  name: ToolName,
  size: number,
  paint: (
    fill: (pos: THREE.Vector2) => void,
    size: number,
    pos: THREE.Vector2,
    resolution: THREE.Vector2
  ) => void,
  drawingSegment: (activeSegment: number) => number
): DrawTool<ToolName> {
  return {
    name,
    size,
    paint,
    handleFrame,
    drawingSegment,
    lastCursorPos: null,
    drawAction: null,
  };
}
