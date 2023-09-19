import { useContext } from "react";
import { TexturePainterActionDispatchContext } from "../context";
import { SetToolAction } from "../state";
import { kToolFactory } from "../tools/factory";
import { ToolNames } from "../tools";

export function TexturePainterOverlay(): JSX.Element {
  const painterDispatch = useContext(TexturePainterActionDispatchContext);
  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  return (
    <div className="absolute z-10 left-1/2 -translate-x-1/2 top-0">
      {Object.keys(kToolFactory).map((toolName) => {
        return (
          <button
            className="text-[#ff0000] pl-8 pr-8"
            key={toolName}
            onClick={() =>
              painterDispatch(new SetToolAction(toolName as ToolNames))
            }
          >
            {toolName}
          </button>
        );
      })}
    </div>
  );
}
