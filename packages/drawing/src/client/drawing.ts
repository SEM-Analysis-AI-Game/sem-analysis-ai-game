import { applyDrawEvent, drawAndFindSplits, floodFill } from "../drawing";
import { DrawEvent, DrawResponse, FloodFillResponse } from "../state";
import { getColor } from "./colors";
import { ClientState } from "./state";

/**
 * The alpha value to use when drawing.
 */
const kDrawAlpha = 0.5;

/**
 * The alpha value to add to kDrawAlpha when drawing the border of a segment.
 */
const kBorderAlphaBoost = 0.5;

/**
 * Fills a pixel on the canvas with the given segment.
 *
 * @param boundary Whether or not the pixel is on the boundary of the segment.
 * @param flipY Whether or not to flip the y coordinate.
 * @param background The background image to overlay this pixel on, or null if
 *                   there is no background image.
 */
function fillImagePixel(
  state: ClientState,
  pos: readonly [number, number],
  segment: number,
  boundary: boolean
): void {
  const color = getColor(segment);
  const pixelIndex =
    ((state.flipY ? state.resolution[1] - pos[1] : pos[1]) *
      state.resolution[0] +
      pos[0]) *
    4;

  const overlayAlpha = boundary ? kDrawAlpha + kBorderAlphaBoost : kDrawAlpha;

  const data = state.drawing.image.data;

  const overlayRed = color.r * 255;
  const overlayGreen = color.g * 255;
  const overlayBlue = color.b * 255;

  if (state.background) {
    const backgroundRed = state.background[pixelIndex];
    const backgroundGreen = state.background[pixelIndex + 1];
    const backgroundBlue = state.background[pixelIndex + 2];

    /**
     * Overlays the drawing over the background pixel using the premultiply alpha algorithm
     */
    function premultiplyAlpha(overlayColor: number, backgroundColor: number) {
      return Math.min(
        overlayColor * overlayAlpha + backgroundColor * (1 - overlayAlpha)
      );
    }

    const premultipliedRed = premultiplyAlpha(overlayRed, backgroundRed);
    const premultipliedGreen = premultiplyAlpha(overlayGreen, backgroundGreen);
    const premultipliedBlue = premultiplyAlpha(overlayBlue, backgroundBlue);

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

/**
 * Fill every pixel on the image based on the current data stored in the canvas
 * array.
 */
export function drawImage(state: ClientState): void {
  for (let i = 0; i < state.canvas.length; i++) {
    const data = state.canvas[i];
    if (data) {
      fillImagePixel(
        state,
        [i % state.resolution[0], Math.floor(i / state.resolution[0])] as const,
        data.segment,
        data.inSegmentNeighbors < 4
      );
    } else if (state.background) {
      state.drawing.image.data[i * 4] = state.background[i * 4];
      state.drawing.image.data[i * 4 + 1] = state.background[i * 4 + 1];
      state.drawing.image.data[i * 4 + 2] = state.background[i * 4 + 2];
      state.drawing.image.data[i * 4 + 3] = state.background[i * 4 + 3];
      state.drawing.needsUpdate = true;
    }
  }
}

/**
 * Applies a draw event to the canvas without any segment splits.
 */
export function applyDrawEventClient(
  state: ClientState,
  event: Omit<DrawResponse, "historyIndex">,
  updateDrawing: boolean
): void {
  return applyDrawEvent(
    updateDrawing
      ? (pos, _, newData) =>
          fillImagePixel(
            state,
            pos,
            newData.segment,
            newData.inSegmentNeighbors < 4
          )
      : () => {},
    state,
    event
  );
}

/**
 * Applies a draw event to the canvas as well as any relevant segment splits.
 */
export function drawClient(
  state: ClientState,
  event: DrawEvent,
  updateDrawing: boolean
): void {
  floodFillClient(
    state,
    drawAndFindSplits(
      updateDrawing
        ? (pos, _, newData) => {
            fillImagePixel(
              state,
              pos,
              newData.segment,
              newData.inSegmentNeighbors < 4
            );
          }
        : () => {},
      () => {},
      state,
      event
    ).fills.map((fill) => ({
      startingPoint: (fill.points.values().next().value as string)
        .split(",")
        .map((value) => parseInt(value)) as [number, number],
      segment: fill.segment,
    })),
    updateDrawing
  );
}

export function floodFillClient(
  state: ClientState,
  fills: readonly FloodFillResponse[],
  updateDrawing: boolean
): void {
  return floodFill(
    updateDrawing
      ? (pos, data) =>
          fillImagePixel(state, pos, data.segment, data.inSegmentNeighbors < 4)
      : () => {},
    state,
    fills,
    "FloodFillResponse"
  );
}
