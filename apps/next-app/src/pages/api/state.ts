import {
  CondensedStateNode,
  DrawEvent,
  ServerState,
  kImages,
  smoothPaint,
} from "@/util";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * the server state is stored as an array of draw events in the order in which they were received.
 * clients must recreate the drawing by iterating through the array and drawing each event in order.
 */
export const serverState: ServerState = kImages.map((image) => {
  const head = {
    data: null,
    next: null,
    prev: null,
    nextInSegment: null,
    prevInSegment: null,
  };
  return {
    events: [],
    condensedState: {
      head,
      tail: head,
      length: 0,
      segments: [],
      segmentBuffer: new Array(image.image.width * image.image.height),
    },
  };
});

export function addCondensedStateEntry(imageIndex: number, event: DrawEvent) {
  const state = serverState[imageIndex];
  const image = kImages[imageIndex];

  const node: CondensedStateNode = {
    data: {
      event: {
        from: event.from,
        to: event.to,
        segment: event.segment,
        segmentColor: event.segmentColor,
        size: event.size,
      },
      historyIndex: state.events.length - 1,
      numPixels: 0,
    },
    next: null,
    prev: null,
    nextInSegment: null,
    prevInSegment: null,
  };

  while (state.condensedState.segments.length < event.segment) {
    const head = {
      data: null,
      next: null,
      prev: null,
      nextInSegment: null,
      prevInSegment: null,
    };
    state.condensedState.segments.push({
      head,
      tail: head,
    });
  }

  if (state.condensedState.segments.length === event.segment) {
    state.condensedState.segments.push({
      head: node,
      tail: node,
    });
  }

  const segmentTail = state.condensedState.segments[event.segment].tail;
  segmentTail.nextInSegment = node;
  node.prevInSegment = segmentTail;
  state.condensedState.segments[event.segment].tail = node;

  state.condensedState.tail.next = node;
  node.prev = state.condensedState.tail;
  state.condensedState.tail = node;

  state.condensedState.length++;

  smoothPaint(
    (pos) => {
      if (pos[0] === event.from[0] && pos[1] === event.from[1]) {
        return event.segment;
      } else {
        return (
          state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]]
            ?.data?.event.segment ?? -1
        );
      }
    },
    (pos, segment) => {
      const oldSegmentNode =
        state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]];
      if (!oldSegmentNode || oldSegmentNode.data!.event.segment !== segment) {
        if (oldSegmentNode) {
          oldSegmentNode.data!.numPixels--;
          if (oldSegmentNode.data!.numPixels === 0) {
            oldSegmentNode!.prev!.next = oldSegmentNode.next;
            if (oldSegmentNode.next) {
              oldSegmentNode.next.prev = oldSegmentNode.prev;
            }
            oldSegmentNode.prevInSegment!.nextInSegment =
              oldSegmentNode.nextInSegment;
            if (oldSegmentNode.nextInSegment) {
              oldSegmentNode.nextInSegment.prevInSegment =
                oldSegmentNode.prevInSegment;
            }
            state.condensedState.length--;
          }
        }
        node.data!.numPixels++;
        state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]] =
          node;
      }
    },
    () => {},
    () => {
      const head = {
        data: null,
        next: null,
        prev: null,
        nextInSegment: null,
        prevInSegment: null,
      };
      state.condensedState.segments.push({
        head,
        tail: head,
      });
      return state.condensedState.segments.length - 1;
    },
    () => {
      state.condensedState.segments.pop();
    },
    event,
    [image.image.width, image.image.height],
    []
  );
}

/**
 * responds with the current server state. this is invoked by a worker thread performing SSR.
 */
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const state = serverState[parseInt(request.query.imageIndex as string)];
  if (request.query.historyIndex) {
    const historyIndex = parseInt(request.query.historyIndex as string);
    const events = state.events.slice(historyIndex + 1);
    return response.status(200).json({ events });
  } else {
    const initialState = [];
    let current = state.condensedState.head.next;
    while (current) {
      initialState.push(current.data!);
      current = current.next;
    }
    return response.status(200).json({ initialState });
  }
}
