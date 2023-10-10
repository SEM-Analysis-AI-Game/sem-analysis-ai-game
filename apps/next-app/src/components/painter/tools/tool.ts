import * as THREE from "three";
import { Dispatch, SetStateAction } from "react";
import { DrawingLayer } from "../drawing-layer";
import { StatisticsUpdate } from "../statistics";
import { ActionHistoryEvent } from "../action-history";
import { ControlsEvent } from "../controls";

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
    updateControls: Dispatch<ControlsEvent>,
    updateStatistics: Dispatch<StatisticsUpdate>,
    drawingLayer: DrawingLayer,
    updateHistory: Dispatch<ActionHistoryEvent>
  ): void;

  constructor(size: number) {
    this.size = size;
  }
}
