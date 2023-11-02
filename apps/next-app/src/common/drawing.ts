import { breadthFirstTraversal, kAdjacency } from "./bft";
import { getBrush } from "./brush";
import { DrawEvent, State } from "./state";

export function getSegmentEntry<StateType extends State>(
  state: StateType,
  pos: readonly [number, number]
): StateType["segmentBuffer"][number] {
  return state.segmentBuffer[pos[1] * state.resolution[0] + pos[0]];
}

export function applyDrawEvent<StateType extends State>(
  onUpdateSegment: (
    pos: readonly [number, number],
    oldSegment: number,
    newEntry: StateType["segmentBuffer"][number]
  ) => void,
  state: StateType,
  activeSegment: number,
  event: DrawEvent
): void {
  function setSegment(
    pos: readonly [number, number],
    numNeighbors: 0 | 1 | 2 | 3 | 4
  ) {
    let entry = state.segmentBuffer[pos[1] * state.resolution[0] + pos[0]];
    if (!entry) {
      entry = { id: activeSegment, inSegmentNeighbors: numNeighbors };
      state.segmentBuffer[pos[1] * state.resolution[0] + pos[0]] = entry;
    }
    entry.id = activeSegment;
    entry.inSegmentNeighbors = numNeighbors;
    return entry;
  }

  function setNonBoundarySegment(pos: readonly [number, number]) {
    const oldSegmentEntry = getSegmentEntry(state, pos);
    const oldSegmentId = oldSegmentEntry ? oldSegmentEntry.id : -1;
    if (
      !oldSegmentEntry ||
      oldSegmentEntry.id !== activeSegment ||
      oldSegmentEntry.inSegmentNeighbors < 4
    ) {
      const entry = setSegment(pos, 4);
      onUpdateSegment(pos, oldSegmentId, entry);
    }
  }

  function setBoundarySegment(pos: readonly [number, number]) {
    let numNeighbors: 0 | 1 | 2 | 3 | 4 = 0;
    const segmentEntry = getSegmentEntry(state, pos);
    const oldSegmentId = segmentEntry ? segmentEntry.id : -1;
    const oldNumNeighbors = segmentEntry ? segmentEntry.inSegmentNeighbors : -1;
    for (const neighbor of kAdjacency) {
      const neighborPos = [pos[0] + neighbor[0], pos[1] + neighbor[1]] as const;
      if (
        neighborPos[0] >= 0 &&
        neighborPos[1] >= 0 &&
        neighborPos[0] < state.resolution[0] &&
        neighborPos[1] < state.resolution[1]
      ) {
        const neighborSegmentEntry = getSegmentEntry(state, neighborPos);
        const neighborSegmentId = neighborSegmentEntry
          ? neighborSegmentEntry.id
          : -1;
        if (neighborSegmentId === activeSegment) {
          // using switch here instead of increment operator to retain type info
          switch (numNeighbors) {
            case 0:
              numNeighbors = 1;
              break;
            case 1:
              numNeighbors = 2;
              break;
            case 2:
              numNeighbors = 3;
              break;
            case 3:
              numNeighbors = 4;
              break;
          }
          if (
            oldSegmentId !== activeSegment &&
            neighborSegmentEntry.inSegmentNeighbors < 4
          ) {
            switch (neighborSegmentEntry.inSegmentNeighbors) {
              case 0:
                neighborSegmentEntry.inSegmentNeighbors = 1;
                break;
              case 1:
                neighborSegmentEntry.inSegmentNeighbors = 2;
                break;
              case 2:
                neighborSegmentEntry.inSegmentNeighbors = 3;
                break;
              case 3:
                neighborSegmentEntry.inSegmentNeighbors = 4;
                break;
            }
            onUpdateSegment(
              neighborPos,
              neighborSegmentEntry.id,
              neighborSegmentEntry
            );
          }
        } else if (
          neighborSegmentId !== -1 &&
          neighborSegmentId === oldSegmentId
        ) {
          switch (neighborSegmentEntry.inSegmentNeighbors) {
            case 1:
              neighborSegmentEntry.inSegmentNeighbors = 0;
              break;
            case 2:
              neighborSegmentEntry.inSegmentNeighbors = 1;
              break;
            case 3:
              neighborSegmentEntry.inSegmentNeighbors = 2;
              break;
            case 4:
              neighborSegmentEntry.inSegmentNeighbors = 3;
              break;
          }
          onUpdateSegment(
            neighborPos,
            neighborSegmentEntry.id,
            neighborSegmentEntry
          );
        }
      }
    }
    const entry = setSegment(pos, numNeighbors);
    if (
      entry.id !== oldSegmentId ||
      entry.inSegmentNeighbors !== oldNumNeighbors
    ) {
      onUpdateSegment(pos, oldSegmentId, entry);
    }
  }

  const rectangleBoundary = new Set<string>();

  function drawLine(
    from: readonly [number, number],
    to: readonly [number, number]
  ) {
    const diff = [to[0] - from[0], to[1] - from[1]];
    const distance = Math.sqrt(diff[0] ** 2 + diff[1] ** 2);
    if (distance === 0) {
      return;
    }
    const step = [diff[0] / distance, diff[1] / distance];
    for (let x = 0; x < distance; x++) {
      const pos = [
        Math.ceil(from[0] + step[0] * x),
        Math.ceil(from[1] + step[1] * x),
      ] as const;
      if (
        pos[0] >= 0 &&
        pos[1] >= 0 &&
        pos[0] < state.resolution[0] &&
        pos[1] < state.resolution[1]
      ) {
        rectangleBoundary.add(`${pos[0]},${pos[1]}`);
      }
    }
  }

  const diff = [event.to[0] - event.from[0], event.to[1] - event.from[1]];
  const slope =
    diff[0] !== 0
      ? diff[1] / diff[0]
      : Infinity * (diff[1] !== 0 ? Math.sign(diff[1]) : 0);
  const perpendicularDistance = event.size / 2 - 1;

  const angle = Math.atan(-1 / slope);

  const xDistance = Math.cos(angle) * perpendicularDistance;
  const yDistance = Math.sin(angle) * perpendicularDistance;

  const rightEdgeStart = [
    Math.floor(event.from[0] + xDistance),
    Math.floor(event.from[1] + yDistance),
  ] as const;

  const leftEdgeStart = [
    Math.floor(event.from[0] - xDistance),
    Math.floor(event.from[1] - yDistance),
  ] as const;

  const rightEdgeEnd = [
    Math.floor(event.to[0] + xDistance),
    Math.floor(event.to[1] + yDistance),
  ] as const;

  const leftEdgeEnd = [
    Math.floor(event.to[0] - xDistance),
    Math.floor(event.to[1] - yDistance),
  ] as const;

  drawLine(rightEdgeStart, rightEdgeEnd);
  drawLine(leftEdgeStart, leftEdgeEnd);
  drawLine(rightEdgeEnd, leftEdgeEnd);
  drawLine(rightEdgeStart, leftEdgeStart);

  if (rectangleBoundary.size > 0) {
    breadthFirstTraversal(
      [
        Math.floor((event.from[0] + event.to[0]) / 2),
        Math.floor((event.from[1] + event.to[1]) / 2),
      ],
      (pos) => {
        if (
          pos[0] >= 0 &&
          pos[1] >= 0 &&
          pos[0] < state.resolution[0] &&
          pos[1] < state.resolution[1]
        ) {
          if (rectangleBoundary.has(`${pos[0]},${pos[1]}`)) {
            setBoundarySegment(pos);
            return false;
          } else {
            if (
              pos[0] === 0 ||
              pos[1] === 0 ||
              pos[0] === state.resolution[0] - 1 ||
              pos[1] === state.resolution[1] - 1
            ) {
              setBoundarySegment(pos);
            } else {
              setNonBoundarySegment(pos);
            }
            return true;
          }
        } else {
          return false;
        }
      },
      false
    );
  }

  function drawCircle(pos: readonly [number, number]): void {
    for (const { offset, boundary } of getBrush(event.size)) {
      const pixelPos = [pos[0] + offset[0], pos[1] + offset[1]] as const;
      if (
        pixelPos[0] >= 0 &&
        pixelPos[1] >= 0 &&
        pixelPos[0] < state.resolution[0] &&
        pixelPos[1] < state.resolution[1]
      ) {
        if (
          pixelPos[0] === 0 ||
          pixelPos[1] === 0 ||
          pixelPos[0] === state.resolution[0] - 1 ||
          pixelPos[1] === state.resolution[1] - 1 ||
          boundary
        ) {
          setBoundarySegment(pixelPos);
        } else {
          setNonBoundarySegment(pixelPos);
        }
      }
    }
  }

  drawCircle(event.to);

  drawCircle(event.from);
}

