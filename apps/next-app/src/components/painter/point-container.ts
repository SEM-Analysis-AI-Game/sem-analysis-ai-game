export class PointContainer<D = null> {
  private readonly points: Map<number, Map<number, D>>;
  private currentSize: number;

  constructor() {
    this.points = new Map();
    this.currentSize = 0;
  }

  public size(): number {
    return this.currentSize;
  }

  public map<T>(
    callback: (x: number, y: number, data: D) => T
  ): PointContainer<T> {
    const result = new PointContainer<T>();
    this.points.forEach((yMap, x) => {
      yMap.forEach((data, y) => {
        result.setPoint(x, y, callback(x, y, data));
      });
    });
    return result;
  }

  public filter(
    callback: (x: number, y: number, data: D) => boolean
  ): PointContainer<D> {
    const result = new PointContainer<D>();
    this.points.forEach((yMap, x) => {
      yMap.forEach((data, y) => {
        if (callback(x, y, data)) {
          result.setPoint(x, y, data);
        }
      });
    });
    return result;
  }

  public setPoint(x: number, y: number, data: D): void {
    if (!this.points.has(x)) {
      this.points.set(x, new Map());
    }
    const xMap = this.points.get(x);
    if (!xMap) {
      throw new Error("xMap is undefined");
    }
    if (!xMap.has(y)) {
      this.currentSize++;
    }
    xMap.set(y, data);
  }

  public getPoint(x: number, y: number): D | undefined {
    if (!this.points.has(x)) {
      return undefined;
    }
    return this.points.get(x)!.get(y);
  }

  public hasPoint(x: number, y: number): boolean {
    if (!this.points.has(x)) {
      return false;
    }
    return this.points.get(x)!.has(y);
  }

  public deletePoint(x: number, y: number): void {
    if (!this.points.has(x)) {
      return;
    }
    const xMap = this.points.get(x);
    if (!xMap) {
      throw new Error("xMap is undefined");
    }
    if (xMap.has(y)) {
      xMap.delete(y);
      this.currentSize--;
    }
  }

  public forEach(callback: (x: number, y: number, data: D) => void): void {
    this.points.forEach((yMap, x) => {
      yMap.forEach((data, y) => {
        callback(x, y, data);
      });
    });
  }
}
