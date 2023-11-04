import {
  DrawEvent,
  applyDrawEvent,
  fillCuts,
  getColor,
  getSegmentEntry,
  kAdjacency,
  smoothDraw,
} from "@/common";
import { ClientState } from "./state";

/**
 * The alpha value to use when drawing.
 */
const kDrawAlpha = 0.5;

/**
 * The alpha value to add to kDrawAlpha when drawing the border of a segment.
 */
const kBorderAlphaBoost = 0.5;

function fill(
  state: ClientState,
  pos: readonly [number, number],
  segment: number,
  boundary: boolean,
  flipY: boolean
): void {
  const color = getColor(segment);
  const pixelIndex =
    ((flipY ? state.resolution[1] - pos[1] : pos[1]) * state.resolution[0] +
      pos[0]) *
    4;
  const data = state.drawing.image.data;
  data[pixelIndex] = color.r * 255;
  data[pixelIndex + 1] = color.g * 255;
  data[pixelIndex + 2] = color.b * 255;
  data[pixelIndex + 3] =
    (boundary ? kDrawAlpha + kBorderAlphaBoost : kDrawAlpha) * 255;
  state.drawing.needsUpdate = true;
}

export function smoothDrawClient(
  state: ClientState,
  event: DrawEvent,
  flipY: boolean
): void {
  const { cuts } = smoothDraw(
    (pos, _, newEntry) =>
      fill(state, pos, newEntry.id, newEntry.inSegmentNeighbors < 4, flipY),
    () => {},
    state,
    event
  );
  fillCutsClient(state, cuts, flipY);
}

export function applyDrawEventClient(
  state: ClientState,
  activeSegment: number,
  event: DrawEvent
): void {
  applyDrawEvent(
    (pos, _, newEntry) =>
      fill(state, pos, newEntry.id, newEntry.inSegmentNeighbors < 4, false),
    state,
    activeSegment,
    event
  );
}

export function fillCutsClient(
  state: ClientState,
  cuts: { segment: number; points: Set<string> }[],
  flipY: boolean
): void {
  fillCuts(
    (pos, entry) => {
      if (entry.inSegmentNeighbors < 4) {
        let numNeighbors: 0 | 1 | 2 | 3 | 4 = 0;
        for (const neighbor of kAdjacency) {
          const neighborPos = [
            pos[0] + neighbor[0],
            pos[1] + neighbor[1],
          ] as const;
          const neighborEntry = getSegmentEntry(state, neighborPos);
          const neighborId = neighborEntry ? neighborEntry.id : -1;
          if (neighborId === entry.id) {
            switch (numNeighbors) {
              case 0:
                numNeighbors = 1;
                break;
              case 1:
                numNeighbors = 2;
                break;
              case 2:
                numNeighbors = 3;
                break;
              case 3:
                numNeighbors = 4;
                break;
            }
          }
        }
        entry.inSegmentNeighbors = numNeighbors;
        fill(state, pos, entry.id, numNeighbors < 4, flipY);
      } else {
        fill(state, pos, entry.id, false, flipY);
      }
    },
    state,
    cuts
  );
}
