import { Dispatch, createContext } from "react";
import { TexturePainterAction, TexturePainterState } from "./state";

export const TexturePainterStateContext =
  createContext<TexturePainterState | null>(null);
export const TexturePainterActionDispatchContext =
  createContext<Dispatch<TexturePainterAction> | null>(null);
