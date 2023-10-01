import * as THREE from "three";
import { Controls } from "../controls";
import { DrawingLayer } from "../drawing-layer";
import { Dispatch, SetStateAction } from "react";

export type ToolNames =
  | "Circle Eraser"
  | "Square Eraser"
  | "Circle Brush"
  | "Square Brush"
  | "Pan";

export abstract class Tool {
  public abstract readonly name: ToolNames;
  public readonly color: THREE.Color;
  public readonly size: number;

  public abstract frameCallback(
    cursorDown: boolean,
    controls: Controls,
    drawingLayer: DrawingLayer
  ): void;

  constructor(color: THREE.Color, size: number) {
    this.color = color;
    this.size = size;
  }
}
