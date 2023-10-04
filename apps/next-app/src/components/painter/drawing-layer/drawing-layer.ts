import * as THREE from "three";
import { CanvasAction } from "../action-history";
import { PointContainer } from "../point-container";
import { breadthFirstTraversal } from "./bft";
import { DrawingLayerUniforms } from "./uniforms";
import { kDrawAlpha } from "../tools";

// The alpha is boosted by this amount when a pixel is on the border of a segment.
const kBorderAlphaBoost = 0.5;

/**
 * The drawing layer is responsible for updating shader uniforms and
 * tracking drawn segments. Segments are given 1-based indexes.
 */
export class DrawingLayer {
  public readonly pixelSize: THREE.Vector2;

  // all of the shader uniform data is stored in this class
  private readonly uniforms: DrawingLayerUniforms;

  // the number of segments that have been drawn
  private numSegments: number;

  // the segment buffer stores the segment ID (1-indexed) for each
  // pixel as a flattened 2D array (row-major). A -1 indicates that no
  // segment has been drawn at that pixel.
  private readonly segmentBuffer: Int32Array;

  // the segment map stores the color and points for each segment
  // the number of neighbors (adjacent pixels of the same segment)
  // each point has is stored in the point container. If a point
  // has < 4 neighbors, it is on the boundary of the segment.
  private segmentMap: Map<
    number,
    {
      color: THREE.Color;
      points: PointContainer<{ numNeighbors: number }>;
    }
  >;

  constructor(pixelSize: THREE.Vector2) {
    this.pixelSize = pixelSize;
    this.segmentMap = new Map();
    this.numSegments = 0;
    this.segmentBuffer = new Int32Array(pixelSize.x * pixelSize.y).fill(-1);
    this.uniforms = new DrawingLayerUniforms(pixelSize);
  }

  /**
   * Increase the total number of segments by one.
   */
  public incrementSegments(): void {
    this.numSegments++;
    const randomColor = new THREE.Color(
      Math.random(),
      Math.random(),
      Math.random()
    );
    this.segmentMap.set(this.numSegments, {
      color: randomColor,
      points: new PointContainer(),
    });
  }

  public getNumSegments(): number {
    return this.numSegments;
  }

  public segment(x: number, y: number): number {
    return this.segmentBuffer[y * this.pixelSize.x + x];
  }

  public numSections(): THREE.Vector2 {
    return this.uniforms.numSections;
  }

  public uniform(j: number, i: number): THREE.Uniform<THREE.DataTexture> {
    return this.uniforms.uniform(j, i);
  }

  public sectionSize(j: number, i: number): THREE.Vector2 {
    return this.uniforms.sectionSize(j, i);
  }

  public recomputeSegments(action: CanvasAction): void {
    for (let segment of action.effectedSegments) {
      let boundary = segment[1].newBoundaryPoints;
      while (boundary.size() > 0) {
        let bfsStart = boundary.firstWhere(() => true)!;
        let totalPoints = boundary.size();
        const visited = breadthFirstTraversal(
          new THREE.Vector2(bfsStart[0], bfsStart[1]),
          (pos) => boundary.hasPoint(pos.x, pos.y),
          [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]
        );
        if (visited.size() < totalPoints) {
          this.incrementSegments();
          const newSegment = this.numSegments;
          let fillStart = boundary.firstWhere(() => true)!;
          const fillVisited = breadthFirstTraversal(
            new THREE.Vector2(fillStart[0], fillStart[1]),
            (pos, exitLoop) => {
              if (this.segment(pos.x, pos.y) === segment[0]) {
                boundary.deletePoint(pos.x, pos.y);
                if (boundary.size() === 0) {
                  exitLoop();
                }
                return true;
              }
              return false;
            },
            [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ]
          );
          if (boundary.size() > 0) {
            fillVisited.forEach((x, y) => {
              if (!action.paintedPoints.hasPoint(x, y)) {
                action.paintedPoints.setPoint(x, y, {
                  newSegment: newSegment,
                  oldSegment: segment[0],
                });
              }
              this.setSegment(x, y, newSegment);
            });
          }
        }
        visited.forEach((x, y) => {
          boundary.deletePoint(x, y);
        });
      }
    }
  }

