"use client";

import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { ActionHistory, ActionHistoryEvent, historyReducer } from "./history";
import { useDrawingLayer } from "../drawing-layer";
import { useStatistics } from "../statistics";

/**
 * Context for the current action history.
 */
export const ActionHistoryContext = createContext<
  [ActionHistory, Dispatch<ActionHistoryEvent>] | null
>(null);

/**
 * Hook to get the current action history. Must be used within an ActionHistoryContext.
 */
export function useActionHistory(): [
  ActionHistory,
  Dispatch<ActionHistoryEvent>
] {
  const history = useContext(ActionHistoryContext);

  if (!history) {
    throw new Error(
      "useActionHistory must be used within an ActionHistoryContext"
    );
  }

  return history;
}

/**
 * Provider for the current action history.
 */
export function ActionHistoryProvider(props: PropsWithChildren): JSX.Element {
  // the action history needs to be able to update the drawing layer
  const [drawingLayer] = useDrawingLayer();

  const history = useReducer(historyReducer, {
    drawingLayer,
    head: { prev: null, next: null, data: null },
    current: { prev: null, next: null, data: null },
    recentStatisticsUpdates: null,
  });

  // clear the history when the drawing layer changes
  useEffect(() => {
    history[1]({ type: "reset", drawingLayer });
  }, [drawingLayer]);

  const [, updateStatistics] = useStatistics();

  useEffect(() => {
    // batch update the statistics
    if (history[0].recentStatisticsUpdates) {
      for (let [segment, stat] of history[0].recentStatisticsUpdates) {
        updateStatistics({
          type: "update",
          numPoints: stat.numPoints,
          sum: stat.sum,
          oldSegment: -1,
          newSegment: segment,
        });
      }
    }
  }, [history[0]]);

  return (
    <ActionHistoryContext.Provider value={history}>
      {props.children}
    </ActionHistoryContext.Provider>
  );
}
