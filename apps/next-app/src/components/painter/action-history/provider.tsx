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

  const history = useReducer(
    historyReducer,
    { prev: null, next: null, data: null },
    (head) => ({
      drawingLayer,
      head,
      current: head,
      recentStatisticsUpdates: null,
    })
  );

  const [, updateStatistics] = useStatistics();

  useEffect(() => {
    // if the history has been updated as a result of an undo/redo,
    // the recentStatisticsUpdates will be populated.
    if (history[0].recentStatisticsUpdates) {
      // update the statistics for the most recent undo/redo
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
