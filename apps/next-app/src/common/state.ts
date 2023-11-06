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
  draws: readonly DrawResponse[];

  /**
   * After all of the draw events are applied, the flood fill events are applied.
   */
  fills: readonly FloodFillResponse[];
};

/**
 * Common data structure for the state of the server and client.
 */
export type State = {
  /**
   * The canvas is a 2D flattened into a 1D row-major array. Each element holds
   * data for a single pixel.
   */
  canvas: {
    /**
     * The segment that is currently painted at this pixel.
     */
    segment: number;

    /**
     * The number of adjacent pixels that belong to the same segment as this pixel.
     */
    inSegmentNeighbors: 0 | 1 | 2 | 3 | 4;
  }[];

  /**
   * The resolution of the canvas/background image.
   */
  resolution: readonly [number, number];

  /**
   * The index of the background image in kImages.
   */
  imageIndex: number;

  /**
   * The next segment index to use for drawing or flood filling.
   */
  nextSegmentIndex: number;
};
