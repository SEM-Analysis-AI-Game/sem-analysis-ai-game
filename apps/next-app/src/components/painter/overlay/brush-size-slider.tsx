"use client";

import { circleBrush, kToolFactory, useTool } from "../tools";

export const kInitialToolSize = 100;

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
        const size = Number.parseInt(e.currentTarget.value);
        setTool(tool ? kToolFactory[tool.name](size) : circleBrush(size));
      }}
    />
  );
}
