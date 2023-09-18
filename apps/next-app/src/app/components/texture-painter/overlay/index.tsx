import { Tool } from '../tools';
import { TexturePainterToolbar } from './toolbar';

export function TexturePainterOverlay(props: { updateTool: (tool: Tool) => void }): JSX.Element {
  return <TexturePainterToolbar currentToolName={'Circle Brush'} updateTool={props.updateTool} />;
}
