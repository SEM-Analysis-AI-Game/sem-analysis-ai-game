"use client";

import { kInitialToolSize, kToolFactory, useTool } from "../tools";

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
