"use client";

import { UploadButton } from "@/components";
import { BrushSizeSlider } from "./brush-size-slider";
import { ToolbarButton } from "./toolbar-button";
import { ToolName, kToolFactory } from "../tools";
import { useTool } from "../tools";

/**
 * Server-side rendered toolbar for the painter.
 *
 * Tool names are rendered server-side.
 */
export function Toolbar(): JSX.Element {
  const [tool] = useTool();

  return (
    <div className="flex flex-row justify-center">
      {Object.keys(kToolFactory).map((toolName) => (
        <ToolbarButton
          key={toolName}
          toolName={toolName as ToolName}
          selected={tool?.name === toolName}
        >
          {toolName}
        </ToolbarButton>
      ))}
      <BrushSizeSlider />
      <UploadButton />
    </div>
  );
}
