"use client";

import { Dispatch, createContext, useContext, useReducer } from "react";
import { ActionHistory, ActionHistoryEvent, historyReducer } from "./history";
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
export function ActionHistoryProvider(props: {
  children: JSX.Element;
}): JSX.Element {
  const [, updateStatistics] = useStatistics();

  const history = useReducer(
    historyReducer,
    { prev: null, next: null, data: null },
    (head) => ({
      head,
      updateStatistics,
      current: head,
    })
  );

  return (
    <ActionHistoryContext.Provider value={history}>
      {props.children}
    </ActionHistoryContext.Provider>
  );
}
