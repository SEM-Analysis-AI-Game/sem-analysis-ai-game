import * as THREE from "three";

export type Controls = {
  zoom: number;
  pan: THREE.Vector2;
  cursorDown: boolean;
  zooming: boolean;
  shiftDown: boolean;
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
      const panBounds = new THREE.Vector2(1.0, 1.0).subScalar(
        1.0 / Math.sqrt(state.zoom)
      );
      return {
        ...state,
        pan: event.newPan.clamp(panBounds.clone().negate(), panBounds),
      };
    case "zoom":
      const newPanBounds = new THREE.Vector2(1.0, 1.0).subScalar(
        1.0 / Math.sqrt(event.newZoom)
      );
      return {
        ...state,
        pan: state.pan.clamp(newPanBounds.clone().negate(), newPanBounds),
        zoom: event.newZoom,
        zooming: event.zooming,
      };
  }
}
