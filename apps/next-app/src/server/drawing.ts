import {
  DrawEvent,
  FloodFillEvent,
  floodFill,
  drawAndFindSplits,
  getPixelData,
} from "drawing";
import { DrawNode, FloodFillNode, RoomState } from "./state";
import { push, remove } from "./doubly-linked-list";

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
      points: new Set(),
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
        remove(state.shortLog.fills, entry.fill);
      }
      entry.fill = null;
    }
  }

  const { activeSegment, fills } = drawAndFindSplits<RoomState>(
    (pos, oldData, newData) => {
      removeFill(pos, newData);
      if (!oldData || oldData.segment !== newData.segment) {
        newData.node = node;
        node.value.points.add(`${pos[0]},${pos[1]}`);
      } else if (oldData && oldData.node) {
        oldData.node.value.points.delete(`${pos[0]},${pos[1]}`);
        if (oldData.node.value.points.size === 0) {
          remove(state.shortLog.draws, oldData.node);
        }
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
