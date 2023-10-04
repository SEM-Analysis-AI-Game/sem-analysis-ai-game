import * as THREE from "three";
import { Dispatch, SetStateAction } from "react";
import { DrawingLayer } from "../drawing-layer";
import { ActionHistory } from "../action-history";

/**
 * The names of the tools. These are shown on the toolbar.
 */
export type ToolNames =
  | "Circle Eraser"
  | "Square Eraser"
  | "Circle Brush"
  | "Square Brush"
  | "Pan";

export abstract class Tool<T extends ToolNames = ToolNames> {
  public abstract readonly name: T;
  public readonly size: number;

  public abstract frameCallback(
    cursorDown: boolean,
    zooming: boolean,
    cursorPos: THREE.Vector2,
    zoom: number,
    pan: THREE.Vector2,
    setZoom: Dispatch<SetStateAction<number>>,
    setPan: Dispatch<SetStateAction<THREE.Vector2>>,
    drawingLayer: DrawingLayer,
    history: ActionHistory,
    activeSegment: number
  ): void;

  constructor(size: number) {
    this.size = size;
  }
}
