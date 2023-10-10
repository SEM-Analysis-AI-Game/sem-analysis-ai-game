export type PainterStatistics = {
  segments: Map<
    number,
    {
      numPoints: number;
      centroid: THREE.Vector2;
      medianEstimate: THREE.Vector2;
    }
  >;
};
