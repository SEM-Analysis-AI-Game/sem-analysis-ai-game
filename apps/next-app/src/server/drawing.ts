import { DrawEvent, fillCuts, getSegmentEntry, smoothDraw } from "@/common";
import { CutNode, DrawNode, RoomState } from "./state";

export function smoothDrawServer(
  state: RoomState,
  event: DrawEvent
): {
  activeSegment: number;
} | null {
  const node: DrawNode = {
    event,
    segment: -1,
    type: "Draw",
    prev: state.shortLog.draws.tail,
    next: null,
    historyIndex: state.rawLog.length,
    numPixels: 0,
  };

  let drew = false;

  const cuts = smoothDraw(
    (_, oldSegment, newEntry) => {
      if (oldSegment !== newEntry.id) {
        if (node.segment === -1) {
          node.segment = newEntry.id;
        }
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
        if (newEntry.cut) {
          newEntry.cut.numPixels--;
          if (newEntry.cut.numPixels === 0) {
            newEntry.cut.prev.next = newEntry.cut.next;
            if (newEntry.cut.next) {
              newEntry.cut.next.prev = newEntry.cut.prev;
            } else {
              state.shortLog.cuts.tail = newEntry.cut.prev;
            }
            state.shortLog.cuts.length--;
          }
          newEntry.cut = null;
        }
        newEntry.node = node;
        node.numPixels++;
        drew = true;
      }
    },
    state,
    event
  );

  if (drew) {
    state.shortLog.draws.length++;
    state.shortLog.draws.tail.next = node;
    state.shortLog.draws.tail = node;

    for (const cut of cuts) {
      const cutNode: CutNode = {
        type: "Cut",
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
          if (entry.cut) {
            entry.cut.numPixels--;
            entry.cut.points.delete(posString);
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
      },
      state,
      cuts
    );

    return { activeSegment: node.segment };
  } else {
    return null;
  }
}
