"use client";

import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { Tool } from "./tool";

/**
 * Context for the current tool.
 */
export const ToolContext = createContext<
  [Tool | null, Dispatch<SetStateAction<Tool | null>>] | null
>(null);

/**
 * Hook to get/set the current tool. Must be used within a ToolContext.
 */
export function useTool(): [
  Tool | null,
  Dispatch<SetStateAction<Tool | null>>
] {
  const tool = useContext(ToolContext);

  if (!tool) {
    throw new Error("useTool must be used within a ToolContext");
  }

  return tool;
}

/**
 * Provider for the current tool.
 */
export function PainterToolProvider(props: PropsWithChildren): JSX.Element {
  const toolState = useState<Tool | null>(null);

  return (
    <ToolContext.Provider value={toolState}>
      {props.children}
    </ToolContext.Provider>
  );
}
