import * as THREE from "three";
import { FrameCallbackParams } from "../renderer";
import { Tool } from "./tool";

export class PanTool extends Tool {
  public readonly cursorOverlayTexture: THREE.Texture;
  readonly panning = true;
  readonly name = "Pan";

  constructor() {
    super();
    this.cursorOverlayTexture = new THREE.TextureLoader().load("/pan.png");
  }

  public cursorOverlay(): THREE.Texture {
    return this.cursorOverlayTexture;
  }

  public frameHandler(params: FrameCallbackParams): void {}
}
