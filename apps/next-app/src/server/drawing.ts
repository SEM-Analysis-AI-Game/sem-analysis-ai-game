import {
  DrawEvent,
  FloodFillEvent,
  floodFill,
  getSegmentEntry,
  smoothDraw,
} from "@/common";
import { DrawNode, FloodFillNode, RoomState } from "./state";

export function smoothDrawServer(
  state: RoomState,
  event: DrawEvent
): {
  activeSegment: number;
  fills: FloodFillEvent[];
} | null {
  const node: DrawNode = {
    event: { ...event, segment: -1, historyIndex: state.rawLog.length },
    prev: state.shortLog.draws.tail,
    next: null,
    numPixels: 0,
  };

  let drew = false;

  function removeFill(
    pos: readonly [number, number],
    entry: { fill: FloodFillNode | null }
  ) {
    if (entry.fill) {
      entry.fill.event.points.delete(`${pos[0]},${pos[1]}`);
      if (entry.fill.event.points.size === 0) {
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

  const { activeSegment, fills } = smoothDraw(
    (pos, oldSegment, newEntry) => {
      removeFill(pos, newEntry);
      if (oldSegment !== newEntry.segment) {
        if (newEntry.node) {
          newEntry.node.numPixels--;
          if (newEntry.node.numPixels === 0) {
            newEntry.node.prev.next = newEntry.node.next;
            if (newEntry.node.next) {
              newEntry.node.next.prev = newEntry.node.prev;
            } else {
              state.shortLog.draws.tail = newEntry.node.prev;
            }
            state.shortLog.draws.length--;
          }
        }
        newEntry.node = node;
        node.numPixels++;
        drew = true;
      }
    },
    (pos) => {
      const segmentEntry = getSegmentEntry(state, pos)!;
      removeFill(pos, segmentEntry);
    },
    state,
    event
  );

  node.event.segment = activeSegment;

  if (drew) {
    state.shortLog.draws.length++;
    state.shortLog.draws.tail.next = node;
    state.shortLog.draws.tail = node;

    for (const fill of fills) {
      const fillNode: FloodFillNode = {
        event: {
          points: fill.points,
          segment: fill.segment,
        },
        prev: state.shortLog.fills.tail,
        next: null,
      };
      for (const point of fill.points) {
        getSegmentEntry(
          state,
          point.split(",").map((data) => parseInt(data)) as [number, number]
        )!.fill = fillNode;
      }
      state.shortLog.fills.length++;
      state.shortLog.fills.tail.next = fillNode;
      state.shortLog.fills.tail = fillNode;
    }

    state.rawLog.push(event);

    floodFill<RoomState, FloodFillEvent>(
      (pos, entry, fill) => {
        const posString = pos.join(",");
        if (!fill.points.has(posString)) {
          removeFill(pos, entry);
        }
      },
      state,
      fills.map((fill) => ({
        fill: fill,
        bfsStart: (fill.points.values().next().value as string)
          .split(",")
          .map((data) => parseInt(data)) as [number, number],
      }))
    );

    return { activeSegment: node.event.segment, fills };
  } else {
    return null;
  }
}
