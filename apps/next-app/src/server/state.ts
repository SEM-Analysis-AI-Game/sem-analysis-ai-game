import { DrawEvent, State, kImages } from "@/common";

type HeadNode = {
  type: "HeadNode";
  next: DrawNode | null;
};

export type DrawNode = {
  type: "Draw";
  event: DrawEvent;
  numPixels: number;
  segment: number;
  historyIndex: number;
  prev: HeadNode | DrawNode;
  next: DrawNode | null;
};

export type RoomState = State & {
  rawLog: DrawEvent[];
  shortLog: {
    length: number;
    head: HeadNode;
    tail: HeadNode | DrawNode;
  };
  segmentBuffer: State["segmentBuffer"] & { node: DrawNode }[];
};

export const serverState: RoomState[] = kImages.map((image, imageIndex) => {
  const head: HeadNode = {
    type: "HeadNode",
    next: null,
  };
  return {
    rawLog: [],
    shortLog: {
      head,
      tail: head,
      length: 0,
    },
    imageIndex: imageIndex,
    segmentBuffer: new Array(image.width * image.height),
    nextSegmentIndex: 0,
    resolution: [image.width, image.height],
  };
});
