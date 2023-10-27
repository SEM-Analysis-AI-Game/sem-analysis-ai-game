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

export function addCondensedStateEntry(
  imageIndex: number,
  node: CondensedStateNode,
  splitInfo: DrawEvent["splitInfo"]
) {
  const state = serverState[imageIndex];
  const image = kImages[imageIndex];

  const splitNodes: SplitNode[] = splitInfo.map((info) => ({
    type: "SplitNode",
    data: {
      event: {
        color: info.color,
        segment: info.newSegment,
        boundary: new Set(),
        fillStart: info.pos,
      },
      numPixels: 0,
      historyIndex: state.events.length - 1,
    },
    next: null,
    prev: node,
  }));

  for (const splitNode of splitNodes) {
    state.condensedState.tail.next = splitNode;
    splitNode.prev = state.condensedState.tail;
    state.condensedState.tail = splitNode;
    state.condensedState.length++;
  }

  smoothPaint(
    (pos) =>
      pos[0] === node.data!.event.from[0] && pos[1] === node.data!.event.from[1]
        ? node.data!.event.segment
        : state.condensedState.segmentBuffer[
            pos[1] * image.image.width + pos[0]
          ]?.node.data?.event.segment ?? -1,
    (pos, segment) => {
      const oldSegmentEntry =
        state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]];
      if (oldSegmentEntry) {
        if (oldSegmentEntry.node.type === "SplitNode") {
          oldSegmentEntry.node.data!.numPixels--;
          if (oldSegmentEntry.node.data!.numPixels === 0) {
            state.condensedState.segmentSizes[
              oldSegmentEntry.node.data!.event.segment
            ]--;
            if (
              state.condensedState.segmentSizes[
                oldSegmentEntry.node.data!.event.segment
              ] === 0
            ) {
              const graveyard: GraveyardNode = {
                type: "GraveyardNode",
                data: {
                  event: {
                    segment: oldSegmentEntry.node.data!.event.segment,
                    color: oldSegmentEntry.node.data!.event.color,
                  },
                  historyIndex: oldSegmentEntry.node.data!.historyIndex,
                },
                next: oldSegmentEntry.node.next,
                prev: oldSegmentEntry.node.prev!,
              };
              oldSegmentEntry.node.prev!.next = graveyard;
              if (oldSegmentEntry.node.next) {
                oldSegmentEntry.node.next.prev = graveyard;
              }
              if (state.condensedState.tail === oldSegmentEntry.node) {
                state.condensedState.tail = graveyard;
              }
            } else {
              oldSegmentEntry!.node.prev!.next = oldSegmentEntry.node.next;
              if (oldSegmentEntry.node.next) {
                oldSegmentEntry.node.next.prev = oldSegmentEntry.node.prev;
              }
              if (state.condensedState.tail === oldSegmentEntry.node) {
                state.condensedState.tail = oldSegmentEntry.node.prev!;
              }
              state.condensedState.length--;
            }
          }
          if (segment === node.data!.event.segment) {
            oldSegmentEntry!.node = node;
            node.data!.numPixels++;
          } else {
            const splitNode = splitNodes.find(
              (splitNode) => splitNode.data!.event.segment === segment
            );
            if (splitNode) {
              splitNode.data.numPixels++;
              oldSegmentEntry.node = splitNode;
              const stringified = `${pos[0]},${pos[1]}`;
              if (oldSegmentEntry.boundary) {
                splitNode.data!.event.boundary.add(stringified);
              } else {
                splitNode.data!.event.fillStart = pos;
                splitNode.data!.event.boundary.delete(stringified);
              }
            } else {
              console.log(segment);
              console.log(splitNodes);
            }
          }
        } else if (
          segment === node.data!.event.segment &&
          oldSegmentEntry.node !== node
        ) {
          oldSegmentEntry.node.data!.numPixels--;
          node.data!.numPixels++;
          if (oldSegmentEntry.node.data!.numPixels === 0) {
            state.condensedState.segmentSizes[
              oldSegmentEntry.node.data!.event.segment
            ]--;
            if (
              state.condensedState.segmentSizes[
                oldSegmentEntry.node.data!.event.segment
              ] === 0
            ) {
              const graveyard: GraveyardNode = {
                type: "GraveyardNode",
                data: {
                  event: {
                    segment: oldSegmentEntry.node.data!.event.segment,
                    color: oldSegmentEntry.node.data!.event.color,
                  },
                  historyIndex: oldSegmentEntry.node.data!.historyIndex,
                },
                next: oldSegmentEntry.node.next,
                prev: oldSegmentEntry.node.prev!,
              };
              oldSegmentEntry.node.prev!.next = graveyard;
              if (oldSegmentEntry.node.next) {
                oldSegmentEntry.node.next.prev = graveyard;
              }
              if (state.condensedState.tail === oldSegmentEntry.node) {
                state.condensedState.tail = graveyard;
              }
            } else {
              oldSegmentEntry!.node.prev!.next = oldSegmentEntry.node.next;
              if (oldSegmentEntry.node.next) {
                oldSegmentEntry.node.next.prev = oldSegmentEntry.node.prev;
              }
              if (state.condensedState.tail === oldSegmentEntry.node) {
                state.condensedState.tail = oldSegmentEntry.node.prev!;
              }
              state.condensedState.length--;
            }
          }
          oldSegmentEntry.node = node;
        } else if (oldSegmentEntry.node !== node) {
          oldSegmentEntry.node.data!.numPixels--;
          if (oldSegmentEntry.node.data!.numPixels === 0) {
            state.condensedState.segmentSizes[
              oldSegmentEntry.node.data!.event.segment
            ]--;
            if (
              state.condensedState.segmentSizes[
                oldSegmentEntry.node.data!.event.segment
              ] === 0
            ) {
              const graveyard: GraveyardNode = {
                type: "GraveyardNode",
                data: {
                  event: {
                    segment: oldSegmentEntry.node.data!.event.segment,
                    color: oldSegmentEntry.node.data!.event.color,
                  },
                  historyIndex: oldSegmentEntry.node.data!.historyIndex,
                },
                next: oldSegmentEntry.node.next,
                prev: oldSegmentEntry.node.prev!,
              };
              oldSegmentEntry.node.prev!.next = graveyard;
              if (oldSegmentEntry.node.next) {
                oldSegmentEntry.node.next.prev = graveyard;
              }
              if (state.condensedState.tail === oldSegmentEntry.node) {
                state.condensedState.tail = graveyard;
              }
            } else {
              oldSegmentEntry!.node.prev!.next = oldSegmentEntry.node.next;
              if (oldSegmentEntry.node.next) {
                oldSegmentEntry.node.next.prev = oldSegmentEntry.node.prev;
              }
              if (state.condensedState.tail === oldSegmentEntry.node) {
                state.condensedState.tail = oldSegmentEntry.node.prev!;
              }
              state.condensedState.length--;
            }
          }
          const splitNode = splitNodes.find(
            (splitNode) => splitNode.data!.event.segment === segment
          );
          if (splitNode) {
            splitNode.data!.numPixels++;
            oldSegmentEntry.node = splitNode;
            const stringified = `${pos[0]},${pos[1]}`;
            if (oldSegmentEntry.boundary) {
              splitNode.data!.event.boundary.add(stringified);
            } else {
              splitNode.data!.event.fillStart = pos;
              splitNode.data!.event.boundary.delete(stringified);
            }
          } else {
            console.log(segment);
            console.log(splitNodes);
          }
        }
      } else if (!oldSegmentEntry) {
        node.data!.numPixels++;
        state.condensedState.segmentBuffer[
          pos[1] * image.image.width + pos[0]
        ] = { node, boundary: false };
      }
    },
    (pos, alpha) => {
      const entry =
        state.condensedState.segmentBuffer[pos[1] * image.image.width + pos[0]];
      if (entry && alpha) {
        entry.boundary = alpha === 1.0;
        if (entry.node.type === "SplitNode") {
          const stringified = `${pos[0]},${pos[1]}`;
          if (entry.boundary) {
            entry.node.data!.event.boundary.add(stringified);
          } else {
            entry.node.data!.event.fillStart = pos;
            entry.node.data!.event.boundary.delete(stringified);
          }
        }
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
    splitInfo.map((splitInfo) => ({
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
        for (const point of current.data!.event.boundary) {
          initialState.push({
            type: "Split",
            position: point.split(",").map((x) => parseInt(x)),
            segment: current.data!.event.segment,
            color: current.data!.event.color,
            historyIndex: current.data!.historyIndex,
            fillStart: current.data!.event.fillStart,
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
    console.log(initialState);
    return response.status(200).json({ initialState });
  }
}
