import { DrawEvent, kImages } from "@/common";

// The following nodes are used in a doubly-linked list to represent the room state.
// The nodes of the linked list are also used as elements in a 2D-array to represent
// each pixel of the canvas. We can use the 2D-array to track segment information
// server-side similarly to how we use the 2D-array to track segment information client-side.

/**
 * A sentinel node for the short log.
 */
type HeadNode = {
  type: "HeadNode";
  next: LogEventNode | null;
};

/**
 * Contains the information related to a single segment-split.
 */
export type FillNode = {
  type: "FillNode";

  /**
   * Tracks the points in the segment buffer that are linked with this node.
   */
  points: Map<string, { boundary: boolean }>;

  /**
   * The segment to use for the fill.
   */
  segment: number;

  /**
   * The number of pixels tied to this node that will be shown in the final drawing.
   * When this reaches 0, we can remove this node from the shortlog.
   */
  numPixels: number;

  /**
   * The index of the draw event in the raw log.
   */
  historyIndex: number;

  prev: LogEventNode;
  next: LogEventNode | null;
};

/**
 * Contains the information related to a single frame of a brush stroke.
 */
export type DrawNode = {
  type: "DrawNode";
  event: DrawEvent;

  /**
   * The segment to use for the draw.
   */
  segment: number;

  /**
   * The number of pixels tied to this node that will be shown in the final drawing.
   */
  numPixels: number;

  prev: LogNode;
  next: LogEventNode | null;

  /**
   * The index of the draw event in the raw log.
   */
  historyIndex: number;
};

/**
 * A union type of all the node types in the short log.
 */
type LogNode = HeadNode | FillNode | DrawNode;

/**
 * A union type of all the node types in the short log except for the head node.
 */
export type LogEventNode = FillNode | DrawNode;

/**
 * This is a 2D-array that is used to track segment information server-side. Each drawn
 * pixel corresponds to a node in the short log.
 */
export type ServerSegmentBuffer = { node: LogEventNode; boundary: boolean }[];

/**
 * The state of a single room.
 */
export type RoomState = {
  /**
   * Holds a raw log of draw events received from clients.
   *
   * This can be used to reconstruct the state frame-by-frame exactly how it was
   * received from clients.
   */
  rawLog: DrawEvent[];

  /**
   * Holds a condensed version of the raw log that can be used to reconstruct the
   * current state quickly.
   */
  shortLog: {
    head: HeadNode;
    tail: LogNode;
  };

  /**
   * A 2D-array that is used to track segment information server-side. Each drawn
   * pixel corresponds to a node in the short log.
   */
  segmentBuffer: ServerSegmentBuffer;

  /**
   * The next segment index to use when a new segment is created.
   */
  nextSegmentIndex: number;

  /**
   * The dimensions of the canvas.
   */
  dimensions: readonly [number, number];
};

/**
 * The initial state of the server.
 */
export const serverState: RoomState[] = kImages.map((image) => {
  const head: HeadNode = {
    type: "HeadNode",
    next: null,
  };
  return {
    rawLog: [],
    shortLog: {
      head,
      tail: head,
    },
    segmentBuffer: new Array(image.width * image.height),
    nextSegmentIndex: 0,
    dimensions: [image.width, image.height],
  };
});
