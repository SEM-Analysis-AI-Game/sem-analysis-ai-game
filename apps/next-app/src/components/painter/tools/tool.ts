import * as THREE from "three";
import { Dispatch } from "react";
import { DrawingLayer } from "../drawing-layer";
import { StatisticsEvent } from "../statistics";
import { ActionHistoryEvent } from "../action-history";
import { Controls, ControlsEvent } from "../controls";

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
    cursorPos: THREE.Vector2,
    controls: Controls,
    updateControls: Dispatch<ControlsEvent>,
    updateStatistics: Dispatch<StatisticsEvent>,
    drawingLayer: DrawingLayer,
    updateHistory: Dispatch<ActionHistoryEvent>
  ): void;

  constructor(size: number) {
    this.size = size;
  }
}
