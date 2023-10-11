"use client";

import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import {
  PainterStatistics,
  StatisticsEvent,
  statisticsReducer,
} from "./statistics";
import { useBackground } from "../background-loader";

/**
 * Context for the current statistics.
 */
export const PainterStatisticsContext = createContext<
  [PainterStatistics, Dispatch<StatisticsEvent>] | null
>(null);

/**
 * Get/Set the current statistics. Must be used within a PainterStatisticsContext.
 */
export function useStatistics(): [
  PainterStatistics,
  Dispatch<StatisticsEvent>
] {
  const statistics = useContext(PainterStatisticsContext);

  if (!statistics) {
    throw new Error(
      "useStatistics must be used within a PainterStatisticsContext"
    );
  }

  return statistics;
}

export function StatisticsProvider(props: PropsWithChildren): JSX.Element {
  const statisticsState = useReducer(statisticsReducer, {
    segments: new Map(),
  });

  const [background] = useBackground();

  // clear the statistics when the background changes
  useEffect(() => {
    statisticsState[1]({ type: "clear" });
  }, [background]);

  return (
    <PainterStatisticsContext.Provider value={statisticsState}>
      {props.children}
    </PainterStatisticsContext.Provider>
  );
}
