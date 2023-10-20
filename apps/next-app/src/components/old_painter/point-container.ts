/**
 * Useful data structure for storing points with
 * constant access time.
 *
 * Uses nested maps to store the points.
 */
export type PointContainer<D = null> = {
  readonly points: Map<number, Map<number, D>>;
  size: number;
};

export function mapPoints<T, D>(
  container: PointContainer<D>,
  callback: (x: number, y: number, data: D) => T
): PointContainer<T> {
  const result = {
    points: new Map<number, Map<number, T>>(),
    size: 0,
  };
  container.points.forEach((yMap, x) => {
    yMap.forEach((data, y) => {
      setPoint(result, x, y, callback(x, y, data));
    });
  });
  return result;
}

export function filterPoints<D>(
  container: PointContainer<D>,
  callback: (x: number, y: number, data: D) => boolean
): PointContainer<D> {
  const result = {
    points: new Map<number, Map<number, D>>(),
    size: 0,
  };
  container.points.forEach((yMap, x) => {
    yMap.forEach((data, y) => {
      if (callback(x, y, data)) {
        setPoint(result, x, y, data);
      }
    });
  });
  return result;
}

export function firstPointWhere<D>(
  container: PointContainer<D>,
  callback: (x: number, y: number, data: D) => boolean
): [number, number, D] | undefined {
  for (let x of container.points) {
    for (let y of x[1]) {
      if (callback(x[0], y[0], y[1])) {
        return [x[0], y[0], y[1]];
      }
    }
  }
  return undefined;
}

export function setPoint<D>(
  container: PointContainer<D>,
  x: number,
  y: number,
  data: D
): void {
  if (!container.points.has(x)) {
    container.points.set(x, new Map());
  }
  const xMap = container.points.get(x)!;
  if (!xMap.has(y)) {
    container.size++;
  }
  xMap.set(y, data);
}

export function getPoint<D>(
  container: PointContainer<D>,
  x: number,
  y: number
): D | undefined {
  if (!container.points.has(x)) {
    return undefined;
  }
  return container.points.get(x)!.get(y);
}

export function hasPoint(
  container: PointContainer<any>,
  x: number,
  y: number
): boolean {
  if (!container.points.has(x)) {
    return false;
  }
  return container.points.get(x)!.has(y);
}

export function deletePoint(
  container: PointContainer<any>,
  x: number,
  y: number
): void {
  if (!container.points.has(x)) {
    return;
  }
  const xMap = container.points.get(x)!;
  if (xMap.has(y)) {
    xMap.delete(y);
    container.size--;
  }
}

export function forEachPoint<D>(
  container: PointContainer<D>,
  callback: (x: number, y: number, data: D) => void
): void {
  for (let x of container.points) {
    for (let y of x[1]) {
      callback(x[0], y[0], y[1]);
    }
  }
}
