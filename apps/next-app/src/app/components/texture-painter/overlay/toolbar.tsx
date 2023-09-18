import * as THREE from "three";
import { Tool, ToolName } from "../tools";
import {
  circleBrush,
  circleEraser,
  squareBrush,
  squareEraser,
} from "../tools/draw";

const kTools: ToolName[] = [
  "Circle Brush",
  "Circle Eraser",
  "Square Brush",
  "Square Eraser",
];

const kToolBuilders: { [key in ToolName]: () => Tool<key> } = {
  "Circle Brush": () => circleBrush(20.0, new THREE.Color(0xff0000), 1.0),
  "Circle Eraser": () => circleEraser(20.0, 1.0),
  "Square Brush": () => squareBrush(40.0, new THREE.Color(0xff0000), 1.0),
  "Square Eraser": () => squareEraser(40.0, 1.0),
};

export function TexturePainterToolbar(props: {
  currentToolName: ToolName;
  updateTool: (tool: Tool) => void;
}): JSX.Element {
  return (
    <div className="absolute z-10 left-1/2 -translate-x-1/2">
      {kTools.map((toolName) => {
        return (
          <button
            key={toolName}
            onClick={() => props.updateTool(kToolBuilders[toolName]())}
          >
            {toolName}
          </button>
        );
      })}
    </div>
  );
}
