import * as THREE from "three";
import { Controls } from "../controls";
import { DrawingLayer } from "../drawing-layer";
import { Dispatch, SetStateAction } from "react";
import { ActionHistory } from "../action-history";

export type ToolNames =
  | "Circle Eraser"
  | "Square Eraser"
  | "Circle Brush"
  | "Square Brush"
  | "Pan";

export abstract class Tool {
  public abstract readonly name: ToolNames;
  public readonly size: number;

  public abstract frameCallback(
    cursorDown: boolean,
    zooming: boolean,
    mousePos: THREE.Vector2,
    controls: Controls,
    setControls: Dispatch<SetStateAction<Controls>>,
    drawingLayer: DrawingLayer,
    history: ActionHistory
  ): void;

  constructor(size: number) {
    this.size = size;
  }
}
