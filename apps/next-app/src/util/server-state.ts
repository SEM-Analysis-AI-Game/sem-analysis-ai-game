import { DrawEvent } from "./socket-events";

export type CondensedStateNode = {
  data: {
    event: Omit<DrawEvent, "splitInfo">;
    historyIndex: number;
    numPixels: number;
  } | null;
  next: CondensedStateNode | null;
  prev: CondensedStateNode | null;
  nextInSegment: CondensedStateNode | null;
  prevInSegment: CondensedStateNode | null;
};

export type ServerState = {
  events: DrawEvent[];
  condensedState: {
    length: number;
    tail: CondensedStateNode;
    head: CondensedStateNode;
    segments: {
      head: CondensedStateNode;
      tail: CondensedStateNode;
    }[];
    segmentBuffer: (CondensedStateNode | null)[];
  };
}[];
