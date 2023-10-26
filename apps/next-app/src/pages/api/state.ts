import * as THREE from "three";
import {
  CondensedStateNode,
  DrawEvent,
  GraveyardNode,
  ServerState,
  SplitNode,
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
    type: "CondensedStateNode" as const,
    data: null,
    next: null,
    prev: null,
  };
  return {
    events: [],
    condensedState: {
      head,
      tail: head,
      segmentSizes: [],
      numSegments: 0,
      length: 0,
      segmentBuffer: new Array(image.image.width * image.image.height),
    },
  };
});

export function addCondensedStateEntry(imageIndex: number, event: DrawEvent) {
  const state = serverState[imageIndex];
  const image = kImages[imageIndex];

  const node: CondensedStateNode = {
    type: "CondensedStateNode",
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
  };

  const splitNodes: SplitNode[] = event.splitInfo.map((splitInfo) => {
    return {
      type: "SplitNode",
      data: {
        event: {
          segment: splitInfo.newSegment,
        },
        historyIndex: state.events.length - 1,
        numPixels: 0,
      },
      next: null,
      prev: node,
    };
  });

  state.condensedState.tail.next = node;
  node.prev = state.condensedState.tail;
  state.condensedState.tail = node;

  if (state.condensedState.segmentSizes.length <= event.segment) {
  }

  for (const splitNode of splitNodes) {
    state.condensedState.tail.next = splitNode;
    splitNode.prev = state.condensedState.tail;
    state.condensedState.tail = splitNode;
    while (
      state.condensedState.segmentSizes.length <= splitNode.data!.event.segment
    ) {
      state.condensedState.segmentSizes.push(0);
    }
  }

  if (state.condensedState.numSegments <= event.segment) {
    state.condensedState.segmentSizes.push(0);
    state.condensedState.numSegments = event.segment + 1;
  }

  state.condensedState.length++;

  smoothPaint(
    (pos) => {
      if (pos[0] === event.from[0] && pos[1] === event.from[1]) {
        return event.segment;
      } else {
        return (
          state.condensedState.segmentBuffer[
            pos[1] * image.image.width + pos[0]
          ]?.node.data?.event.segment ?? -1
        );
      }
    },
    (pos, segment) => {
      const oldSegmentNode =
        state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]];
      if (
        !oldSegmentNode ||
        oldSegmentNode.node.data!.event.segment !== segment
      ) {
        if (oldSegmentNode) {
          oldSegmentNode.node.data!.numPixels--;
          state.condensedState.segmentSizes[
            oldSegmentNode.node.data!.event.segment
          ]--;
          if (oldSegmentNode.node.data!.numPixels === 0) {
            if (
              state.condensedState.segmentSizes[
                oldSegmentNode.node.data!.event.segment
              ] === 0
            ) {
              const graveyard: GraveyardNode = {
                type: "GraveyardNode",
                data: {
                  event: {
                    segment: oldSegmentNode.node.data!.event.segment,
                  },
                  historyIndex: oldSegmentNode.node.data!.historyIndex,
                },
                next: oldSegmentNode.node.next,
                prev: oldSegmentNode.node.prev!,
              };
              oldSegmentNode.node.prev!.next = graveyard;
              if (oldSegmentNode.node.next) {
                oldSegmentNode.node.next.prev = graveyard;
              }
            } else {
              oldSegmentNode!.node.prev!.next = oldSegmentNode.node.next;
              if (oldSegmentNode.node.next) {
                oldSegmentNode.node.next.prev = oldSegmentNode.node.prev;
              }
              state.condensedState.length--;
            }
          }
        }
        if (segment === event.segment) {
          node.data!.numPixels++;
          state.condensedState.segmentBuffer[
            pos[1] * image.image.width + pos[0]
          ] = {
            node,
            boundary: false,
          };
        } else {
          const splitNode = splitNodes.find(
            (node) => node.data!.event.segment === segment
          )!;
          splitNode.data!.numPixels++;
          state.condensedState.segmentBuffer[
            pos[1] * image.image.width + pos[0]
          ] = {
            node,
            boundary: false,
          };
        }
      }
    },
    (pos, alpha) => {
      if (alpha) {
        state.condensedState.segmentBuffer[
          pos[1] * image.image.width + pos[0]
        ]!.boundary = alpha === 1.0;
      }
    },
    (pos) =>
      state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]]
        ?.boundary ?? false,
    () => {
      state.condensedState.numSegments++;
      return state.condensedState.numSegments - 1;
    },
    event,
    [image.image.width, image.image.height],
    event.splitInfo.map((splitInfo) => ({
      pos: splitInfo.pos,
      color: new THREE.Color(`#${splitInfo.color}`),
      oldSegment: splitInfo.oldSegment,
      newSegment: splitInfo.newSegment,
    }))
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
      if (current.type === "CondensedStateNode") {
        initialState.push(current.data!);
      } else {
        console.log(current);
      }
      current = current.next;
    }
    return response.status(200).json({ initialState });
  }
}
