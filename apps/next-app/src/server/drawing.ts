import { DrawEvent, fillCuts, getSegmentEntry, smoothDraw } from "@/common";
import { CutNode, DrawNode, RoomState } from "./state";

export function smoothDrawServer(
  state: RoomState,
  event: DrawEvent
): {
  activeSegment: number;
  cuts: { segment: number; points: Set<string> }[];
} | null {
  const node: DrawNode = {
    event: { ...event, segment: -1, historyIndex: state.rawLog.length },
    prev: state.shortLog.draws.tail,
    next: null,
    numPixels: 0,
  };

  let drew = false;

  function removeCut(
    pos: readonly [number, number],
    entry: { cut: CutNode | null }
  ) {
    if (entry.cut) {
      entry.cut.numPixels--;
      entry.cut.points.delete(`${pos[0]},${pos[1]}`);
      if (entry.cut.numPixels === 0) {
        entry.cut.prev.next = entry.cut.next;
        if (entry.cut.next) {
          entry.cut.next.prev = entry.cut.prev;
        } else {
          state.shortLog.cuts.tail = entry.cut.prev;
        }
        state.shortLog.cuts.length--;
      }
      entry.cut = null;
    }
  }

  const { activeSegment, cuts } = smoothDraw(
    (pos, oldSegment, newEntry) => {
      removeCut(pos, newEntry);
      if (oldSegment !== newEntry.id) {
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
      const segmentEntry = getSegmentEntry(state, pos);
      removeCut(pos, segmentEntry);
    },
    state,
    event
  );

  node.event.segment = activeSegment;

  if (drew) {
    state.shortLog.draws.length++;
    state.shortLog.draws.tail.next = node;
    state.shortLog.draws.tail = node;

    for (const cut of cuts) {
      const cutNode: CutNode = {
        points: cut.points,
        numPixels: cut.points.size,
        segment: cut.segment,
        prev: state.shortLog.cuts.tail,
        next: null,
      };
      for (const point of cut.points) {
        getSegmentEntry(
          state,
          point.split(",").map((data) => parseInt(data)) as [number, number]
        ).cut = cutNode;
      }
      state.shortLog.cuts.length++;
      state.shortLog.cuts.tail.next = cutNode;
      state.shortLog.cuts.tail = cutNode;
    }

    state.rawLog.push(event);

    fillCuts<RoomState>(
      (pos, entry, cut) => {
        const posString = pos.join(",");
        if (!cut.points.has(posString)) {
          removeCut(pos, entry);
        }
      },
      state,
      cuts
    );

    return { activeSegment: node.event.segment, cuts };
  } else {
    return null;
  }
}
