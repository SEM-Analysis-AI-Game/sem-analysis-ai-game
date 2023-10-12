import * as THREE from "three";

export type Controls = {
  readonly zoom: number;
  readonly pan: THREE.Vector2;
  readonly cursorDown: boolean;
  readonly zooming: boolean;
  readonly shiftDown: boolean;
};

type Zoom = {
  type: "zoom";
  newZoom: number;
  zooming: boolean;
};

type Pan = {
  type: "pan";
  newPan: THREE.Vector2;
};

type Cursor = {
  type: "cursor";
  cursorDown: boolean;
  shiftDown: boolean;
};

export type ControlsEvent = Zoom | Pan | Cursor;

function panBounds(zoom: number) {
  return new THREE.Vector2(1.0, 1.0).subScalar(1.0 / Math.sqrt(zoom));
}

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
      const bounds = panBounds(state.zoom);
      return {
        ...state,
        pan: event.newPan.clamp(bounds.clone().negate(), bounds),
      };
    case "zoom":
      const newPanBounds = panBounds(event.newZoom);
      return {
        ...state,
        pan: state.pan.clamp(newPanBounds.clone().negate(), newPanBounds),
        zoom: event.newZoom,
        zooming: event.zooming,
      };
  }
}
