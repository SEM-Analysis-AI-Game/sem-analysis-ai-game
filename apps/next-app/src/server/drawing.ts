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

function getSegment(
  segmentBuffer: ServerSegmentBuffer,
  width: number,
  pos: readonly [number, number]
): number {
  return segmentBuffer[pos[1] * width + pos[0]]?.node.segment ?? -1;
}

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
  if (entry.node.type === "FillNode") {
    entry.node.event.points.delete(`${pos[0]},${pos[1]}`);
  }
  if (node.type === "FillNode") {
    node.event.points.set(`${pos[0]},${pos[1]}`, {
      boundary: entry.boundary,
    });
  }
  entry.node = node;
}

function fill(
  segmentBuffer: ServerSegmentBuffer,
  width: number,
  pos: readonly [number, number],
  type: FillBoundaryType
): void {
  if (type !== FillBoundaryType.retain) {
    const oldNode = segmentBuffer[pos[1] * width + pos[0]]!;
    if (oldNode.node.type === "FillNode") {
      oldNode.node.event.points.set(`${pos[0]},${pos[1]}`, {
        boundary: type === FillBoundaryType.boundary,
      });
    }
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
    state.nextSegmentIndex++;
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
    segment,
    event,
    state.dimensions,
    true
  );
}

export function recomputeSegmentsServer(
  state: RoomState,
  effectedSegments: Map<number, { newBoundaryPoints: Set<string> }>
): Map<number, FillNode> {
  const fillNodes = new Map<number, FillNode>();
  const indexTracker = { index: state.nextSegmentIndex };
  recomputeSegments(
    (pos) => getSegment(state.segmentBuffer, state.dimensions[0], pos),
    (pos, segment) => {
      let node = fillNodes.get(segment);
      if (!node) {
        node = {
          type: "FillNode",
          event: {
            points: new Map(),
          },
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
    indexTracker,
    state.dimensions,
    effectedSegments
  );
  state.nextSegmentIndex = indexTracker.index;
  return fillNodes;
}
