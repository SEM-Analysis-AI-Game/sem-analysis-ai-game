import * as THREE from "three";
import { FrameCallbackParams } from "../renderer";

export type ToolNames =
  | "Circle Eraser"
  | "Square Eraser"
  | "Circle Brush"
  | "Square Brush"
  | "Pan";

export abstract class Tool {
  public abstract frameHandler(params: FrameCallbackParams): void;
  public abstract cursorOverlay(): THREE.Texture;
  public readonly panning: boolean = false;

  public abstract readonly name: ToolNames;

  constructor() {}
}
