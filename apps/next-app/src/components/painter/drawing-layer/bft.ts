import * as THREE from "three";
import { PointContainer } from "../point-container";

type BFTNode = {
  data: THREE.Vector2;
  next: BFTNode | null;
};

export function breadthFirstTraversal(
  start: THREE.Vector2,
  test: (pos: THREE.Vector2, exitLoop: () => void) => boolean,
  neighbors: [number, number][]
): PointContainer {
  const visited = new PointContainer();
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
      if (!visited.hasPoint(current.x, current.y)) {
        visited.setPoint(current.x, current.y, null);
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
