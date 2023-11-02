import { State } from "@/common";

export type ClientState = State & {
  drawing: THREE.DataTexture;
};
