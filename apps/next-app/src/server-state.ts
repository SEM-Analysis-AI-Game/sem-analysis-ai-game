import { kImages } from "./util";

export const segmentState = {
  segmentBuffers: kImages.map((image) => {
    return new Int32Array(image.height * image.width).fill(-1);
  }),
  segmentData: kImages.map(() => {
    return <{ color: THREE.Color }[]>[];
  }),
};
