import { LinkedList, pop, push } from "./linked-list";

export const kAdjacency = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
] as const;

/**
 * Traverses breadth first, only visiting points that pass the test. The test has an
 * exit loop callback that can be called to break out of the traversal early.
 */
export function breadthFirstTraversal(
  start: readonly [number, number],
  test: (pos: readonly [number, number], exitLoop: () => void) => boolean,
  allowDiagonal: boolean
): Set<string> {
  const visited = new Set<string>();

  const head = {
    next: null,
  };
  const queue: LinkedList<readonly [number, number]> = {
    head,
    tail: head,
    length: 0,
  };

  push(queue, start);

  if (test(start, () => {})) {
    let breakLoop = false;
    let current = pop(queue);
    while (current && !breakLoop) {
      function exitLoop() {
        breakLoop = true;
      }

      const stringify = `${current[0]},${current[1]}`;
      if (!visited.has(stringify)) {
        visited.add(stringify);
        for (let neighbor of [
          ...kAdjacency,
          ...(allowDiagonal
            ? [
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1],
              ]
            : []),
        ]) {
          const neighborPos = [
            current[0] + neighbor[0],
            current[1] + neighbor[1],
          ] as const;
          if (test(neighborPos, exitLoop)) {
            if (breakLoop) {
              break;
            }
            push(queue, neighborPos);
          }
        }
      }
      current = pop(queue);
    }
  }
  return visited;
}
