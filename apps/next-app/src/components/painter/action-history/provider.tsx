"use client";

import { createContext, useContext, useMemo } from "react";
import { ActionHistory } from "./history";

/**
 * Context for the current action history.
 */
export const ActionHistoryContext = createContext<ActionHistory | null>(null);

/**
 * Hook to get the current action history. Must be used within an ActionHistoryContext.
 */
export function useActionHistory(): ActionHistory {
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
  const history = useMemo(() => new ActionHistory(), []);

  return (
    <ActionHistoryContext.Provider value={history}>
      {props.children}
    </ActionHistoryContext.Provider>
  );
}
