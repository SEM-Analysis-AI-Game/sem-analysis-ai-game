import * as THREE from "three";
import { FrameCallbackParams } from "../renderer";

export type ToolNames =
  | "Circle Eraser"
  | "Square Eraser"
  | "Circle Brush"
  | "Square Brush";

export abstract class Tool {
  public abstract frameHandler(params: FrameCallbackParams): void;
  public abstract cursorOverlay(): THREE.Texture;

  public abstract readonly name: ToolNames;

  constructor() {}
}
