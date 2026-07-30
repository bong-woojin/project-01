// row, col 모두 1부터 시작 — SeatBase.row / SeatBase.col과 동일 단위
export type Position = { row: number; col: number }

export type Direction = 'ArrowRight' | 'ArrowLeft' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End'

// grid[row-1][col-1] = true → 해당 위치에 좌석 있음 / false → 빈 자리
// 반환값: 이동할 좌석 위치, 이동 불가하면 null
export function getNextFocusPosition(
  current: Position,
  direction: Direction,
  grid: boolean[][]
): Position | null {
  const { row, col } = current
  const rowIdx = row - 1
  const colIdx = col - 1

  if (direction === 'ArrowRight') {
    if (grid[rowIdx]?.[colIdx + 1]) return { row, col: col + 1 }
    return null
  }

  if (direction === 'ArrowLeft') {
    if (colIdx - 1 >= 0 && grid[rowIdx]?.[colIdx - 1]) return { row, col: col - 1 }
    return null
  }

  if (direction === 'ArrowDown') {
    if (row >= grid.length) return null
    return nearestInRow(row + 1, col, grid[row])
  }

  if (direction === 'ArrowUp') {
    if (row <= 1) return null
    return nearestInRow(row - 1, col, grid[row - 2])
  }

  if (direction === 'Home') {
    const firstColIdx = grid[rowIdx].findIndex(Boolean)
    if (firstColIdx === -1) return null
    return { row, col: firstColIdx + 1 }
  }

  if (direction === 'End') {
    const rowArr = grid[rowIdx]
    for (let i = rowArr.length - 1; i >= 0; i--) {
      if (rowArr[i]) return { row, col: i + 1 }
    }
    return null
  }

  return null
}

// 대상 행에서 currentCol과 가장 가까운 좌석 반환
// 동거리면 낮은 열 번호 우선 (왼쪽 → 오른쪽 순서로 순회하므로 첫 번째 최소값 유지)
function nearestInRow(targetRow: number, currentCol: number, rowArr: boolean[]): Position | null {
  let best: Position | null = null
  let bestDist = Infinity

  for (let i = 0; i < rowArr.length; i++) {
    if (!rowArr[i]) continue
    const dist = Math.abs(i + 1 - currentCol)
    if (dist < bestDist) {
      best = { row: targetRow, col: i + 1 }
      bestDist = dist
    }
  }

  return best
}
