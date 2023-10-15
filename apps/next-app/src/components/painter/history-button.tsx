"use client";

import { PropsWithChildren } from "react";
import { useActionHistory } from "./action-history";

export function HistoryButton(
  props: { type: "Redo" | "Undo" }
): JSX.Element {
  const [, updateHistory] = useActionHistory();

  return (
    <button
      className="text-[#333] bg-slate-100 rounded p-1 m-1 border-black border-2"
      key="undo-button"
      onClick={() =>
        updateHistory({ type: props.type.toLowerCase() as "redo" | "undo" })
      }
    >
      <img src={`${props.type.toLowerCase()}.png`} className="rounded w-5" />
    </button>
  );
}
