export type DrawEvent = {
  from: readonly [number, number];
  to: readonly [number, number];
  color: string | undefined;
};
