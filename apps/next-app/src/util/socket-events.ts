export type DrawEvent = {
  from: readonly [number, number];
  to: readonly [number, number];
  size: number;
  color: string;
  segment: number;
  splitInfo: {
    oldSegment: number;
    newSegment: number;
    color: string;
    pos: readonly [number, number];
  }[];
};
