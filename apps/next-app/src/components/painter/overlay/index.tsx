import { UploadButton } from "@/components";
import { BrushSizeSlider } from "./brush-size-slider";
import { ToolbarButton } from "./toolbar-button";
import { ToolName, kToolFactory } from "../tools";

/**
 * Server-side rendered overlay for the painter.
 *
 * Tool names are rendered server-side.
 */
export function PainterOverlay(): JSX.Element {
  return (
    <div className="absolute z-10 left-8 top-0 flex flex-col">
      {Object.keys(kToolFactory).map((toolName) => (
        <ToolbarButton key={toolName} toolName={toolName as ToolName}>
          {toolName}
        </ToolbarButton>
      ))}
      <BrushSizeSlider />
      <UploadButton />
    </div>
  );
}
