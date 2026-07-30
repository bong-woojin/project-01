import type { Seat } from '../types/seat'
import styles from './SeatButton.module.css'

const STATUS_LABEL: Record<string, string> = {
  available: '예매 가능',
  'held-by-me': '내가 선점 중',
  'held-by-other': '선점 중',
  sold: '판매 완료',
}

type Props = {
  seat: Seat
  tabIndex: 0 | -1
  onSelect: (seat: Seat) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, seat: Seat) => void
}

export default function SeatButton({ seat, tabIndex, onSelect, onKeyDown }: Props) {
  const isUnavailable = seat.status === 'sold' || seat.status === 'held-by-other'

  return (
    <button
      className={styles.seat}
      data-state={seat.status}
      data-row={seat.row}
      data-col={seat.col}
      aria-label={`${seat.label}, ${STATUS_LABEL[seat.status]}`}
      aria-disabled={isUnavailable ? true : undefined}
      tabIndex={tabIndex}
      style={{ gridRow: seat.row, gridColumn: seat.col }}
      onClick={() => { if (!isUnavailable) onSelect(seat) }}
      onKeyDown={(e) => onKeyDown(e, seat)}
    >
      {seat.label}
    </button>
  )
}
