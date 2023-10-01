import { UploadButton } from "@/components";
import { ToolNames, kColors, kToolFactory } from "../tools";
import { BrushSizeSlider } from "./brush-size-slider";
import { ColorButton } from "./color-button";
import { ToolbarButton } from "./toolbar-button";

export function PainterOverlay(): JSX.Element {
  return (
    <div className="absolute z-10 left-8 top-0 flex flex-col">
      {Object.keys(kToolFactory).map((toolName) => (
        <ToolbarButton key={toolName} toolName={toolName as ToolNames}>
          {toolName}
        </ToolbarButton>
      ))}
      <BrushSizeSlider />
      <div className="grid grid-cols-2">
        {kColors.map((color: string) => (
          <ColorButton key={color} color={color} />
        ))}
      </div>
      <UploadButton />
    </div>
  );
}
