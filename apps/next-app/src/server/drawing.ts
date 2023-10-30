import {
  DrawEvent,
  FillBoundaryType,
  recomputeSegments,
  smoothPaint,
} from "@/common";
import {
  DrawNode,
  FillNode,
  LogEventNode,
  RoomState,
  ServerSegmentBuffer,
} from "./state";

/**
 * Gets the segment at a given position.
 */
function getSegment(
  segmentBuffer: ServerSegmentBuffer,
  width: number,
  pos: readonly [number, number]
): number {
  return segmentBuffer[pos[1] * width + pos[0]]?.node.segment ?? -1;
}

/**
 * Sets the segment at a given position. If the node is a fill node,
 * it also updates the boundary map for that node.
 */
function setSegment(
  segmentBuffer: ServerSegmentBuffer,
  width: number,
  pos: readonly [number, number],
  node: LogEventNode
): void {
  let entry = segmentBuffer[pos[1] * width + pos[0]];
  if (!entry) {
    entry = { node, boundary: false };
    segmentBuffer[pos[1] * width + pos[0]] = entry;
  }

  if (entry.node.segment !== node.segment) {
    // update the fill node boundary if the node is a fill node
    if (node.type === "FillNode") {
      node.points.set(`${pos[0]},${pos[1]}`, {
        boundary: entry.boundary,
      });
    }
    entry.node = node;
  }
}

/**
 * Updates the boundary status of a given position in the segment buffer,
 * and updates the boundary map of the node at that position if it is a
 * fill node.
 */
function fill(
  segmentBuffer: ServerSegmentBuffer,
  width: number,
  pos: readonly [number, number],
  type: FillBoundaryType
): void {
  // retain means do nothing to the boundary
  if (type !== FillBoundaryType.retain) {
    const oldNode = segmentBuffer[pos[1] * width + pos[0]]!;
    // update the boundary map if the node is a fill node
    if (oldNode.node.type === "FillNode") {
      oldNode.node.points.set(`${pos[0]},${pos[1]}`, {
        boundary: type === FillBoundaryType.boundary,
      });
    }
    // update the boundary status of the position
    segmentBuffer[pos[1] * width + pos[0]].boundary =
      type === FillBoundaryType.boundary;
  }
}

export function smoothPaintServer(
  state: RoomState,
  event: DrawEvent
): Map<number, { newBoundaryPoints: Set<string> }> {
  // get the segment where the brush stroke starts
  let segment = getSegment(
    state.segmentBuffer,
    state.dimensions[0],
    event.from
  );

  // if the segment is -1, the brush stroke starts in an empty area.
  if (segment === -1) {
    segment = state.nextSegmentIndex;
  }

  const node: DrawNode = {
    event,
    segment,
    type: "DrawNode",
    numPixels: 0,
    prev: state.shortLog.tail,
    next: null,
    historyIndex: state.rawLog.length,
  };

  state.shortLog.tail.next = node;
  state.shortLog.tail = node;

  state.rawLog.push(event);

  return smoothPaint(
    (pos) => getSegment(state.segmentBuffer, state.dimensions[0], pos),
    (pos) => setSegment(state.segmentBuffer, state.dimensions[0], pos, node),
    (pos, type) => fill(state.segmentBuffer, state.dimensions[0], pos, type),
    state,
    event,
    state.dimensions
  );
}

export function recomputeSegmentsServer(
  state: RoomState,
  effectedSegments: Map<number, { newBoundaryPoints: Set<string> }>
): Map<number, FillNode> {
  const fillNodes = new Map<number, FillNode>();
  recomputeSegments(
    (pos) => getSegment(state.segmentBuffer, state.dimensions[0], pos),
    (pos, segment) => {
      let node = fillNodes.get(segment);
      if (!node) {
        node = {
          type: "FillNode",
          points: new Map(),
          segment,
          numPixels: 0,
          prev: state.shortLog.tail as LogEventNode,
          next: null,
          historyIndex: state.rawLog.length - 1,
        };
        fillNodes.set(segment, node);
        state.shortLog.tail.next = node;
        state.shortLog.tail = node;
      }
      setSegment(state.segmentBuffer, state.dimensions[0], pos, node);
    },
    (pos, type) => fill(state.segmentBuffer, state.dimensions[0], pos, type),
    (pos) =>
      state.segmentBuffer[pos[1] * state.dimensions[0] + pos[0]]?.boundary ??
      false,
    state,
    state.dimensions,
    effectedSegments
  );
  return fillNodes;
}
