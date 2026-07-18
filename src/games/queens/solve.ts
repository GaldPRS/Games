/**
 * Count solutions of a Queens puzzle, early-exit at `limit`.
 * Rules: one queen per row, column, and region; no two queens on adjacent
 * cells (kings-move adjacency — only consecutive rows can conflict).
 */
export function countQueensSolutions(
  size: number,
  regions: number[],
  limit = 2,
  out?: number[],
): number {
  let count = 0;
  const cols: number[] = []; // cols[row] = chosen column

  const dfs = (row: number, usedCols: number, usedRegions: number): void => {
    if (count >= limit) return;
    if (row === size) {
      count++;
      if (count === 1 && out) {
        out.length = 0;
        out.push(...cols);
      }
      return;
    }
    const prevCol = row > 0 ? cols[row - 1] : -99;
    for (let c = 0; c < size; c++) {
      if (usedCols & (1 << c)) continue;
      if (Math.abs(c - prevCol) <= 1) continue;
      const region = regions[row * size + c];
      if (usedRegions & (1 << region)) continue;
      cols.push(c);
      dfs(row + 1, usedCols | (1 << c), usedRegions | (1 << region));
      cols.pop();
      if (count >= limit) return;
    }
  };
  dfs(0, 0, 0);
  return count;
}
