"use client";

import { createContext, useContext, useMemo } from "react";
import { CanvasAction } from "./action";

class EmptyAction extends CanvasAction {
  public undo(): void {
    throw new Error("Method not implemented.");
  }
  public redo(): void {
    throw new Error("Method not implemented.");
  }

  constructor() {
    super();
  }
}

class Node<T> {
  public next: Node<T> | null;
  public prev: Node<T> | null;

  public data: T;

  constructor(data: T) {
    this.next = null;
    this.prev = null;
    this.data = data;
  }
}

export class ActionHistory {
  private readonly head: Node<CanvasAction>;

  private current: Node<CanvasAction>;

  constructor() {
    this.head = new Node(new EmptyAction());
    this.current = this.head;
  }

  public undo(): void {
    if (this.current.prev) {
      this.current.data.undo();
      this.current = this.current.prev;
    }
  }

  public redo(): void {
    if (this.current.next) {
      this.current = this.current.next;
      this.current.data.redo();
    }
  }

  public push(action: CanvasAction): void {
    const node = new Node(action);
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
