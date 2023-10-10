"use client";

import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { PainterStatistics } from "./statistics";
import { useBackground } from "../background-loader";

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

  const [background] = useBackground();

  useEffect(() => {
    statistics[1]({
      segments: new Map(),
    });
  }, [background]);

  return (
    <PainterStatisticsContext.Provider value={statistics}>
      {props.children}
    </PainterStatisticsContext.Provider>
  );
}
