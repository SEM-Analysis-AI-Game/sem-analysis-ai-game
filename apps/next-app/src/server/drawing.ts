import {
  DrawEvent,
  FloodFillEvent,
  floodFill,
  drawAndFindSplits,
  getPixelData,
  remove,
  push,
} from "@/common";
import { DrawNode, FloodFillNode, RoomState } from "./state";

export function drawServer(
  state: RoomState,
  event: DrawEvent
): {
  activeSegment: number;
  fills: FloodFillEvent[];
} | null {
  const node: DrawNode = {
    value: {
      ...event,
      segment: -1,
      historyIndex: state.rawLog.length,
      numPixels: 0,
    },
    prev: state.shortLog.draws.tail,
    next: null,
  };

  let drew = false;

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
      if (oldData && oldData.node && oldData.segment !== newData.segment) {
        oldData.node.value.numPixels--;
        if (oldData.node.value.numPixels === 0) {
          remove(state.shortLog.draws, oldData.node);
        }
      }
      newData.node = node;
      node.value.numPixels++;
      drew = true;
    },
    (pos) => {
      const segmentEntry = getPixelData(state, pos)!;
      removeFill(pos, segmentEntry);
    },
    state,
    event,
    true
  );

  node.value.segment = activeSegment;

  if (drew) {
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
      true,
      "FloodFillEvent"
    );

    state.gifEncoder.addFrame(state.drawing.image.data);

    return { activeSegment: node.value.segment, fills };
  } else {
    return null;
  }
}
