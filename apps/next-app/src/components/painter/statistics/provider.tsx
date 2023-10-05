"use client";

import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { PainterStatistics } from "./statistics";

/**
 * Context for the current statistics.
 */
export const PainterStatisticsContext = createContext<
  [PainterStatistics, Dispatch<SetStateAction<PainterStatistics>>] | null
>(null);

/**
 * Get/Set the current statistics. Must be used within a PainterStatisticsContext.
 */
export function useStatistics(): [
  PainterStatistics,
  Dispatch<SetStateAction<PainterStatistics>>
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
  const statistics = useState({
    segments: new Map(),
  });

  return (
    <PainterStatisticsContext.Provider value={statistics}>
      {props.children}
    </PainterStatisticsContext.Provider>
  );
}
