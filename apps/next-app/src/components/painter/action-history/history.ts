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

export type ActionHistoryEvent = Push | Undo | Redo | Reset;

/**
 * Push a new action onto the history.
 */
type Push = {
  type: "push";
  action: HistoryAction;
};

/**
 * Undo the last action.
 */
type Undo = {
  type: "undo";
};

/**
 * Redo the last undone action.
 */
type Redo = {
  type: "redo";
};

/**
 * Reset the history.
 */
type Reset = {
  type: "reset";
  drawingLayer: DrawingLayer;
};

/**
 * This represents the undo/redo history. (doubly-linked list)
 */
export type ActionHistory = {
  readonly head: Node<HistoryAction>;
  readonly drawingLayer: DrawingLayer;
  readonly current: Node<HistoryAction>;
  readonly recentStatisticsUpdates: StatisticsMap | null;
};

/**
 * Tracks statistics for a single action. This is useful for
 * batch updating the statistics reducer.
 */
class StatisticsMap extends Map<
  number,
  { numPoints: number; sum: THREE.Vector2 }
> {}

/**
 * Update the statistics map for a single point.
 */
function updateStatistics(
  statistics: StatisticsMap,
  newSegment: number,
  oldSegment: number,
  pos: THREE.Vector2
): void {
  if (!statistics.has(newSegment)) {
    statistics.set(newSegment, {
      numPoints: 1,
      sum: pos.clone(),
    });
  } else {
    const stat = statistics.get(newSegment)!;
    stat.numPoints++;
    stat.sum.add(pos);
  }

  if (!statistics.has(oldSegment)) {
    statistics.set(oldSegment, {
      numPoints: -1,
      sum: pos.clone().negate(),
    });
  } else {
    const stat = statistics.get(oldSegment)!;
    stat.numPoints--;
    stat.sum.sub(pos.clone());
  }
}

/**
 * Produces a new action history state given an event. The painted
 * points point container is mutated in place for all events except
 * for "reset".
 */
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
        recentStatisticsUpdates: null,
      };
    case "reset":
      return {
        drawingLayer: event.drawingLayer,
        head: { data: null, next: null, prev: null },
        current: { data: null, next: null, prev: null },
        recentStatisticsUpdates: null,
      };
    case "redo":
      if (state.current.next) {
        const current = state.current.next;
        const statistics = new StatisticsMap();
        forEachPoint(current.data!.paintedPoints, (x, y, data) => {
          const pos = new THREE.Vector2(x, y);
          updateStatistics(statistics, data.newSegment, data.oldSegment, pos);
          setSegment(state.drawingLayer, pos, data.newSegment, null);
        });

        return {
          ...state,
          current,
          recentStatisticsUpdates: statistics,
        };
      } else {
        return state;
      }
    case "undo":
      if (state.current.prev) {
        const statistics = new StatisticsMap();
        forEachPoint(state.current.data!.paintedPoints, (x, y, data) => {
          const pos = new THREE.Vector2(x, y);
          updateStatistics(statistics, data.oldSegment, data.newSegment, pos);
          setSegment(state.drawingLayer, pos, data.oldSegment, null);
        });

        return {
          ...state,
          current: state.current.prev,
          recentStatisticsUpdates: statistics,
        };
      } else {
        return state;
      }
  }
}
