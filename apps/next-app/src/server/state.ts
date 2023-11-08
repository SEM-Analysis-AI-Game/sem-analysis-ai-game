import * as THREE from "three";
import {
  DoublyLinkedList,
  DoublyLinkedListNode,
  DrawEvent,
  DrawResponse,
  FloodFillEvent,
  State,
  kImages,
} from "@/common";
import sharp from "sharp";
// @ts-ignore
import GIFEncoder from "gif-encoder-2";

/**
 * Lazy load the background images as raw pixel data.
 */
export const lazyBackground: Promise<Uint8ClampedArray>[] = kImages.map(
  async (image) => {
    const res = await sharp(`public${image.url}`)
      .extract({ left: 0, top: 0, width: image.width, height: image.height })
      .ensureAlpha()
      .raw()
      .toBuffer();
    return new Uint8ClampedArray(res);
  }
);

/**
 * Holds information about a flood fill event. These are stored on the
 * server canvas as well as the short log.
 */
export type FloodFillNode = DoublyLinkedListNode<FloodFillEvent>;

/**
 * Holds information about a draw event. These are stored on the server
 * canvas as well as the short log.
 */
export type DrawNode = DoublyLinkedListNode<
  DrawResponse & { numPixels: number }
>;

export type RoomState = State & {
  rawLog: DrawEvent[];
  shortLog: {
    draws: DoublyLinkedList<DrawNode["value"]>;
    fills: DoublyLinkedList<FloodFillNode["value"]>;
  };
  canvas: State["canvas"] & { node: DrawNode; fill: FloodFillNode | null }[];
  gifEncoder: GIFEncoder;
};

export const serverState: RoomState[] = kImages.map((image, imageIndex) => {
  const drawHead = { next: null };
  const fillHead = { next: null };
  const gifEncoder = new GIFEncoder(image.width, image.height, "octree");
  gifEncoder.setRepeat(0);
  gifEncoder.setFrameRate(20);
  gifEncoder.start();
  return {
    gifEncoder,
    rawLog: [],
    shortLog: {
      draws: { head: drawHead, tail: drawHead, length: 0 },
      fills: { head: fillHead, tail: fillHead, length: 0 },
    },
    imageIndex: imageIndex,
    canvas: new Array(image.width * image.height),
    drawing: new THREE.DataTexture(
      new Uint8Array(image.width * image.height * 4),
      image.width,
      image.height
    ),
    nextSegmentIndex: 0,
    resolution: [image.width, image.height],
    flipY: true,
    background: null,
  };
});
