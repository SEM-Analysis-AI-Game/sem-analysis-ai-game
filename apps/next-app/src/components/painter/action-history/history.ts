import * as THREE from "three";
import { HistoryAction } from "./action";
import { DrawingLayer, setSegment } from "../drawing-layer";
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
  action: HistoryAction;
};

type Undo = {
  type: "undo";
};

type Redo = {
  type: "redo";
};

type Reset = {
  type: "reset";
  drawingLayer: DrawingLayer;
};

export type ActionHistoryEvent = Push | Undo | Redo | Reset;

/**
 * This represents the undo/redo history.
 */
export type ActionHistory = {
  readonly head: Node<HistoryAction>;
  readonly drawingLayer: DrawingLayer;
  readonly current: Node<HistoryAction>;
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
    case "reset":
      return {
        drawingLayer: event.drawingLayer,
        head: { data: null, next: null, prev: null },
        current: { data: null, next: null, prev: null },
      };
    case "redo":
      if (state.current.next) {
        const current = state.current.next;
        const statistics = new Map<
          number,
          { numPoints: number; sum: THREE.Vector2 }
        >();
        forEachPoint(current.data!.paintedPoints, (x, y, data) => {
          if (!statistics.has(data.newSegment)) {
            statistics.set(data.newSegment, {
              numPoints: 1,
              sum: new THREE.Vector2(x, y),
            });
          } else {
            const stat = statistics.get(data.newSegment)!;
            stat.numPoints++;
            stat.sum.add(new THREE.Vector2(x, y));
          }

          if (!statistics.has(data.oldSegment)) {
            statistics.set(data.oldSegment, {
              numPoints: -1,
              sum: new THREE.Vector2(-x, -y),
            });
          } else {
            const stat = statistics.get(data.oldSegment)!;
            stat.numPoints--;
            stat.sum.sub(new THREE.Vector2(x, y));
          }

          setSegment(
            state.drawingLayer,
            new THREE.Vector2(x, y),
            data.newSegment,
            null
          );
        });

        for (let [segment, stat] of statistics) {
          state.drawingLayer.updateStatistics({
            type: "update",
            numPoints: stat.numPoints,
            pos: stat.sum,
            oldSegment: -1,
            newSegment: segment,
          });
        }

        return {
          ...state,
          current,
        };
      } else {
        return state;
      }
    case "undo":
      if (state.current.prev) {
        const statistics = new Map<
          number,
          { numPoints: number; sum: THREE.Vector2 }
        >();
        forEachPoint(state.current.data!.paintedPoints, (x, y, data) => {
          if (!statistics.has(data.newSegment)) {
            statistics.set(data.newSegment, {
              numPoints: -1,
              sum: new THREE.Vector2(-x, -y),
            });
          } else {
            const stat = statistics.get(data.newSegment)!;
            stat.numPoints--;
            stat.sum.sub(new THREE.Vector2(x, y));
          }

          if (!statistics.has(data.oldSegment)) {
            statistics.set(data.oldSegment, {
              numPoints: 1,
              sum: new THREE.Vector2(x, y),
            });
          } else {
            const stat = statistics.get(data.oldSegment)!;
            stat.numPoints++;
            stat.sum.add(new THREE.Vector2(x, y));
          }

          setSegment(
            state.drawingLayer,
            new THREE.Vector2(x, y),
            data.oldSegment,
            null
          );
        });

        for (let [segment, stat] of statistics) {
          state.drawingLayer.updateStatistics({
            type: "update",
            numPoints: stat.numPoints,
            pos: stat.sum,
            oldSegment: -1,
            newSegment: segment,
          });
        }

        return {
          ...state,
          current: state.current.prev,
        };
      } else {
        return state;
      }
  }
}
