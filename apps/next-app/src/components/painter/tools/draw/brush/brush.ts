import { DrawTool } from "../draw";

export const kDrawAlpha = 0.5;

export abstract class Brush extends DrawTool {
  constructor(size: number) {
    super(size, kDrawAlpha);
  }
}
