import { useRef, useState } from 'react'
import type { Seat } from '../types/seat'
import { getNextFocusPosition } from '../lib/getNextFocusPosition'
import type { Position, Direction } from '../lib/getNextFocusPosition'
import SeatButton from './SeatButton'
import styles from './SeatGrid.module.css'

type Props = {
  seats: Seat[]
  onSeatSelect: (seat: Seat) => void
}

const DIRECTIONS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End']

export default function SeatGrid({ seats, onSeatSelect }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)

  const seatMap = new Map(seats.map(s => [`${s.row_num},${s.col}`, s]))

  const maxRow = Math.max(...seats.map(s => s.row_num))
  const maxCol = Math.max(...seats.map(s => s.col))

  // grid[row_num-1][col-1] = true → 해당 위치에 좌석 있음
  const grid: boolean[][] = Array.from({ length: maxRow }, (_, r) =>
    Array.from({ length: maxCol }, (_, c) => seatMap.has(`${r + 1},${c + 1}`))
  )

  // 초기 포커스: 가장 앞 행, 가장 앞 열
  const firstSeat = seats.reduce((a, b) =>
    a.row_num < b.row_num || (a.row_num === b.row_num && a.col < b.col) ? a : b
  )
  const [focusedPos, setFocusedPos] = useState<Position>({ row: firstSeat.row_num, col: firstSeat.col })

  function moveFocus(next: Position) {
    setFocusedPos(next)
    const btn = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-row="${next.row}"][data-col="${next.col}"]`
    )
    btn?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, seat: Seat) {
    if (e.key === ' ') { e.preventDefault(); return }
    if (!DIRECTIONS.includes(e.key)) return

    e.preventDefault()
    const next = getNextFocusPosition(
      { row: seat.row_num, col: seat.col },
      e.key as Direction,
      grid
    )
    if (next) moveFocus(next)
  }

  return (
    <div
      ref={gridRef}
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${maxCol}, 40px)` }}
      aria-label="좌석 배치도"
    >
      {seats.map(seat => (
        <SeatButton
          key={seat.id}
          seat={seat}
          tabIndex={seat.row_num === focusedPos.row && seat.col === focusedPos.col ? 0 : -1}
          onSelect={onSeatSelect}
          onKeyDown={handleKeyDown}
        />
      ))}
    </div>
  )
}
