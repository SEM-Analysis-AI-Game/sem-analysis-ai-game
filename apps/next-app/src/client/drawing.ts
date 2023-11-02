import { DrawEvent, applyDrawEvent, getColor, smoothDraw } from "@/common";
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
  boundary: boolean
): void {
  const color = getColor(segment);
  const pixelIndex = (pos[1] * state.resolution[0] + pos[0]) * 4;
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
  event: DrawEvent
): { effectedSegment: number; points: Set<string> }[] {
  return smoothDraw(
    (pos, _, newEntry) =>
      fill(state, pos, newEntry.id, newEntry.inSegmentNeighbors < 4),
    state,
    event
  );
}

export function applyDrawEventClient(
  state: ClientState,
  activeSegment: number,
  event: DrawEvent
): void {
  applyDrawEvent(
    (pos, _, newEntry) =>
      fill(state, pos, newEntry.id, newEntry.inSegmentNeighbors < 4),
    state,
    activeSegment,
    event
  );
}
