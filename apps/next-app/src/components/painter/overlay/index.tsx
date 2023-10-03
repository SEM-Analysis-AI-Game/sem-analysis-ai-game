import { UploadButton } from "@/components";
import { ToolNames, kToolFactory } from "../tools";
import { BrushSizeSlider } from "./brush-size-slider";
import { ToolbarButton } from "./toolbar-button";
import { ProgressTracker } from "./progress-tracker";

export function PainterOverlay(): JSX.Element {
  return (
    <div className="absolute z-10 left-8 top-0 flex flex-col">
      {Object.keys(kToolFactory).map((toolName) => (
        <ToolbarButton key={toolName} toolName={toolName as ToolNames}>
          {toolName}
        </ToolbarButton>
      ))}
      <BrushSizeSlider />
      <UploadButton />
      <ProgressTracker />
    </div>
  );
}
