/**
 * Holds information about a single frame of a user brush stroke.
 */
export type DrawEvent = {
  /**
   * The position of the cursor from the last frame.
   */
  from: readonly [number, number];

  /**
   * The position of the cursor for this frame.
   */
  to: readonly [number, number];

  /**
   * The radius of the brush.
   */
  size: number;
};

/**
 * A draw event with extra information. This is meant to be communicated from
 * the server to the client.
 */
export type DrawResponse = DrawEvent & {
  /**
   * The segment that this draw event will use.
   */
  segment: number;

  /**
   * The raw log index of this draw event.
   */
  historyIndex: number;
};

/**
 * Holds information about a flood fill event.
 */
export type FloodFillEvent = {
  /**
   * The segment that this flood fill event will use.
   */
  segment: number;

  /**
   * The points associated with this flood fill event. Any of these can be used
   * as the starting point for the flood fill.
   */
  points: Set<string>;
};

/**
 * Holds information about a flood fill event. This is meant to be communicated
 * from the server to the client.
 */
export type FloodFillResponse = {
  /**
   * The segment that this flood fill event will use.
   */
  segment: number;

  /**
   * The starting point of the flood fill.
   */
  startingPoint: readonly [number, number];
};

/**
 * Holds information about the state of the room. This is meant to be
 * communicated from the server to the client.
 */
export type StateResponse = {
  /**
   * The draw events are all applied first, without any flood fill events.
   */
  draws: DrawResponse[];

  /**
   * After all of the draw events are applied, the flood fill events are applied.
   */
  fills: FloodFillResponse[];
};

/**
 * Common data structure for the state of the server and client.
 */
export type State = {
  canvas: { id: number; inSegmentNeighbors: 0 | 1 | 2 | 3 | 4 }[];
  resolution: readonly [number, number];
  imageIndex: number;
  nextSegmentIndex: number;
};
