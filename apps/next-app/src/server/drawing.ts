import {
  DrawEvent,
  FloodFillEvent,
  floodFill,
  drawAndFindSplits,
  getPixelData,
} from "drawing";
import { DrawNode, FloodFillNode, RoomState } from "./state";
import { push } from "./doubly-linked-list";

export function drawServer(
  state: RoomState,
  event: DrawEvent
): {
  activeSegment: number;
  fills: FloodFillEvent[];
} {
  const node: DrawNode = {
    value: {
      ...event,
      segment: -1,
      historyIndex: state.rawLog.length,
    },
    prev: state.shortLog.draws.tail,
    next: null,
  };

  function removeFill(
    pos: readonly [number, number],
    entry: { fill: FloodFillNode | null }
  ) {
    if (entry.fill) {
      entry.fill.value.points.delete(`${pos[0]},${pos[1]}`);
      if (entry.fill.value.points.size === 0) {
        entry.fill.prev.next = entry.fill.next;
        if (entry.fill.next) {
          entry.fill.next.prev = entry.fill.prev;
        } else {
          state.shortLog.fills.tail = entry.fill.prev;
        }
        state.shortLog.fills.length--;
      }
      entry.fill = null;
    }
  }

  const { activeSegment, fills } = drawAndFindSplits<RoomState>(
    (pos, oldData, newData) => {
      removeFill(pos, newData);
      if (!oldData || oldData.segment !== newData.segment) {
        newData.node = node;
      }
    },
    (pos) => {
      const segmentEntry = getPixelData(state, pos)!;
      removeFill(pos, segmentEntry);
    },
    state,
    event
  );

  node.value.segment = activeSegment;

  push(state.shortLog.draws, node);

  for (const fill of fills) {
    const fillNode: FloodFillNode = {
      value: {
        points: fill.points,
        segment: fill.segment,
      },
      prev: state.shortLog.fills.tail,
      next: null,
    };
    for (const point of fill.points) {
      getPixelData(
        state,
        point.split(",").map((data) => parseInt(data)) as [number, number]
      )!.fill = fillNode;
    }
    push(state.shortLog.fills, fillNode);
  }

  state.rawLog.push(event);

  floodFill<RoomState, FloodFillEvent>(
    (pos, data, fill) => {
      const posString = pos.join(",");
      if (!fill.points.has(posString)) {
        removeFill(pos, data);
      }
    },
    state,
    fills,
    "FloodFillEvent"
  );

  return { activeSegment: node.value.segment, fills };
}
