import {
  DrawEvent,
  DrawResponse,
  FloodFillEvent,
  State,
  kImages,
} from "@/common";

/**
 * The first node in a linked list.
 */
type HeadNode<NodeType> = {
  next: NodeType | null;
};

/**
 * A node corresponding to a flood fill event.
 */
export type FloodFillNode = {
  event: FloodFillEvent;
  prev: HeadNode<FloodFillNode> | FloodFillNode;
  next: FloodFillNode | null;
};

export type DrawNode = {
  event: DrawResponse;
  numPixels: number;
  prev: HeadNode<DrawNode> | DrawNode;
  next: DrawNode | null;
};

export type RoomState = State & {
  rawLog: DrawEvent[];
  shortLog: {
    draws: {
      length: number;
      head: HeadNode<DrawNode>;
      tail: HeadNode<DrawNode> | DrawNode;
    };
    fills: {
      length: number;
      head: HeadNode<FloodFillNode>;
      tail: HeadNode<FloodFillNode> | FloodFillNode;
    };
  };
  canvas: State["canvas"] & { node: DrawNode; fill: FloodFillNode | null }[];
};

export const serverState: RoomState[] = kImages.map((image, imageIndex) => {
  const drawHead: HeadNode<DrawNode> = {
    next: null,
  };
  const fillHead: HeadNode<FloodFillNode> = {
    next: null,
  };
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
