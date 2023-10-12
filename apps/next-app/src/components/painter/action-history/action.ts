import { PointContainer } from "../point-container";

/**
 * Represents an action that can be undone or redone.
 */
export type CanvasAction = {
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

  /**
   * The segments that were effected by this action. This is not used for
   * undoing or redoing, but is used for determining if a segment needs to
   * be split. It is useful to track this information in the action since
   * the action's lifetime consists of one brush stroke.
   *
   * The key is the segment ID, and the value is the new boundary points that
   * were created by this action.
   *
   * This container is mutable, because it can be modified on
   * every frame. If it were immutable, we would have to copy it
   * on every update, which would be extremely slow.
   */
  readonly effectedSegments: Map<number, { newBoundaryPoints: PointContainer }>;
};
