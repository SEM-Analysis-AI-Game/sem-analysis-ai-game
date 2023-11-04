import { State } from "@/common";
import { StaticImageData } from "next/image";

export type ClientState = State & {
  drawing: THREE.DataTexture;
  background: StaticImageData;
};