export function smoothDraw<StateType extends State>(
  onUpdateSegment: (
    pos: readonly [number, number],
    oldSegment: number,
    newEntry: StateType["segmentBuffer"][number]
  ) => void,
  state: StateType,
  event: DrawEvent
): { segment: number; points: Set<string> }[] {
  const segmentEntry = getSegmentEntry(state, event.from);
  const segment = segmentEntry ? segmentEntry.id : state.nextSegmentIndex++;

  const effectedSegments = new Map<
    number,
    { newBoundaryPoints: Set<string> }
  >();

  applyDrawEvent(
    (pos, oldSegment, newEntry) => {
      if (oldSegment !== -1 && oldSegment !== segment) {
        let oldSegmentEntry = effectedSegments.get(oldSegment);
        if (oldSegmentEntry) {
          oldSegmentEntry.newBoundaryPoints.delete(`${pos[0]},${pos[1]}`);
        } else {
          oldSegmentEntry = { newBoundaryPoints: new Set() };
          effectedSegments.set(oldSegment, oldSegmentEntry);
        }
        if (oldSegment === newEntry.id && newEntry.inSegmentNeighbors < 4) {
          oldSegmentEntry.newBoundaryPoints.add(`${pos[0]},${pos[1]}`);
        }
      }
      onUpdateSegment(pos, oldSegment, newEntry);
    },
    state,
    segment,
    event
  );

  const cuts: { segment: number; points: Set<string> }[] = [];
  for (const [effectedSegment, { newBoundaryPoints }] of effectedSegments) {
    while (newBoundaryPoints.size > 0) {
      const bfsStart = Object.freeze(
        (newBoundaryPoints.values().next().value as string)
          .split(",")
          .map((value) => parseInt(value)) as [number, number]
      );
      const visited = breadthFirstTraversal(
        bfsStart,
        (pos) =>
          pos[0] >= 0 &&
          pos[1] >= 0 &&
          pos[0] < state.resolution[0] &&
          pos[1] < state.resolution[1] &&
          newBoundaryPoints.delete(`${pos[0]},${pos[1]}`),
        true
      );
      if (newBoundaryPoints.size > 0) {
        breadthFirstTraversal(
          bfsStart,
          (pos, exitLoop) => {
            if (
              pos[0] >= 0 &&
              pos[1] >= 0 &&
              pos[0] < state.resolution[0] &&
              pos[1] < state.resolution[1]
            ) {
              const entry = getSegmentEntry(state, pos);
              if (
                entry &&
                entry.id === effectedSegment &&
                entry.inSegmentNeighbors < 4
              ) {
                const stringify = `${pos[0]},${pos[1]}`;
                if (newBoundaryPoints.delete(stringify)) {
                  visited.add(stringify);
                  if (newBoundaryPoints.size === 0) {
                    exitLoop();
                  }
                }
                return true;
              }
            }
            return false;
          },
          true
        );
        if (newBoundaryPoints.size > 0) {
          cuts.push({
            segment: state.nextSegmentIndex++,
            points: visited,
          });
          continue;
        }
      }
      cuts.push({
        segment: effectedSegment,
        points: visited,
      });
    }
  }

  return cuts;
}

export function fillCuts<StateType extends State>(
  onUpdateSegment: (
    pos: readonly [number, number],
    entry: StateType["segmentBuffer"][number],
    cut: { segment: number; points: Set<string> }
  ) => void,
  state: State,
  cuts: { segment: number; points: Set<string> }[]
): void {
  for (const cut of cuts) {
    const bfsStart = (cut.points.values().next().value as string)
      .split(",")
      .map((value) => parseInt(value)) as [number, number];
    const segmentEntry = getSegmentEntry(state, bfsStart);
    const segmentId = segmentEntry ? segmentEntry.id : -1;
    if (segmentId !== cut.segment) {
      breadthFirstTraversal(
        bfsStart,
        (pos) => {
          const entry = getSegmentEntry(state, pos);
          if (entry && entry.id === segmentId) {
            entry.id = cut.segment;
            onUpdateSegment(pos, entry, cut);
            return true;
          }
          return false;
        },
        true
      );
    }
  }
}
