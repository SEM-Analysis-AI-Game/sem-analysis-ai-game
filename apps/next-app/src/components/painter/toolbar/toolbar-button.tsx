"use client";

import { PropsWithChildren } from "react";
import { useTool } from "../tools/provider";
import { ToolName, kToolFactory } from "../tools";

/**
 * Client-side interactive tool selection menu
 */
export function ToolbarButton(
  props: PropsWithChildren<{ toolName: ToolName, selected: boolean}>
): JSX.Element {
  const [tool, setTool] = useTool();

  return (
    <button
      className="text-[#333] bg-slate-100 rounded pl-2 pr-2 mt-1 mb-1 transition-colors border-black border-2"
      style={{
        backgroundColor: props.selected ? "blue" : "#f1f5f9"
      }}
      key={props.toolName}
      onClick={() => setTool(kToolFactory[props.toolName](tool.size))}
    >
      {props.children}
    </button>
  );
}
