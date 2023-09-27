import * as THREE from "three";
import { Tool } from "./tool";

export class PanTool extends Tool {
  public readonly cursorOverlayTexture = new THREE.Texture();
  readonly panning = true;
  readonly name = "Pan";

  constructor() {
    super();
  }

  public cursorOverlay(): THREE.Texture {
    return this.cursorOverlayTexture;
  }

  public frameHandler(): Set<number> {
    return new Set<number>();
  }
}
