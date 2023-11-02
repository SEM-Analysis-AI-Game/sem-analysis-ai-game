type BFTNode = {
  data: readonly [number, number];
  next: BFTNode | null;
};

export const kAdjacency = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
] as const;

/**
 * Traverses breadth first, only visiting points that pass the test.
 * The test has an exit loop callback that can be called to break out
 * of the traversal early.
 */
export function breadthFirstTraversal(
  start: readonly [number, number],
  test: (pos: readonly [number, number], exitLoop: () => void) => boolean,
  allowDiagonal: boolean
): Set<string> {
  const visited = new Set<string>();
  let queue: BFTNode | null = {
    data: start,
    next: null,
  };
  let tail = queue;
  if (test(start, () => {})) {
    let breakLoop = false;
    while (queue && !breakLoop) {
      const current = queue.data;
      const exitLoop = () => {
        breakLoop = true;
      };
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
            tail.next = {
              data: neighborPos,
              next: null,
            };
            tail = tail.next;
          }
        }
      }
      queue = queue.next;
    }
  }
  return visited;
}
