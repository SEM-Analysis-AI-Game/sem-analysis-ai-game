export type HeadNode<T> = {
  next: LinkedListNode<T> | null;
};

export type LinkedListNode<T> = {
  value: T;
  next: LinkedListNode<T> | null;
};

/**
 * Singly linked list with a sentinel head node. Ideal for FIFO queues.
 */
export type LinkedList<T> = {
  head: HeadNode<T>;
  tail: HeadNode<T> | LinkedListNode<T>;
  length: number;
};

/**
 * Pushes a value to the end of the list.
 */
export function push<T>(list: LinkedList<T>, value: T) {
  const node: LinkedListNode<T> = {
    value,
    next: null,
  };
  list.length++;
  list.tail.next = node;
  list.tail = node;
}

/**
 * Removes the first value from the list and returns it. Returns null if the list is empty.
 */
export function pop<T>(list: LinkedList<T>): T | null {
  if (list.length === 0) {
    return null;
  }
  const node = list.head.next!;
  list.length--;
  list.head.next = node.next;
  if (list.tail === node) {
    list.tail = list.head;
  }
  return node.value;
}
