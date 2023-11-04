export type DrawEvent = {
  from: readonly [number, number];
  to: readonly [number, number];
  size: number;
};

export type StateResponse = {
  draws: { event: DrawEvent; segment: number; historyIndex: number }[];
  cuts: { segment: number; points: string[] }[];
};

export type FillCut = {
  type: "FillCut";
  points: Set<string>;
  segment: number;
};

export type State = {
  segmentBuffer: { id: number; inSegmentNeighbors: 0 | 1 | 2 | 3 | 4 }[];
  resolution: readonly [number, number];
  imageIndex: number;
  nextSegmentIndex: number;
};
