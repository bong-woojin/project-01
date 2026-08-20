import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/formatDate'
import styles from './BookingConfirmPage.module.css'

type Booking = {
  id: string
  booker_name: string
  booker_phone: string
  created_at: string
  seat_label: string
  concert_title: string
  concert_date: string
  concert_venue: string
}

export default function BookingConfirmPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBooking() {
      const { data, error } = await supabase.rpc('get_booking', {
        p_booking_id: bookingId,
      })
      if (!error && data && data.length > 0) setBooking(data[0] as Booking)
      setIsLoading(false)
    }
    fetchBooking()
  }, [bookingId])

  if (isLoading) return <p>로딩 중...</p>
  if (!booking) return <p>예매 내역을 찾을 수 없습니다.</p>

  return (
    <>
      <span className={styles.badge}>예매 완료</span>
      <h1 className={styles.title}>{booking.concert_title}</h1>
      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>일시</span>
          <span className={styles.value}>{formatDate(booking.concert_date)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>장소</span>
          <span className={styles.value}>{booking.concert_venue}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>좌석</span>
          <span className={styles.value}>{booking.seat_label}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>예매자</span>
          <span className={styles.value}>{booking.booker_name}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>연락처</span>
          <span className={styles.value}>{booking.booker_phone}</span>
        </div>
        <div>
          <p className={styles.label} style={{ marginBottom: 4 }}>예매번호</p>
          <p className={styles.bookingId}>{booking.id}</p>
        </div>
      </div>
      <Link to="/" className={styles.home}>공연 목록으로</Link>
    </>
  )
}
