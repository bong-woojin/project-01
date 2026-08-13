import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/formatDate'
import type { Concert } from '../types/concert'
import styles from './ConcertListPage.module.css'

export default function ConcertListPage() {
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchConcerts() {
      const { data } = await supabase
        .from('concerts')
        .select('*')
        .eq('is_test', false)

      if (data) setConcerts(data)
      setIsLoading(false)
    }
    fetchConcerts()
  }, [])

  if (isLoading) return <p>로딩 중...</p>

  return (
    <>
      <h1 className={styles.heading}>공연 목록</h1>
      <ul className={styles.list}>
        {concerts.map((concert) => (
          <li key={concert.id} className={styles.item}>
            <Link to={`/concerts/${concert.id}`} className={styles.link}>
              <p className={styles.title}>{concert.title}</p>
              <p className={styles.date}>{formatDate(concert.date)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
