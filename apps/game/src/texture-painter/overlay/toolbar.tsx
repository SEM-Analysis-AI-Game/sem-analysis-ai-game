import { ToolName } from '../tools';

const kTools: ToolName[] = ['brush', 'eraser'];

export function TexturePainterToolbar(props: {
  currentToolName: ToolName;
  updateTool: (tool: ToolName) => void;
}): JSX.Element {
  return (
    <div className="texture-painter-toolbar">
      {kTools.map(toolName => {
        return (
          <button key={toolName} onClick={() => props.updateTool(toolName)}>
            {toolName}
          </button>
        );
      })}
    </div>
  );
}
