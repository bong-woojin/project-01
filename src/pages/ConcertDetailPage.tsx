import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/formatDate'
import type { Concert } from '../types/concert'
import styles from './ConcertDetailPage.module.css'

export default function ConcertDetailPage() {
  const { id } = useParams()
  const [concert, setConcert] = useState<Concert | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchConcert() {
      const { data } = await supabase
        .from('concerts')
        .select('*')
        .eq('id', id)
        .single()

      if (data) setConcert(data)
      setIsLoading(false)
    }
    fetchConcert()
  }, [id])

  if (isLoading) return <p>로딩 중...</p>
  if (!concert) return <p>공연을 찾을 수 없습니다</p>

  return (
    <>
      <Link to="/" className={styles.back}>← 목록으로</Link>
      <h1 className={styles.title}>{concert.title}</h1>
      <div className={styles.meta}>
        <span>{formatDate(concert.date)}</span>
        <span>{concert.venue}</span>
      </div>
      {concert.description && (
        <p className={styles.description}>{concert.description}</p>
      )}
      <Link to={`/concerts/${id}/seats`} className={styles.cta}>좌석 선택</Link>
    </>
  )
}
