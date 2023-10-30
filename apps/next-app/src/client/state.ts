export type ClientState = {
  drawing: THREE.DataTexture;
  segmentBuffer: Int32Array;
  nextSegmentIndex: number;
};
