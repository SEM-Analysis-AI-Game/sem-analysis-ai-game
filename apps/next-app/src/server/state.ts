import { DrawEvent, FillEvent, kImages } from "@/common";

export type HeadNode = {
  type: "HeadNode";
  next: LogEventNode | null;
};

export type FillNode = {
  type: "FillNode";
  event: FillEvent;
  segment: number;
  numPixels: number;
  prev: LogEventNode;
  next: LogEventNode | null;
  historyIndex: number;
};

export type DrawNode = {
  type: "DrawNode";
  event: DrawEvent;
  segment: number;
  numPixels: number;
  prev: LogNode;
  next: LogEventNode | null;
  historyIndex: number;
};

export type LogNode = HeadNode | FillNode | DrawNode;

export type LogEventNode = FillNode | DrawNode;

export type ServerSegmentBuffer = { node: LogEventNode; boundary: boolean }[];

export type RoomState = {
  rawLog: DrawEvent[];
  shortLog: {
    head: HeadNode;
    tail: LogNode;
  };
  segmentBuffer: ServerSegmentBuffer;
  nextSegmentIndex: number;
  dimensions: readonly [number, number];
};

export const serverState: RoomState[] = kImages.map((image) => {
  const head: HeadNode = {
    type: "HeadNode",
    next: null,
  };
  return {
    rawLog: [],
    shortLog: {
      head,
      tail: head,
    },
    segmentBuffer: new Array(image.width * image.height),
    nextSegmentIndex: 0,
    dimensions: [image.width, image.height],
  };
});
