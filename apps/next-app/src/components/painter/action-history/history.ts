import * as THREE from "three";
import { Dispatch } from "react";
import { CanvasAction } from "./action";
import { StatisticsEvent } from "../statistics";
import { setSegment } from "../drawing-layer";
import { forEachPoint } from "../point-container";

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
 * This represents the undo/redo history.
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
        forEachPoint(current.data!.paintedPoints, (x, y, data) => {
          const pos = new THREE.Vector2(x, y);
          setSegment(current.data!.drawingLayer, pos, data.newSegment);
          state.updateStatistics({
            pos,
            type: "update",
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
        forEachPoint(state.current.data!.paintedPoints, (x, y, data) => {
          const pos = new THREE.Vector2(x, y);
          setSegment(state.current.data!.drawingLayer, pos, data.oldSegment);
          state.updateStatistics({
            type: "update",
            oldSegment: data.newSegment,
            newSegment: data.oldSegment,
            pos,
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
