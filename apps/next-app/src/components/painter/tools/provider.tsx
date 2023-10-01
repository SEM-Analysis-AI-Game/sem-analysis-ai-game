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

export const ToolContext = createContext<
  [Tool, Dispatch<SetStateAction<Tool>>] | null
>(null);

export function useTool(): [Tool, Dispatch<SetStateAction<Tool>>] {
  const tool = useContext(ToolContext);

  if (!tool) {
    throw new Error("useTool must be used within a ToolContext");
  }

  return tool;
}

export const kInitialToolSize = 100;

const kInitialTool = new CircleBrush(kInitialToolSize);

export function PainterToolProvider(props: PropsWithChildren): JSX.Element {
  const toolState = useState<Tool>(kInitialTool);

  return (
    <ToolContext.Provider value={toolState}>
      {props.children}
    </ToolContext.Provider>
  );
}
