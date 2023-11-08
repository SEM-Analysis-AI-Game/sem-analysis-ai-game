import { State } from "../state";

export type ClientState = State & {
  /**
   * The actual texture that we are drawing on for the overlay.
   */
  drawing: THREE.DataTexture;

  /**
   * Whether or not the y-axis should be flipped when drawing.
   */
  flipY: boolean;

  /**
   * A background texture to apply with premultiplied alpha, or null if
   * no background texture should be applied. This is used solely for the
   * gif creator.
   */
  background: Uint8ClampedArray | null;
};
