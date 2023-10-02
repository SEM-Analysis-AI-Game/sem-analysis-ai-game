"use client";

import { createContext, useContext, useMemo } from "react";
import { CanvasAction } from "./action";

abstract class Node<T> {
  public next: Node<T> | null;
  public prev: Node<T> | null;

  public data: T | null;

  constructor() {
    this.next = null;
    this.prev = null;
    this.data = null;
  }
}

class Head<T> extends Node<T> {
  constructor() {
    super();
  }
}

class DataNode<T> extends Node<T> {
  constructor(data: T) {
    super();
    this.data = data;
  }
}

export class ActionHistory {
  private readonly head: Node<CanvasAction>;

  private current: Node<CanvasAction>;

  constructor() {
    this.head = new Head();
    this.current = this.head;
  }

  public clear(): void {
    this.head.next = null;
    this.current = this.head;
  }

  public undo(): void {
    if (this.current.prev) {
      this.current.data!.paintedPoints.forEach((x, y, data) => {
        this.current.data!.drawingLayer.setSegment(x, y, data.oldSegment);
      });
      this.current = this.current.prev;
    }
  }

  public redo(): void {
    if (this.current.next) {
      this.current = this.current.next;
      this.current.data!.paintedPoints.forEach((x, y, data) => {
        this.current.data!.drawingLayer.setSegment(x, y, data.newSegment);
      });
    }
  }

  public push(action: CanvasAction): void {
    const node = new DataNode(action);
    node.prev = this.current;
    this.current.next = node;
    this.current = node;
  }
}

export const ActionHistoryContext = createContext<ActionHistory | null>(null);

export function useActionHistory(): ActionHistory {
  const history = useContext(ActionHistoryContext);

  if (!history) {
    throw new Error(
      "useActionHistory must be used within an ActionHistoryContext"
    );
  }

  return history;
}

export function ActionHistoryProvider(props: {
  children: JSX.Element;
}): JSX.Element {
  const history = useMemo(() => new ActionHistory(), []);

  return (
    <ActionHistoryContext.Provider value={history}>
      {props.children}
    </ActionHistoryContext.Provider>
  );
}
