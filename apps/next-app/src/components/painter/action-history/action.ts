import { PointContainer } from "../point-container";

/**
 * Represents an action that can be undone or redone.
 */
export type HistoryAction = {
  /**
   * The points that were painted by this action.
   *
   * This container is mutable, because it can be modified on
   * every frame. If it were immutable, we would have to copy it
   * on every update, which would be extremely slow.
   */
  readonly paintedPoints: PointContainer<{
    oldSegment: number;
    newSegment: number;
  }>;
};
