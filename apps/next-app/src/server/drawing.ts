import { DrawEvent, smoothDraw } from "@/common";
import { DrawNode, RoomState } from "./state";

export function smoothDrawServer(
  state: RoomState,
  event: DrawEvent
): {
  activeSegment: number;
  cuts: { effectedSegment: number; points: Set<string> }[];
} | null {
  const node: DrawNode = {
    event,
    segment: -1,
    type: "Draw",
    prev: state.shortLog.tail,
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
              state.shortLog.tail = newEntry.node.prev;
            }
            state.shortLog.length--;
          }
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
    state.shortLog.length++;
    state.shortLog.tail.next = node;
    state.shortLog.tail = node;
    state.rawLog.push(event);
    return { activeSegment: node.segment, cuts };
  } else {
    return null;
  }
}
