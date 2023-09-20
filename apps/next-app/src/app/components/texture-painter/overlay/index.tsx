import { useContext } from "react";
import { TexturePainterActionDispatchContext } from "../context";
import { SetToolAction, SetToolColorAction } from "../state";
import { kToolFactory } from "../tools/factory";
import { ToolNames } from "../tools";
import colors from "../tools/colors";
import { Color } from "three";

export function TexturePainterOverlay(): JSX.Element {
  const painterDispatch = useContext(TexturePainterActionDispatchContext);
  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  return (
    <div className="absolute z-10 left-8 top-0 flex flex-col">
      {/* TOOLS */}
      {Object.keys(kToolFactory).map((toolName) => {
        return (
          <button
            className="text-[#333] bg-slate-100 rounded pl-2 pr-2 mt-1 mb-1 border-black border-2"
            key={toolName}
            onClick={() =>
              painterDispatch(new SetToolAction(toolName as ToolNames))
            }
          >
            {toolName}
          </button>
        );
      })}
      {/* COLORS */}
      <div className="grid grid-cols-2">
        {
          colors.map((color: Color) => {
            return (
              <button className={`rounded pl-2 pr-2 mt-1 mb-1 w-8 h-8 border-black border-2`} 
                      style={
                        {
                          backgroundColor: `#${color.getHexString()}`
                        }
                      } 
                      key={color.getHex()}
                      onClick={() => {
                        painterDispatch(new SetToolColorAction(color));
                      }}>
                
              </button>
            )
          })
        }
      </div>
    </div>
  );
}
