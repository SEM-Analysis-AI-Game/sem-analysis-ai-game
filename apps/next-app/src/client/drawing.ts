import {
  DrawEvent,
  FloodFillEvent,
  FloodFillResponse,
  applyDrawEvent,
  floodFill,
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
  flipY: boolean,
  premultiplyBackgroundAlpha: Uint8ClampedArray | null
): void {
  const color = getColor(segment);
  const pixelIndex =
    ((flipY ? state.resolution[1] - pos[1] : pos[1]) * state.resolution[0] +
      pos[0]) *
    4;
  const overlayAlpha = boundary ? kDrawAlpha + kBorderAlphaBoost : kDrawAlpha;
  const data = state.drawing.image.data;
  const overlayRed = color.r * 255;
  const overlayGreen = color.g * 255;
  const overlayBlue = color.b * 255;
  if (premultiplyBackgroundAlpha) {
    const backgroundRed = premultiplyBackgroundAlpha[pixelIndex];
    const backgroundGreen = premultiplyBackgroundAlpha[pixelIndex + 1];
    const backgroundBlue = premultiplyBackgroundAlpha[pixelIndex + 2];
    const premultipliedRed = Math.min(
      overlayRed * overlayAlpha + backgroundRed * (1 - overlayAlpha),
      255
    );
    const premultipliedGreen = Math.min(
      overlayGreen * overlayAlpha + backgroundGreen * (1 - overlayAlpha),
      255
    );
    const premultipliedBlue = Math.min(
      overlayBlue * overlayAlpha + backgroundBlue * (1 - overlayAlpha),
      255
    );
    data[pixelIndex] = premultipliedRed;
    data[pixelIndex + 1] = premultipliedGreen;
    data[pixelIndex + 2] = premultipliedBlue;
    data[pixelIndex + 3] = 255;
  } else {
    data[pixelIndex] = overlayRed;
    data[pixelIndex + 1] = overlayGreen;
    data[pixelIndex + 2] = overlayBlue;
    data[pixelIndex + 3] = overlayAlpha * 255;
  }
  state.drawing.needsUpdate = true;
}

export function smoothDrawClient(
  state: ClientState,
  event: DrawEvent,
  flipY: boolean,
  premultiplyBackgroundAlpha: Uint8ClampedArray | null
): void {
  const { fills } = smoothDraw(
    (pos, _, newEntry) =>
      fill(
        state,
        pos,
        newEntry.id,
        newEntry.inSegmentNeighbors < 4,
        flipY,
        premultiplyBackgroundAlpha
      ),
    () => {},
    state,
    event
  );
  floodFillClient(
    state,
    fills.map((fill) => ({
      segment: fill.segment,
      startingPoint: (fill.points.values().next().value as string)
        .split(",")
        .map((value) => parseInt(value)) as [number, number],
    })),
    flipY,
    premultiplyBackgroundAlpha
  );
}

export function applyDrawEventClient(
  state: ClientState,
  activeSegment: number,
  event: DrawEvent
): void {
  applyDrawEvent(
    (pos, _, newEntry) =>
      fill(
        state,
        pos,
        newEntry.id,
        newEntry.inSegmentNeighbors < 4,
        false,
        null
      ),
    state,
    activeSegment,
    event
  );
}

export function floodFillClient(
  state: ClientState,
  fills: FloodFillResponse[],
  flipY: boolean,
  premultiplyBackgroundAlpha: Uint8ClampedArray | null
): void {
  floodFill(
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
        fill(
          state,
          pos,
          entry.id,
          numNeighbors < 4,
          flipY,
          premultiplyBackgroundAlpha
        );
      } else {
        fill(state, pos, entry.id, false, flipY, premultiplyBackgroundAlpha);
      }
    },
    state,
    fills.map((fill) => ({
      fill: fill,
      bfsStart: fill.startingPoint,
    }))
  );
}
