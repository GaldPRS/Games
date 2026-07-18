export interface ZipWall {
  a: number; // cell index, a < b, orthogonal neighbors
  b: number;
}

export interface ZipPuzzle {
  size: number; // 6 or 7
  /** waypoints[i] = cell index carrying the number i+1 */
  waypoints: number[];
  walls: ZipWall[];
  /** full solution path of cell indices, length size*size */
  solution: number[];
}

export interface ZipState {
  /** current drawn path (prefix); path[0] is always waypoint 1 once started */
  path: number[];
}
