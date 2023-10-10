import { Dispatch } from "react";
import { CanvasAction } from "./action";
import { StatisticsEvent } from "../statistics";

/**
 * Represents a node in the action history linked list.
 *
 * We use a doubly-linked list because we need to be able to insert and remove nodes
 * at the back of the list in constant time, and traverse the list in both directions.
 */
type Node<T> = {
  next: Node<T> | null;
  prev: Node<T> | null;

  readonly data: T | null;
};

type Push = {
  type: "push";
  action: CanvasAction;
};

type Undo = {
  type: "undo";
};

type Redo = {
  type: "redo";
};

type Clear = {
  type: "clear";
};

export type ActionHistoryEvent = Push | Undo | Redo | Clear;

/**
 * This class represents the undo/redo history.
 */
export type ActionHistory = {
  readonly head: Node<CanvasAction>;
  current: Node<CanvasAction>;
  readonly updateStatistics: Dispatch<StatisticsEvent>;
};

export function historyReducer(
  state: ActionHistory,
  event: ActionHistoryEvent
): ActionHistory {
  switch (event.type) {
    case "push":
      const node = { data: event.action, next: null, prev: state.current };
      state.current.next = node;
      return {
        ...state,
        current: node,
      };
    case "clear":
      return {
        ...state,
        head: { data: null, next: null, prev: null },
        current: { data: null, next: null, prev: null },
      };
    case "redo":
      if (state.current.next) {
        const current = state.current.next;
        current.data!.paintedPoints.forEach((x, y, data) => {
          current.data!.drawingLayer.setSegment(x, y, data.newSegment);
          state.updateStatistics({
            type: "update",
            x,
            y,
            oldSegment: data.oldSegment,
            newSegment: data.newSegment,
          });
        });
        return {
          ...state,
          current,
        };
      } else {
        return state;
      }
    case "undo":
      if (state.current.prev) {
        state.current.data!.paintedPoints.forEach((x, y, data) => {
          // Utilize the old segment data to undo the action.
          // This is the segment that was painted over by the action.
          state.current.data!.drawingLayer.setSegment(x, y, data.oldSegment);
          state.updateStatistics({
            type: "update",
            x,
            y,
            oldSegment: data.newSegment,
            newSegment: data.oldSegment,
          });
        });
        return {
          ...state,
          current: state.current.prev,
        };
      } else {
        return state;
      }
  }
}
