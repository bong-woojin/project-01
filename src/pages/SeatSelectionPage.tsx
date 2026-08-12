import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/userId'
import { holdSeat } from '../lib/holdSeat'
import { deriveSeatStatus } from '../lib/deriveSeatStatus'
import type { Seat } from '../types/seat'
import SeatGrid from '../components/SeatGrid'

type RawSeatRow = {
  id: string
  concert_id: string
  row_num: number
  col: number
  label: string
  is_sold: boolean
  is_held: boolean
  is_mine: boolean
  expires_at: string | null
}

const userId = getUserId()
const POLL_INTERVAL = 5000

function rawToSeats(data: RawSeatRow[]): Seat[] {
  const now = new Date()
  return data.map(row => ({
    id: row.id,
    row_num: row.row_num,
    col: row.col,
    label: row.label,
    ...deriveSeatStatus({
      isHeld: row.is_held,
      isMine: row.is_mine,
      expiresAt: row.expires_at,
      isSold: row.is_sold,
    }, now),
  }))
}

export default function SeatSelectionPage() {
  const { id } = useParams<{ id: string }>()
  const [seats, setSeats] = useState<Seat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchSeats() {
    const { data, error } = await supabase.rpc('get_seats_with_status', {
      p_concert_id: id,
      p_holder_id: userId,
    })
    if (error) {
      console.error(error)
      setError(error.message)
      setIsLoading(false)
      return
    }
    setSeats(rawToSeats(data as RawSeatRow[]))
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSeats()

    timerRef.current = setInterval(fetchSeats, POLL_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [id])

  async function handleSeatSelect(seat: Seat) {
    if (seat.status !== 'available') return

    try {
      const result = await holdSeat(seat.id, userId)

      if (result.success) {
        setSeats(prev => prev.map(s =>
          s.id === seat.id
            ? { ...s, status: 'held-by-me' as const, expiresAt: result.expiresAt }
            : s
        ))
        setMessage(`${seat.label} 선점 완료. 5분 안에 예매를 완료해 주세요.`)
      } else {
        setMessage(
          result.reason === 'sold'
            ? '판매 완료된 좌석입니다.'
            : '방금 다른 분이 선점했습니다.'
        )
      }
    } catch {
      setMessage('오류가 발생했습니다. 다시 시도해 주세요.')
    }
  }

  if (isLoading) return <p>로딩 중...</p>
  if (error) return <p>오류: {error}</p>

  return (
    <div>
      <h1>좌석 선택</h1>
      {message && <p role="alert">{message}</p>}
      <SeatGrid seats={seats} onSeatSelect={handleSeatSelect} />
    </div>
  )
}
