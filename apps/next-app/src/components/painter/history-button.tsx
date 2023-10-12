"use client";

import { PropsWithChildren } from "react";
import { useActionHistory } from "./action-history";
import { useStatistics } from "./statistics";

export function HistoryButton(
  props: PropsWithChildren<{ type: "Redo" | "Undo" }>
): JSX.Element {
  const [, updateHistory] = useActionHistory();

  const [, updateStatistics] = useStatistics();

  return (
    <button
      className="text-[#333] bg-slate-100 rounded pl-2 pr-2 mt-1 mb-1 border-black border-2"
      key="undo-button"
      onClick={() =>
        updateHistory({ type: props.type.toLowerCase() as "redo" | "undo" })
      }
    >
      {props.children}
    </button>
  );
}
