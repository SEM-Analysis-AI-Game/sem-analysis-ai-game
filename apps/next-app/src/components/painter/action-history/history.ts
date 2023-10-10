import * as THREE from "three";
import { Dispatch, SetStateAction } from "react";
import { CanvasAction } from "./action";
import { PainterStatistics } from "../statistics";

/**
 * This class represents a node in the action history linked list.
 *
 * We use a doubly-linked list because we need to be able to insert and remove nodes
 * at the back of the list in constant time, and traverse the list in both directions.
 */
abstract class HistoryNode<T> {
  public next: HistoryNode<T> | null;
  public prev: HistoryNode<T> | null;

  public readonly data: T | null;

  constructor(data: T | null) {
    this.next = null;
    this.prev = null;
    this.data = data;
  }
}

/**
 * This class represents a node in the action history linked list that contains data.
 */
class DataNode<T> extends HistoryNode<T> {
  constructor(data: T) {
    super(data);
  }
}

/**
 * This class represents the head node in the action history linked list, which contains no data.
 */
class HeadNode<T> extends HistoryNode<T> {
  constructor() {
    super(null);
  }
}

/**
 * This class represents the undo/redo history.
 */
export class ActionHistory {
  private readonly head: HeadNode<CanvasAction>;
  private current: HistoryNode<CanvasAction>;
  private readonly setStatistics: Dispatch<SetStateAction<PainterStatistics>>;

  constructor(setStatistics: Dispatch<SetStateAction<PainterStatistics>>) {
    this.head = new HeadNode();
    this.current = this.head;
    this.setStatistics = setStatistics;
  }

  /**
   * Clear the history.
   */
  public clear(): void {
    this.current = this.head;
  }

  public undo(): void {
    if (this.current.prev) {
      this.current.data!.paintedPoints.forEach((x, y, data) => {
        // Utilize the old segment data to undo the action.
        // This is the segment that was painted over by the action.
        this.current.data!.drawingLayer.setSegment(x, y, data.oldSegment);
        this.setStatistics((statistics) => {
          const segments = statistics.segments;
          if (data.oldSegment !== -1) {
            const oldSegmentEntry = segments.get(data.oldSegment)!;
            if (oldSegmentEntry.numPoints > 0) {
              oldSegmentEntry.centroid
                .multiplyScalar(oldSegmentEntry.numPoints)
                .add(new THREE.Vector2(x, y))
                .divideScalar(oldSegmentEntry.numPoints + 1);
            } else {
              oldSegmentEntry.centroid.set(x, y);
            }
            oldSegmentEntry.numPoints++;
          }
          if (data.newSegment !== -1) {
            const newSegmentEntry = segments.get(data.newSegment)!;
            newSegmentEntry.centroid
              .multiplyScalar(newSegmentEntry.numPoints)
              .sub(new THREE.Vector2(x, y))
              .divideScalar(newSegmentEntry.numPoints - 1);
            newSegmentEntry.numPoints--;
          }
          return { segments };
        });
      });
      this.current = this.current.prev;
    }
  }

  public redo(): void {
    if (this.current.next) {
      this.current = this.current.next;
      this.current.data!.paintedPoints.forEach((x, y, data) => {
        // Utilize the new segment data to redo the action.
        this.current.data!.drawingLayer.setSegment(x, y, data.newSegment);

        this.setStatistics((statistics) => {
          const segments = statistics.segments;

          if (data.oldSegment !== -1) {
            const oldSegmentEntry = segments.get(data.oldSegment)!;
            oldSegmentEntry.centroid
              .multiplyScalar(oldSegmentEntry.numPoints)
              .sub(new THREE.Vector2(x, y))
              .divideScalar(oldSegmentEntry.numPoints - 1);
            oldSegmentEntry.numPoints--;
          }
          if (data.newSegment !== -1) {
            const newSegmentEntry = segments.get(data.newSegment)!;
            if (newSegmentEntry.numPoints > 0) {
              newSegmentEntry.centroid
                .multiplyScalar(newSegmentEntry.numPoints)
                .add(new THREE.Vector2(x, y))
                .divideScalar(newSegmentEntry.numPoints + 1);
            } else {
              newSegmentEntry.centroid.set(x, y);
            }
            newSegmentEntry.numPoints++;
          }
          return { segments };
        });
      });
    }
  }

  /**
   * Push an action onto the history. This removes any actions that were undone.
   */
  public push(action: CanvasAction): void {
    const node = new DataNode(action);
    node.prev = this.current;
    this.current.next = node;
    this.current = node;
  }
}
