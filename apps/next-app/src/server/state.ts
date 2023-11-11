import { DrawEvent, DrawResponse, FloodFillEvent, State } from "drawing";
import { DoublyLinkedList, DoublyLinkedListNode } from "./doubly-linked-list";
import { kImages } from "@/common";

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
  DrawResponse & { points: Set<string> }
>;

export type RoomState = State & {
  rawLog: DrawEvent[];
  shortLog: {
    draws: DoublyLinkedList<DrawNode["value"]>;
    fills: DoublyLinkedList<FloodFillNode["value"]>;
  };
  canvas: State["canvas"] & { node: DrawNode; fill: FloodFillNode | null }[];
};

export const serverState: RoomState[] = kImages.map((image, imageIndex) => {
  const drawHead = { next: null };
  const fillHead = { next: null };
  return {
    rawLog: [],
    shortLog: {
      draws: { head: drawHead, tail: drawHead, length: 0 },
      fills: { head: fillHead, tail: fillHead, length: 0 },
    },
    imageIndex: imageIndex,
    canvas: new Array(image.width * image.height),
    nextSegmentIndex: 0,
    resolution: [image.width, image.height],
  };
});
