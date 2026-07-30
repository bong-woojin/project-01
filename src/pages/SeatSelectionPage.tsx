import { useParams } from 'react-router-dom'
import type { Seat } from '../types/seat'
import SeatGrid from '../components/SeatGrid'

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E']

function makeTestSeats(): Seat[] {
  const seats: Seat[] = []
  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 10; col++) {
      const base = { id: `${row}-${col}`, row, col, label: `${ROW_LABELS[row - 1]}-${col}` }
      if (row === 2 && col === 4) {
        seats.push({ ...base, status: 'sold' })
      } else if (row === 3 && col === 6) {
        seats.push({ ...base, status: 'held-by-other' })
      } else if (row === 1 && col === 3) {
        seats.push({ ...base, status: 'held-by-me', expiresAt: new Date(Date.now() + 600000).toISOString() })
      } else {
        seats.push({ ...base, status: 'available' })
      }
    }
  }
  return seats
}

const TEST_SEATS = makeTestSeats()

export default function SeatSelectionPage() {
  const { id } = useParams()

  function handleSeatSelect(seat: Seat) {
    console.log('선택:', seat.label)
  }

  return (
    <div>
      <h1>좌석 선택</h1>
      <p>공연 ID: {id}</p>
      <SeatGrid seats={TEST_SEATS} onSeatSelect={handleSeatSelect} />
    </div>
  )
}
