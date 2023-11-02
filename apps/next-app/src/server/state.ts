import { DrawEvent, State, kImages } from "@/common";

export type HeadNode<NodeType> = {
  type: "HeadNode";
  next: NodeType | null;
};

export type CutNode = {
  type: "Cut";
  points: Set<string>;
  numPixels: number;
  segment: number;
  prev: HeadNode<CutNode> | CutNode;
  next: CutNode | null;
};

export type DrawNode = {
  type: "Draw";
  event: DrawEvent;
  numPixels: number;
  segment: number;
  historyIndex: number;
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
    cuts: {
      length: number;
      head: HeadNode<CutNode>;
      tail: HeadNode<CutNode> | CutNode;
    };
  };
  segmentBuffer: State["segmentBuffer"] &
    { node: DrawNode; cut: CutNode | null }[];
};

export const serverState: RoomState[] = kImages.map((image, imageIndex) => {
  const drawHead: HeadNode<DrawNode> = {
    type: "HeadNode",
    next: null,
  };
  const cutHead: HeadNode<CutNode> = {
    type: "HeadNode",
    next: null,
  };
  return {
    rawLog: [],
    shortLog: {
      draws: { head: drawHead, tail: drawHead, length: 0 },
      cuts: { head: cutHead, tail: cutHead, length: 0 },
    },
    imageIndex: imageIndex,
    segmentBuffer: new Array(image.width * image.height),
    nextSegmentIndex: 0,
    resolution: [image.width, image.height],
  };
});
