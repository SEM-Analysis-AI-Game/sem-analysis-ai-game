"use client";

import { PropsWithChildren } from "react";
import { ToolNames, kToolFactory } from "../tools";
import { useTool } from "../tools/provider";

export function ToolbarButton(
  props: PropsWithChildren<{ toolName: ToolNames }>
): JSX.Element {
  const [tool, setTool] = useTool();

  return (
    <button
      className="text-[#333] bg-slate-100 rounded pl-2 pr-2 mt-1 mb-1 border-black border-2"
      key={props.toolName}
      onClick={() =>
        setTool(new kToolFactory[props.toolName](tool.color, tool.size))
      }
    >
      {props.children}
    </button>
  );
}
