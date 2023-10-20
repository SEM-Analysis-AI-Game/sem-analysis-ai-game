import * as THREE from "three";

/**
 * The controls state is used to keep track of the current inputs.
 */
export type Controls = {
  readonly zoom: number;
  readonly pan: THREE.Vector2;
  readonly cursorDown: boolean;
  readonly zooming: boolean;
  readonly shiftDown: boolean;
};

export type ControlsEvent = Zoom | Pan | Cursor;

/**
 * Used to update the zoom level.
 */
type Zoom = {
  type: "zoom";
  newZoom: number;
  zooming: boolean;
  origin: THREE.Vector2;
};

/**
 * Used to update the pan.
 */
type Pan = {
  type: "pan";
  newPan: THREE.Vector2;
};

/**
 * Used to update the cursor down state and the shift down state.
 */
type Cursor = {
  type: "cursor";
  cursorDown: boolean;
  shiftDown: boolean;
};

/**
 * Calculates the bounds of the pan based on the zoom level.
 */
export function panBounds(zoom: number) {
  return new THREE.Vector2(1.0, 1.0).subScalar(1.0 / Math.sqrt(zoom));
}

/**
 * The controls reducer is used to update the controls state based on
 * user input.
 */
export function controlsReducer(
  state: Controls,
  event: ControlsEvent
): Controls {
  switch (event.type) {
    case "cursor":
      return {
        ...state,
        cursorDown: event.cursorDown,
        shiftDown: event.shiftDown,
      };
    case "pan":
      return {
        ...state,
        pan: event.newPan,
      };
    case "zoom":
      const newPanBounds = panBounds(event.newZoom);
      if (event.zooming) {
        const originOffset = event.origin.clone().sub(state.pan);
        const scaledOriginOffset = originOffset
          .clone()
          .multiplyScalar(Math.sqrt(event.newZoom / state.zoom));
        return {
          ...state,
          pan: state.pan
            .clone()
            .add(scaledOriginOffset.clone().sub(originOffset))
            .clamp(newPanBounds.clone().negate(), newPanBounds),
          zoom: event.newZoom,
          zooming: true,
        };
      }
      return {
        ...state,
        pan: state.pan.clamp(newPanBounds.clone().negate(), newPanBounds),
        zoom: event.newZoom,
        zooming: false,
      };
  }
}
