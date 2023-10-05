export type PainterStatistics = {
  segments: Map<
    number,
    {
      numPoints: number;
      positionSums: THREE.Vector2;
      medianEstimate: THREE.Vector2;
    }
  >;
};
