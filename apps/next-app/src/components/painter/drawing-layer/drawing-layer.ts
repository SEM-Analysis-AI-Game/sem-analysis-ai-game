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
  /**
   * all of the shader uniform data is stored in this class
   */
  private readonly uniforms: DrawingLayerUniforms;
  /**
   * the segment buffer stores the segment ID (1-indexed) for each
   * pixel as a flattened 2D array (row-major). A -1 indicates that no
   * segment has been drawn at that pixel.
   */
  private readonly segmentBuffer: Int32Array;

  /**
   * the segment map stores the color and points for each segment
   * the number of neighbors (adjacent pixels of the same segment)
   * each point has is stored in the point container. If a point
   * has < 4 neighbors, it is on the boundary of the segment.
   */
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
    this.segmentBuffer = new Int32Array(pixelSize.x * pixelSize.y).fill(-1);
    this.uniforms = new DrawingLayerUniforms(pixelSize);
  }

  /**
   * Increase the total number of segments by one.
   */
  public incrementSegments(): void {
    const randomColor = new THREE.Color(
      Math.random(),
      Math.random(),
      Math.random()
    );
    this.segmentMap.set(this.segmentMap.size + 1, {
      color: randomColor,
      points: new PointContainer(),
    });
  }

  /**
   * Gets the total number of segments.
   */
  public getNumSegments(): number {
    return this.segmentMap.size;
  }

  /**
   * Gets the segment index (1-based) for a given pixel.
   */
  public segment(x: number, y: number): number {
    return this.segmentBuffer[y * this.pixelSize.x + x];
  }

  /**
   * Gets the number of sections in the x and y axis.
   * This refers to the number of subdivisions the canvas has
   * been split into for rendering optimizations. Only the
   * renderer should be considered with this.
   */
  public numSections(): THREE.Vector2 {
    return this.uniforms.numSections;
  }

  /**
   * Gets the uniform for a given section. These are listened to
   * by the three.js ShaderMaterial in the renderer.
   */
  public uniform(j: number, i: number): THREE.Uniform<THREE.DataTexture> {
    return this.uniforms.uniform(j, i);
  }

  /**
   * Gets the size of a given section. This should not be confused with
   * segments, as segments are the 1-indexed segments that are drawn on
   * the canvas, and sections are the subdivisions of the canvas that
   * are used for rendering optimizations.
   */
  public sectionSize(j: number, i: number): THREE.Vector2 {
    return this.uniforms.sectionSize(j, i);
  }

  /**
   * Given an action, finds and applies splits in segments
   * that were effected by the action. The splits are
   * written to the action's paintedPoints so they can
   * be undone.
   */
  public recomputeSegments(action: CanvasAction): void {
    for (let segment of action.effectedSegments) {
      // these are all of the newly drawn boundary points
      // that were created by the action on the effected
      // segment
      const boundary = segment[1].newBoundaryPoints;

      // we will be removing points from the boundary container
      // and iterating until it is empty.
      while (boundary.size() > 0) {
        // find a random point in the boundary container
        let bfsStart = boundary.firstWhere(() => true)!;

        // get the total number of points remaining in the boundary
        // container
        let totalPoints = boundary.size();

        // traverse the contiguous boundary points breadth-first
        // starting at the random point until we cannot traverse any further.
        const visited = breadthFirstTraversal(
          new THREE.Vector2(bfsStart[0], bfsStart[1]),
          (pos) => boundary.hasPoint(pos.x, pos.y),
          // for this breadth-first traversal we can walk diagonally because
          // border pixels diagonal to eachother are still considered
          // contiguous
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

        // if we didn't visit all of the points in the boundary
        // container, that implies that there were more than one
        // new contiguous boundaries drawn on the effected segment.
        if (visited.size() < totalPoints) {
          // we will create a new segment and flood fill the effected
          // segment breadth-first starting from our initial random
          // point.
          this.incrementSegments();
          const newSegment = this.getNumSegments();
          const fillVisited = breadthFirstTraversal(
            new THREE.Vector2(bfsStart[0], bfsStart[1]),
            (pos, exitLoop) => {
              if (this.segment(pos.x, pos.y) === segment[0]) {
                // if we encounter any boundary points, we will remove
                // them from the boundary container. This prevents further
                // calculation against any disconnected boundary points
                // that also form a boundary for the new segment we are drawing.
                boundary.deletePoint(pos.x, pos.y);

                // if we have removed all of the boundary points, we can exit
                // early.
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

          // if we exited the loop early then we have finished splitting the
          // segment and thus we can continue to the next effected segment.
          if (boundary.size() > 0) {
            fillVisited.forEach((x, y) => {
              // for each point we flood filled, we will update the
              // action history for undo/redo if we have not already
              // painted it previously during this action
              if (!action.paintedPoints.hasPoint(x, y)) {
                action.paintedPoints.setPoint(x, y, {
                  newSegment: newSegment,
                  oldSegment: segment[0],
                });
              }

              // update the flood-filled pixels in the drawing layer
              this.setSegment(x, y, newSegment);
            });
          }
        } else {
          visited.forEach((x, y) => {
            boundary.deletePoint(x, y);
          });
        }
      }
    }
  }

  /**
   * Updates a pixel value from one segment to another, then computes updates to
   * any segment boundaries. If a boundary point is created, it is added to the
   * action's effectedSegments so it can be used to determine if a segment needs
   * to be split. If no action is provided, the segment boundaries are still computed
   * but not recorded.
   *
   * This method will also update the shader uniforms to reflect changes.
   *
   * the segment is a 1-based index
   */
  public setSegment(
    x: number,
    y: number,
    segment: number,
    action?: CanvasAction
  ) {
    // the segment we are overwriting
    const oldSegment = this.segment(x, y);

    // early return if we are not actually changing the segment
    if (oldSegment == segment) {
      return;
    }

    // update the segment buffer (this is a flattened 2D array row-major)
    this.segmentBuffer[y * this.pixelSize.x + x] = segment;

    // get adjacent points (clamped by resolution)
    const adjacent = [
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

    // if we are overwriting a segment, we need to update the
    // old segments boundary points. Updates done here need to be
    // reported to the action argument if it is provided through the
    // effectedSegments map.
    if (oldSegment !== -1 && segment !== oldSegment) {
      const oldSegmentEntry = this.segmentMap.get(oldSegment)!;
      const point = oldSegmentEntry.points.getPoint(x, y)!;
      // if this point used to be a boundary point, we need to remove it
      // from the effectedSegments map in case we previously added it.
      // the effectedSegments map is meant to represent just the new
      // boundary points created at the end of this action.
      if (point.numNeighbors < 4 && action) {
        let newBoundaryMap = action.effectedSegments.get(oldSegment);
        // create the newBoundaryMap for this segment if it wasn't already
        // created
        if (!newBoundaryMap) {
          newBoundaryMap = { newBoundaryPoints: new PointContainer() };
          action.effectedSegments.set(oldSegment, newBoundaryMap);
        } else {
          newBoundaryMap.newBoundaryPoints.deletePoint(x, y);
        }
      }

      // remove the point from the old segment's point container
      oldSegmentEntry.points.deletePoint(x, y);

      // each neighboring point (adjacent point of the old segment) is now
      // a boundary point, so we need to update the shader uniforms to highlight
      // them and also update the point container to reflect that they now have
      // 1 less neighbor (thus making them boundary points)
      for (let neighbor of adjacent.filter(
        (neighbor) => this.segment(neighbor.x, neighbor.y) === oldSegment
      )) {
        const neighborEntry = oldSegmentEntry.points.getPoint(
          neighbor.x,
          neighbor.y
        )!;
        if (neighborEntry.numNeighbors === 4) {
          // this pixel used to not be a boundary pixel, but now it is.
          // update the shader uniforms to reflect this.
          this.uniforms.fillPixel(
            neighbor.x,
            neighbor.y,
            kDrawAlpha + kBorderAlphaBoost,
            oldSegmentEntry.color
          );
          // if there as an action argument passed in, we need to update the
          // effectedSegments map to reflect that this pixel is now a boundary
          // pixel.
          if (action) {
            let newBoundaryMap = action.effectedSegments.get(oldSegment);
            // create the newBoundaryMap for this segment if it wasn't already
            // created
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
        // update the point container to reflect that this pixel now has 1 less
        // neighbor.
        oldSegmentEntry.points.setPoint(neighbor.x, neighbor.y, {
          numNeighbors: neighborEntry ? neighborEntry.numNeighbors - 1 : 0,
        });
      }
    }

    if (segment === -1 && oldSegment !== -1) {
      // we are erasing a segment, so we need to update the shader uniforms
      this.uniforms.fillPixel(x, y, 0, new THREE.Color());
    } else if (segment !== -1) {
      const color = this.segmentColor(segment);
      const segmentEntry = this.segmentMap.get(segment)!;

      // get all of the adjacent pixels that are in the same segment
      const inSegmentNeighbors = adjacent.filter(
        (neighbor) => this.segment(neighbor.x, neighbor.y) === segment
      );

      // update this pixel's point container entry to reflect that it has
      // the number of neighbors found above.
      segmentEntry.points.setPoint(x, y, {
        numNeighbors: inSegmentNeighbors.length,
      });

      // update the shader uniforms to reflect that this pixel is now
      // part of the segment (applying a boost if it is a boundary pixel)
      this.uniforms.fillPixel(
        x,
        y,
        kDrawAlpha + (inSegmentNeighbors.length < 4 ? kBorderAlphaBoost : 0.0),
        color
      );

      // update each neighbor
      for (let neighbor of inSegmentNeighbors) {
        const newNumNeighbors =
          segmentEntry.points.getPoint(neighbor.x, neighbor.y)!.numNeighbors +
          1;
        segmentEntry.points.setPoint(neighbor.x, neighbor.y, {
          numNeighbors: newNumNeighbors,
        });
        // if this point used to be a boundary point, and it now has 4 neighbors,
        // we should update the shader uniforms to reflect that it is no longer
        // a boundary point.
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

  private segmentColor(segment: number): THREE.Color {
    return this.segmentMap.get(segment)!.color;
  }
}
