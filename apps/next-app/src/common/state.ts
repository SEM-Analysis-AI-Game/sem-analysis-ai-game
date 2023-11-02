export type DrawEvent = {
  from: readonly [number, number];
  to: readonly [number, number];
  size: number;
};

export type State = {
  segmentBuffer: { id: number; inSegmentNeighbors: 0 | 1 | 2 | 3 | 4 }[];
  resolution: readonly [number, number];
  imageIndex: number;
  nextSegmentIndex: number;
};
