import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUserId } from '../lib/userId'
import { holdSeat } from '../lib/holdSeat'
import { confirmBooking } from '../lib/confirmBooking'
import { deriveSeatStatus } from '../lib/deriveSeatStatus'
import { useCountdown, formatCountdown } from '../lib/useCountdown'
import type { Seat } from '../types/seat'
import SeatGrid from '../components/SeatGrid'
import styles from './SeatSelectionPage.module.css'

type BookingFormProps = {
  seat: Seat & { status: 'held-by-me'; expiresAt: string }
  onSubmit: (name: string, phone: string) => Promise<void>
  isSubmitting: boolean
  onExpired: () => void
}

function BookingForm({ seat, onSubmit, isSubmitting, onExpired }: BookingFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const remaining = useCountdown(seat.expiresAt)
  const expired = remaining <= 0

  useEffect(() => {
    if (expired) onExpired()
  }, [expired, onExpired])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(name, phone)
  }

  return (
    <div className={styles.formPanel}>
      <h2 className={styles.formTitle}>예매자 정보</h2>
      <p className={styles.selectedSeat}>선택 좌석: {seat.label}</p>
      <p className={styles.countdown}>
        남은 시간:{' '}
        <strong style={{ color: remaining <= 60 ? '#dc2626' : '#1a1a1a' }}>
          {formatCountdown(remaining)}
        </strong>
      </p>
      {expired ? (
        <p className={styles.expiredMsg} role="alert">선점이 만료되었습니다. 좌석을 다시 선택해 주세요.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="booker-name">이름</label>
            <input id="booker-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="booker-phone">연락처</label>
            <input id="booker-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? '예매 중...' : '예매 완료'}
          </button>
        </form>
      )}
    </div>
  )
}

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
  const navigate = useNavigate()
  const [seats, setSeats] = useState<Seat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSeats = useCallback(async () => {
    const t0 = performance.now()
    const { data, error } = await supabase.rpc('get_seats_with_status', {
      p_concert_id: id,
      p_holder_id: userId,
    })
    if (import.meta.env.DEV) {
      console.info(`[perf] get_seats_with_status: ${(performance.now() - t0).toFixed(1)}ms (${data?.length ?? 0}석)`)
    }
    if (error) {
      console.error(error)
      setError(error.message)
      setIsLoading(false)
      return
    }
    const processed = rawToSeats(data as RawSeatRow[])
    setSeats(processed)
    setSelectedSeatId(prev => {
      if (prev) return prev
      const held = processed.find(s => s.status === 'held-by-me')
      return held?.id ?? null
    })
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    fetchSeats()
    timerRef.current = setInterval(fetchSeats, POLL_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchSeats])

  async function handleSeatSelect(seat: Seat) {
    if (seat.status !== 'available') return

    if (selectedSeatId && selectedSeatId !== seat.id) {
      await supabase.rpc('release_hold', {
        p_seat_id: selectedSeatId,
        p_holder_id: userId,
      })
    }

    try {
      const result = await holdSeat(seat.id, userId)
      if (result.success) {
        setSeats(prev => prev.map(s =>
          s.id === seat.id
            ? { ...s, status: 'held-by-me' as const, expiresAt: result.expiresAt }
            : s.id === selectedSeatId
            ? { ...s, status: 'available' as const }
            : s
        ))
        setSelectedSeatId(seat.id)
        setMessage(null)
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

  const selectedSeat = seats.find(s => s.id === selectedSeatId)
  const heldSeat = selectedSeat?.status === 'held-by-me' ? selectedSeat : null

  async function handleBookingFormSubmit(name: string, phone: string) {
    if (!selectedSeatId) return
    setIsSubmitting(true)
    try {
      const result = await confirmBooking(selectedSeatId, userId, name, phone)
      if (result.success) {
        navigate(`/bookings/${result.bookingId}`)
      } else {
        setMessage(
          result.reason === 'hold_expired'
            ? '선점이 만료되었습니다. 좌석을 다시 선택해 주세요.'
            : '예매할 수 없는 좌석입니다.'
        )
        setSelectedSeatId(null)
      }
    } catch (err) {
      console.error('confirm_booking error:', err)
      setMessage('오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p>로딩 중...</p>
  if (error) return <p>오류: {error}</p>
  if (seats.length === 0) return <p>등록된 좌석이 없습니다.</p>

  return (
    <div>
      <h1 className={styles.heading}>좌석 선택</h1>
      {message && <p className={styles.alert} role="alert">{message}</p>}
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#e8f4fd', border: '1px solid #4a90d9' }} />예매 가능</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#d4edda', border: '1px solid #28a745' }} />내가 선점</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f8d7da', border: '1px solid #dc3545' }} />선점 중</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#6c757d' }} />판매 완료</span>
      </div>
      <SeatGrid seats={seats} onSeatSelect={handleSeatSelect} />
      {heldSeat && (
        <BookingForm
          seat={heldSeat}
          onSubmit={handleBookingFormSubmit}
          isSubmitting={isSubmitting}
          onExpired={fetchSeats}
        />
      )}
    </div>
  )
}
