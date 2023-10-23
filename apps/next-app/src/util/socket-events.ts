export type DrawEvent = {
  from: readonly [number, number];
  to: readonly [number, number];
  size: number;
  color: string | undefined;
};
