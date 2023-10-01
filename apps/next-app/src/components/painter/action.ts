export abstract class CanvasAction {
  public abstract undo(): void;
  public abstract redo(): void;

  constructor() {}
}

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
  private readonly tail: Node<CanvasAction>;

  private current: Node<CanvasAction>;

  constructor() {
    this.head = new Node(new EmptyAction());
    this.tail = new Node(new EmptyAction());
    this.head.next = this.tail;
    this.current = this.head;
  }

  public undo(): void {
    if (this.current.prev) {
      this.current.data.undo();
      this.current = this.current.prev;
    } else {
      throw new Error("Cannot undo empty history");
    }
  }

  public redo(): void {
    if (this.current.next) {
      this.current = this.current.next;
      this.current.data.redo();
    } else {
      throw new Error("Cannot redo up to date history");
    }
  }

  public push(action: CanvasAction): void {
    const node = new Node(action);
    node.prev = this.current;
    node.next = this.tail;
    this.tail.prev = node;
    this.current.next = node;
    this.current = node;
  }
}
