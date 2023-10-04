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
import { CircleBrush } from "./draw";

/**
 * Context for the current tool.
 */
export const ToolContext = createContext<
  [Tool, Dispatch<SetStateAction<Tool>>] | null
>(null);

/**
 * Hook to get/set the current tool. Must be used within a ToolContext.
 */
export function useTool(): [Tool, Dispatch<SetStateAction<Tool>>] {
  const tool = useContext(ToolContext);

  if (!tool) {
    throw new Error("useTool must be used within a ToolContext");
  }

  return tool;
}

export const kInitialToolSize = 100;

const kInitialTool = new CircleBrush(kInitialToolSize);

/**
 * Provider for the current tool.
 */
export function PainterToolProvider(props: PropsWithChildren): JSX.Element {
  const toolState = useState<Tool>(kInitialTool);

  return (
    <ToolContext.Provider value={toolState}>
      {props.children}
    </ToolContext.Provider>
  );
}
