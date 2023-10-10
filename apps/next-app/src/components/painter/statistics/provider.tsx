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
  StatisticsClear,
  StatisticsUpdate,
  statisticsReducer,
} from "./statistics";
import { useBackground } from "../background-loader";

/**
 * Context for the current statistics.
 */
export const PainterStatisticsContext = createContext<
  [PainterStatistics, Dispatch<StatisticsUpdate | StatisticsClear>] | null
>(null);

/**
 * Get/Set the current statistics. Must be used within a PainterStatisticsContext.
 */
export function useStatistics(): [
  PainterStatistics,
  Dispatch<StatisticsUpdate | StatisticsClear>
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

  useEffect(() => {
    statisticsState[1](new StatisticsClear());
  }, [background]);

  return (
    <PainterStatisticsContext.Provider value={statisticsState}>
      {props.children}
    </PainterStatisticsContext.Provider>
  );
}
