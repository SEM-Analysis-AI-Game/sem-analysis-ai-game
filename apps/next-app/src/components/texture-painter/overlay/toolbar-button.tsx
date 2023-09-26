"use client";

import { PropsWithChildren, useContext } from "react";
import { TexturePainterActionDispatchContext } from "../context";
import { SetToolAction } from "../state";
import { ToolNames } from "../tools";

export function ToolbarButton(
  props: PropsWithChildren<{ toolName: ToolNames }>
): JSX.Element {
  const painterDispatch = useContext(TexturePainterActionDispatchContext);
  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  return (
    <button
      className="text-[#333] bg-slate-100 rounded pl-2 pr-2 mt-1 mb-1 border-black border-2"
      key={props.toolName}
      onClick={() => painterDispatch(new SetToolAction(props.toolName))}
    >
      {props.children}
    </button>
  );
}
