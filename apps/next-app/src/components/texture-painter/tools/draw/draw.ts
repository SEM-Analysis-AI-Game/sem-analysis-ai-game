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

  public frameHandler(params: FrameCallbackParams): Set<number> {
    const changedDrawings = new Set<number>();
    if (params.painterState.cursorDown) {
      const resolution = new THREE.Vector2(
        params.painterState.background.image.width,
        params.painterState.background.image.height
      );
      const currentPixel = cursorToPixel(params.cursor.current, resolution);
      this.paint(
        params.painterState.drawings,
        currentPixel,
        this.size,
        resolution
      ).forEach((index) => changedDrawings.add(index));
      const previousPixel = cursorToPixel(params.cursor.previous, resolution);
      smoothPaint(
        resolution,
        currentPixel,
        previousPixel,
        this.size,
        (pos: THREE.Vector2) =>
          this.paint(params.painterState.drawings, pos, this.size, resolution)
      ).forEach((index) => changedDrawings.add(index));
    }
    return changedDrawings;
  }
}
