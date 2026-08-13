import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/formatDate'

type Booking = {
  id: string
  booker_name: string
  booker_phone: string
  created_at: string
  seats: { label: string }
  concerts: { title: string; date: string; venue: string }
}

export default function BookingConfirmPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBooking() {
      const { data } = await supabase
        .from('bookings')
        .select('*, seats(label), concerts(title, date, venue)')
        .eq('id', bookingId)
        .single()

      if (data) setBooking(data as Booking)
      setIsLoading(false)
    }
    fetchBooking()
  }, [bookingId])

  if (isLoading) return <p>로딩 중...</p>
  if (!booking) return <p>예매 내역을 찾을 수 없습니다.</p>

  return (
    <div>
      <h1>예매 완료</h1>
      <p>공연: {booking.concerts.title}</p>
      <p>일시: {formatDate(booking.concerts.date)}</p>
      <p>장소: {booking.concerts.venue}</p>
      <p>좌석: {booking.seats.label}</p>
      <p>예매자: {booking.booker_name}</p>
      <p>연락처: {booking.booker_phone}</p>
      <p>예매번호: {booking.id}</p>
      <Link to="/">공연 목록으로</Link>
    </div>
  )
}
