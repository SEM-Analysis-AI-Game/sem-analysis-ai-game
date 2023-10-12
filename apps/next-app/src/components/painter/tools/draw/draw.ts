import * as THREE from "three";
import { Dispatch } from "react";
import {
  DrawingLayer,
  getSegment,
  incrementSegments,
  recomputeSegments,
  setSegment,
} from "../../drawing-layer";
import { ActionHistoryEvent, HistoryAction } from "../../action-history";
import { PointContainer, hasPoint, setPoint } from "../../point-container";
import { Controls } from "../../controls";

export type ActionState = {
  /**
   * The segments that were effected by this action. This is used for
   * determining if a segment needs to be split.
   *
   * The key is the segment ID, and the value is the new boundary points that
   * were created by this action.
   *
   * This container is mutable, because it can be modified on
   * every frame. If it were immutable, we would have to copy it
   * on every update, which would be extremely slow.
   */
  readonly effectedSegments: Map<number, { newBoundaryPoints: PointContainer }>;

  /**
   * The cursor position on the last frame.
   */
  lastCursorPos: THREE.Vector2;

  /**
   * The history action for undo/redo.
   */
  historyAction: HistoryAction;

  /**
   * The segment that is currently being drawn.
   */
  activeSegment: number;
};

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
   * The current drawing action, or null if the cursor is not down.
   */
  actionState: ActionState | null;
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
    actionState: null,
  };
}

function handleFrame(
  state: DrawTool<string>,
  cursorPos: THREE.Vector2,
  controls: Controls,
  drawingLayer: DrawingLayer,
  updateHistory: Dispatch<ActionHistoryEvent>
): void {
  // don't draw if zooming
  if (controls.cursorDown && !controls.zooming) {
    // if the cursor has just been pressed, initialize the draw action
    if (!state.actionState) {
      // get the segment at the cursor position
      let segment = getSegment(drawingLayer, cursorPos);

      // if no segment is found at the cursor position, increment the
      // number of segments and use the new segment, otherwise use the found
      // segment.
      if (segment === -1) {
        incrementSegments(drawingLayer);
        segment = drawingLayer.segmentMap.size;
      }

      state.actionState = {
        historyAction: {
          paintedPoints: {
            size: 0,
            points: new Map(),
          },
        },
        activeSegment: segment,
        effectedSegments: new Map(),
        lastCursorPos: cursorPos.clone(),
      };
    }

    const historyAction = state.actionState.historyAction;
    const effectedSegments = state.actionState.effectedSegments;

    const drawingStatistics = new Map<
      number,
      { numPoints: number; sum: THREE.Vector2 }
    >();
    // the new segment to draw
    const drawSegment = state.drawingSegment(state.actionState.activeSegment);

    const fill = (pos: THREE.Vector2) => {
      // the segment we are drawing over
      const oldSegment = getSegment(drawingLayer, pos);

      // if we have already drawn over the point, we won't write it into
      // the action history again, because undoing resets back to the
      // state before drawing any points, so only the first point we
      // draw over needs to be recorded.
      if (!hasPoint(historyAction.paintedPoints, pos.x, pos.y)) {
        setPoint(historyAction.paintedPoints, pos.x, pos.y, {
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
      setSegment(drawingLayer, pos, drawSegment, effectedSegments);
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
    if (state.actionState) {
      // current point in the interpolation
      const current = cursorPos.clone();

      // step vector for the interpolation. This is length of the brush
      // divided by 2. This ensures that the interpolation will always
      // cover the entire brush.
      const step = state.actionState.lastCursorPos
        .clone()
        .sub(cursorPos)
        .normalize()
        .multiplyScalar(state.size / 2);

      // the dot product is positive when the interpolation is not complete.
      while (
        step.dot(state.actionState.lastCursorPos.clone().sub(current)) > 0
      ) {
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
    state.actionState.lastCursorPos = cursorPos.clone();
  } else if (state.actionState) {
    // calculate any splitting of segments
    recomputeSegments(drawingLayer, state.actionState);

    // push onto undo/redo stack
    updateHistory({
      type: "push",
      action: state.actionState.historyAction,
    });

    // clear the draw action
    state.actionState = null;
  }
}
