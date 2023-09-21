import * as THREE from "three";
import { FrameCallbackParams } from "../renderer";
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

  public frameHandler(params: FrameCallbackParams): void {}
}
