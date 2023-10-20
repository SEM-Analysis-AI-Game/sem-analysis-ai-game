import { kImages } from "./util";

export const segmentBuffers = kImages.map((image) => {
  return new Int32Array(image.height * image.width).fill(-1);
});
