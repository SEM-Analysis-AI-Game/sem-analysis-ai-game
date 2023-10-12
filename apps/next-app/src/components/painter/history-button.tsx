"use client";

import { PropsWithChildren } from "react";
import { useActionHistory } from "./action-history";

export function HistoryButton(
  props: PropsWithChildren<{ type: "redo" | "undo" }>
): JSX.Element {
  const [, updateHistory] = useActionHistory();

  return (
    <button
      className="text-[#333] bg-slate-100 rounded pl-2 pr-2 mt-1 mb-1 border-black border-2"
      key="undo-button"
      onClick={() => updateHistory({ type: props.type })}
    >
      {props.children}
    </button>
  );
}
