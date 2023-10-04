"use client";

import { kInitialToolSize, useTool } from "../tools";
import { kToolFactory } from "./tool-factory";

/**
 * A slider to control the size of the current tool.
 */
export function BrushSizeSlider(): JSX.Element {
  const [tool, setTool] = useTool();

  return (
    <input
      type="range"
      className="opacity-80 hover:opacity-100 bg-cyan-800 transition outline-none"
      min={5}
      max={300}
      defaultValue={kInitialToolSize}
      onChange={(e) => {
        setTool(
          new kToolFactory[tool.name](Number.parseInt(e.currentTarget.value))
        );
      }}
    />
  );
}
