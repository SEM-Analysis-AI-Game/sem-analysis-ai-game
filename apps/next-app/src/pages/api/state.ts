import {
  CondensedStateNode,
  GraveyardNode,
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

export function addCondensedStateEntry(
  imageIndex: number,
  node: CondensedStateNode
) {
  const state = serverState[imageIndex];
  const image = kImages[imageIndex];

  smoothPaint(
    (pos) =>
      pos[0] === node.data!.event.from[0] && pos[1] === node.data!.event.from[1]
        ? node.data!.event.segment
        : state.condensedState.segmentBuffer[
            pos[1] * image.image.width + pos[0]
          ]?.node.data?.event.segment ?? -1,
    (pos, segment) => {
      const oldSegmentNode =
        state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]];
      state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]] =
        {
          node,
          boundary: false,
        };
      if (oldSegmentNode) {
        if (oldSegmentNode.node.type === "SplitNode") {
        } else if (
          segment === node.data!.event.segment &&
          oldSegmentNode.node !== node
        ) {
          oldSegmentNode.node.data!.numPixels--;
          node.data!.numPixels++;
          if (oldSegmentNode.node.data!.numPixels === 0) {
            state.condensedState.segmentSizes[
              oldSegmentNode.node.data!.event.segment
            ]--;
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
                    color: oldSegmentNode.node.data!.event.color,
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
              if (state.condensedState.tail === oldSegmentNode.node) {
                state.condensedState.tail = graveyard;
              }
            } else {
              oldSegmentNode!.node.prev!.next = oldSegmentNode.node.next;
              if (oldSegmentNode.node.next) {
                oldSegmentNode.node.next.prev = oldSegmentNode.node.prev;
              }
              if (state.condensedState.tail === oldSegmentNode.node) {
                state.condensedState.tail = oldSegmentNode.node.prev!;
              }
              state.condensedState.length--;
            }
          }
        } else {
          // handle remove old condensed node and add new split node
        }
      } else if (!oldSegmentNode) {
        node.data!.numPixels++;
      }
      //     if (
      //       !oldSegmentNode ||
      //       oldSegmentNode.node.data!.event.segment !== segment
      //     ) {
      //       if (segment === event.segment) {
      //         node.data!.numPixels++;
      //         state.condensedState.segmentBuffer[pos[1] * image.width + pos[0]] = {
      //           node,
      //           boundary: false,
      //         };
      //       } else {
      //         const splitNode = splitNodes.find(
      //           (node) => node.data!.event.segment === segment
      //         )!;
      //         splitNode.data!.numPixels++;
      //         const isBoundary =
      //           state.condensedState.segmentBuffer[pos[1] * image.width + pos[0]]
      //             ?.boundary ?? false;
      //         if (isBoundary) {
      //           splitNode.data!.event.boundary.add(`${pos[0]},${pos[1]}`);
      //         }
      //         state.condensedState.segmentBuffer[pos[1] * image.width + pos[0]] = {
      //           node,
      //           boundary: isBoundary,
      //         };
      //       }
      //     }
    },
    (pos, alpha) => {
      const entry =
        state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]];
      if (entry && alpha) {
        entry.boundary = alpha === 1.0;
      }
    },
    (pos) =>
      state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]]
        ?.boundary ?? false,
    () => {
      state.condensedState.segmentSizes.push(1);
      return state.condensedState.segmentSizes.length - 1;
    },
    node.data!.event,
    [image.image.width, image.image.height],
    []
    // event.splitInfo.map((splitInfo) => ({
    //   pos: splitInfo.pos,
    //   color: new THREE.Color(`#${splitInfo.color}`),
    //   oldSegment: splitInfo.oldSegment,
    //   newSegment: splitInfo.newSegment,
    // }))
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
        initialState.push({
          type: "Draw",
          from: current.data!.event.from,
          to: current.data!.event.to,
          size: current.data!.event.size,
          segment: current.data!.event.segment,
          color: current.data!.event.color,
          historyIndex: current.data!.historyIndex,
        });
      } else if (current.type === "SplitNode") {
        for (const point in current.data!.event.boundary) {
          initialState.push({
            type: "Split",
            position: point.split(",").map((x) => parseInt(x)),
            segment: current.data!.event.segment,
            color: current.data!.event.color,
            historyIndex: current.data!.historyIndex,
          });
        }
      } else if (current.type === "GraveyardNode") {
        initialState.push({
          type: "Graveyard",
          segment: current.data!.event.segment,
          historyIndex: current.data!.historyIndex,
          color: current.data!.event.color,
        });
      }
      current = current.next;
    }
    return response.status(200).json({ initialState });
  }
}
