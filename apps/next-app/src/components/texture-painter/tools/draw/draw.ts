import * as THREE from "three";
import { FrameCallbackParams } from "../../renderer";
import { Tool } from "../tool";
import { cursorToPixel, smoothPaint } from "../utils";

export abstract class DrawTool extends Tool {
  public readonly size: number;
  public readonly cursorOverlayTexture: THREE.DataTexture;
  protected readonly color: THREE.Color;
  protected readonly alpha: number;

  constructor(size: number, color: THREE.Color, alpha: number) {
    super();
    this.size = size;
    this.color = color;
    this.alpha = alpha;
    const data = new Uint8Array(this.size * this.size * 4);
    this.paintCursorOverlay(data);
    this.cursorOverlayTexture = new THREE.DataTexture(
      data,
      this.size,
      this.size
    );
    this.cursorOverlayTexture.needsUpdate = true;
  }

  protected abstract paintCursorOverlay(data: Uint8Array): void;

  protected abstract paint(
    drawings: Uint8Array[],
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): Set<number>;

  protected abstract directPaint(
    data: Uint8Array,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2,
    alpha: number
  ): void;

  public cursorOverlay(): THREE.Texture {
    return this.cursorOverlayTexture;
  }

  protected abstract widthInDirection(dir: THREE.Vector2): number;

  public frameHandler(params: FrameCallbackParams): Set<number> {
    const changedDrawings = new Set<number>();
    if (params.controls.cursorDown) {
      const currentPixel = cursorToPixel(
        params.cursor.current,
        params.resolution
      );
      this.paint(
        params.drawings,
        currentPixel,
        this.size,
        params.resolution
      ).forEach((index) => changedDrawings.add(index));
      const previousPixel = cursorToPixel(
        params.cursor.previous,
        params.resolution
      );
      smoothPaint(
        params.resolution,
        currentPixel,
        previousPixel,
        params.drawings,
        this.color,
        this.alpha,
        this.widthInDirection(currentPixel.clone().sub(previousPixel))
      ).forEach((index) => changedDrawings.add(index));
    }
    return changedDrawings;
  }
}
