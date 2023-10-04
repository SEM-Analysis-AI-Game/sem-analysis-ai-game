import { CanvasAction } from "./action";

/**
 * This class represents a node in the action history linked list.
 *
 * We use a doubly-linked list because we need to be able to insert and remove nodes
 * at the back of the list in constant time, and traverse the list in both directions.
 */
class HistoryNode<T> {
  public next: HistoryNode<T> | null;
  public prev: HistoryNode<T> | null;

  public readonly data;

  constructor(data: T) {
    this.next = null;
    this.prev = null;
    this.data = data;
  }
}

/**
 * This class represents the undo/redo history.
 */
export class ActionHistory {
  private current: HistoryNode<CanvasAction> | null = null;

  constructor() {
    this.current = null;
  }

  /**
   * Clear the history.
   */
  public clear(): void {
    this.current = null;
  }

  public undo(): void {
    if (this.current) {
      this.current.data.paintedPoints.forEach((x, y, data) => {
        // Utilize the old segment data to undo the action.
        // This is the segment that was painted over by the action.
        this.current!.data.drawingLayer.setSegment(x, y, data.oldSegment);
      });
      this.current = this.current.prev;
    }
  }

  public redo(): void {
    if (this.current && this.current.next) {
      this.current = this.current.next;
      this.current.data.paintedPoints.forEach((x, y, data) => {
        // Utilize the new segment data to redo the action.
        this.current!.data.drawingLayer.setSegment(x, y, data.newSegment);
      });
    }
  }

  /**
   * Push an action onto the history. This removes any actions that were undone.
   */
  public push(action: CanvasAction): void {
    const node = new HistoryNode(action);
    node.prev = this.current;
    if (this.current) {
      this.current.next = node;
    }
    this.current = node;
  }
}
