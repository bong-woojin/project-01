import { describe, it, expect } from 'vitest'
import { getNextFocusPosition } from './getNextFocusPosition'

// 3×3 정방형 격자 (모든 자리 있음)
// grid[row-1][col-1] = true
const grid3x3: boolean[][] = [
  [true, true, true], // 1행: col 1, 2, 3
  [true, true, true], // 2행: col 1, 2, 3
  [true, true, true], // 3행: col 1, 2, 3
]

// 불규칙 격자: 2행에 col 2가 없음
// 1행: col 1, 2, 3
// 2행: col 1,    3  (2열 빠짐)
const gridIrregular: boolean[][] = [
  [true, true,  true],  // 1행: col 1, 2, 3
  [true, false, true],  // 2행: col 1, _, 3
]

describe('getNextFocusPosition', () => {
  it('ArrowRight: 오른쪽 좌석으로 이동', () => {
    const result = getNextFocusPosition({ row: 1, col: 1 }, 'ArrowRight', grid3x3)
    expect(result).toEqual({ row: 1, col: 2 })
  })

  it('ArrowRight: 행 끝에서 멈춤 (null 반환)', () => {
    const result = getNextFocusPosition({ row: 1, col: 3 }, 'ArrowRight', grid3x3)
    expect(result).toBeNull()
  })

  it('ArrowDown: 아래 좌석으로 이동', () => {
    const result = getNextFocusPosition({ row: 1, col: 1 }, 'ArrowDown', grid3x3)
    expect(result).toEqual({ row: 2, col: 1 })
  })

  it('ArrowDown: 마지막 행에서 멈춤 (null 반환)', () => {
    const result = getNextFocusPosition({ row: 3, col: 1 }, 'ArrowDown', grid3x3)
    expect(result).toBeNull()
  })

  it('Home: 현재 행의 첫 번째 좌석으로 이동', () => {
    const result = getNextFocusPosition({ row: 1, col: 3 }, 'Home', grid3x3)
    expect(result).toEqual({ row: 1, col: 1 })
  })

  it('End: 현재 행의 마지막 좌석으로 이동', () => {
    const result = getNextFocusPosition({ row: 1, col: 1 }, 'End', grid3x3)
    expect(result).toEqual({ row: 1, col: 3 })
  })

  it('불규칙 격자 ArrowDown: 동거리 두 좌석 중 낮은 열 번호로 이동 (타이브레이커)', () => {
    // (1,2)에서 ArrowDown → 2행에 col 2 없음
    // col 1 (거리 1), col 3 (거리 1) — 낮은 열 번호 우선
    const result = getNextFocusPosition({ row: 1, col: 2 }, 'ArrowDown', gridIrregular)
    expect(result).toEqual({ row: 2, col: 1 })
  })

  it('ArrowUp: 위 좌석으로 이동', () => {
    const result = getNextFocusPosition({ row: 2, col: 1 }, 'ArrowUp', grid3x3)
    expect(result).toEqual({ row: 1, col: 1 })
  })

  it('ArrowUp: 첫 번째 행에서 멈춤 (null 반환)', () => {
    const result = getNextFocusPosition({ row: 1, col: 1 }, 'ArrowUp', grid3x3)
    expect(result).toBeNull()
  })
})
