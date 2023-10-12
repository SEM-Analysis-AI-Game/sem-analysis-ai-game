import * as THREE from "three";
import { PointContainer, hasPoint, setPoint } from "../point-container";

type BFTNode = {
  data: THREE.Vector2;
  next: BFTNode | null;
};

/**
 * Traverses breadth first, only visiting points that pass the test.
 * The test has an exit loop callback that can be called to break out
 * of the traversal early.
 *
 * Returns the visited points.
 */
export function breadthFirstTraversal(
  start: THREE.Vector2,
  test: (pos: THREE.Vector2, exitLoop: () => void) => boolean,
  neighbors: [number, number][]
): PointContainer {
  const visited: PointContainer = {
    size: 0,
    points: new Map(),
  };
  let queue: BFTNode | null = {
    data: start,
    next: null,
  };
  let tail = queue;
  let breakLoop = false;
  while (queue && !breakLoop) {
    const current = queue.data;
    const exitLoop = () => {
      breakLoop = true;
    };
    if (test(current, exitLoop)) {
      if (!hasPoint(visited, current.x, current.y)) {
        setPoint(visited, current.x, current.y, null);
        for (let neighbor of neighbors) {
          const neighborPos = new THREE.Vector2(
            current.x + neighbor[0],
            current.y + neighbor[1]
          );
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
    }
    queue = queue.next;
  }
  return visited;
}
