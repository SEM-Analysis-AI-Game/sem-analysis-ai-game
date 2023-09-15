import { FrameCallback } from '../renderer';

export type ToolName = 'Circle Brush' | 'Circle Eraser' | 'Square Brush' | 'Square Eraser';

export type Tool<Name extends ToolName = ToolName> = {
  name: Name;
  cursorOverlay: THREE.Texture;
  frameHandler: FrameCallback;
};