  public setSegment(
    x: number,
    y: number,
    segment: number,
    action?: CanvasAction
  ) {
    const oldSegment = this.segment(x, y);
    this.segmentBuffer[y * this.pixelSize.x + x] = segment;
    const color = this.segmentColor(segment);

    const neighbors = [
      new THREE.Vector2(x - 1, y),
      new THREE.Vector2(x + 1, y),
      new THREE.Vector2(x, y - 1),
      new THREE.Vector2(x, y + 1),
    ].filter(
      (neighbor) =>
        neighbor.x >= 0 &&
        neighbor.y >= 0 &&
        neighbor.x < this.pixelSize.x &&
        neighbor.y < this.pixelSize.y
    );

    if (oldSegment !== -1 && segment !== oldSegment) {
      const oldSegmentEntry = this.segmentMap.get(oldSegment)!;
      const point = oldSegmentEntry.points.getPoint(x, y);
      if (point) {
        if (point.numNeighbors < 4 && action) {
          let newBoundaryMap = action.effectedSegments.get(oldSegment);
          if (!newBoundaryMap) {
            newBoundaryMap = { newBoundaryPoints: new PointContainer() };
            action.effectedSegments.set(oldSegment, newBoundaryMap);
          }
          newBoundaryMap.newBoundaryPoints.deletePoint(x, y);
        }
        oldSegmentEntry.points.deletePoint(x, y);
      }
      for (let neighbor of neighbors.filter(
        (neighbor) => this.segment(neighbor.x, neighbor.y) === oldSegment
      )) {
        const neighborEntry = oldSegmentEntry.points.getPoint(
          neighbor.x,
          neighbor.y
        );
        if (neighborEntry) {
          if (neighborEntry.numNeighbors === 4) {
            this.uniforms.fillPixel(
              neighbor.x,
              neighbor.y,
              kDrawAlpha + kBorderAlphaBoost,
              oldSegmentEntry.color
            );
            if (action) {
              let newBoundaryMap = action.effectedSegments.get(oldSegment);
              if (!newBoundaryMap) {
                newBoundaryMap = { newBoundaryPoints: new PointContainer() };
                action.effectedSegments.set(oldSegment, newBoundaryMap);
              }
              newBoundaryMap.newBoundaryPoints.setPoint(
                neighbor.x,
                neighbor.y,
                null
              );
            }
          }
        }
        oldSegmentEntry.points.setPoint(neighbor.x, neighbor.y, {
          numNeighbors: neighborEntry ? neighborEntry.numNeighbors - 1 : 0,
        });
      }
    }

    if (segment === -1 && oldSegment !== -1) {
      this.uniforms.fillPixel(x, y, 0, color);
    } else if (segment !== -1) {
      const segmentEntry = this.segmentMap.get(segment)!;
      if (!segmentEntry.points.hasPoint(x, y)) {
        const inSegmentNeighbors = neighbors.filter(
          (neighbor) => this.segment(neighbor.x, neighbor.y) === segment
        );
        segmentEntry.points.setPoint(x, y, {
          numNeighbors: inSegmentNeighbors.length,
        });
        this.uniforms.fillPixel(
          x,
          y,
          kDrawAlpha +
            (inSegmentNeighbors.length < 4 ? kBorderAlphaBoost : 0.0),
          color
        );
        for (let neighbor of inSegmentNeighbors) {
          const newNumNeighbors =
            segmentEntry.points.getPoint(neighbor.x, neighbor.y)!.numNeighbors +
            1;
          segmentEntry.points.setPoint(neighbor.x, neighbor.y, {
            numNeighbors: newNumNeighbors,
          });
          if (newNumNeighbors === 4) {
            this.uniforms.fillPixel(
              neighbor.x,
              neighbor.y,
              kDrawAlpha,
              segmentEntry.color
            );
          }
        }
      }
    }
  }

  private segmentColor(segment: number): THREE.Color {
    return this.segmentMap.get(segment)!.color;
  }
}
