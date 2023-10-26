import { DrawEvent } from "./socket-events";

type CondensedNode = CondensedStateNode | SplitNode | GraveyardNode;

export type CondensedStateNode = {
  type: "CondensedStateNode";
  data: {
    event: Omit<DrawEvent, "splitInfo">;
    historyIndex: number;
    numPixels: number;
  } | null;
  next: CondensedNode | null;
  prev: CondensedNode | null;
};

export type GraveyardNode = {
  type: "GraveyardNode";
  data: {
    event: {
      segment: number;
      color: string;
    };
    historyIndex: number;
  };
  next: CondensedNode | null;
  prev: CondensedNode;
};

export type SplitNode = {
  type: "SplitNode";
  data: {
    event: {
      segment: number;
      color: string;
      boundary: Set<string>;
    };
    historyIndex: number;
    numPixels: number;
  };
  next: CondensedNode | null;
  prev: CondensedNode;
};

export type ServerState = {
  events: DrawEvent[];
  condensedState: {
    segmentSizes: number[];
    length: number;
    tail: CondensedNode;
    head: CondensedStateNode;
    segmentBuffer: ({
      node: CondensedStateNode | SplitNode;
      boundary: boolean;
    } | null)[];
  };
}[];
