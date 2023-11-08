export type HeadNode<T> = {
  next: DoublyLinkedListNode<T> | null;
};

export type DoublyLinkedListNode<T> = {
  value: T;
  next: DoublyLinkedListNode<T> | null;
  prev: DoublyLinkedListNode<T> | HeadNode<T>;
};

/**
 * Doubly linked list with a sentinel head node. Ideal for removal from the middle of
 * the list. This is used for the short log of draws and fills, so that we can quickly
 * remove a draw or fill from the middle of the list when it is no longer needed.
 */
export type DoublyLinkedList<T> = {
  head: HeadNode<T>;
  tail: HeadNode<T> | DoublyLinkedListNode<T>;
  length: number;
};

/**
 * Pushes a value to the end of the list.
 */
export function push<T>(
  list: DoublyLinkedList<T>,
  node: DoublyLinkedListNode<T>
) {
  list.length++;
  list.tail.next = node;
  list.tail = node;
}

/**
 * Removes a node from the list and returns its value.
 */
export function remove<T>(
  list: DoublyLinkedList<T>,
  node: DoublyLinkedListNode<T>
): T {
  list.length--;
  node.prev.next = node.next;
  if (node.next) {
    node.next.prev = node.prev;
  } else {
    list.tail = node.prev;
  }
  return node.value;
}
