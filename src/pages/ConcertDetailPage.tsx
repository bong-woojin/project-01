import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Concert } from '../types/concert'

export default function ConcertDetailPage() {
  // useParams: 현재 URL에서 동적 세그먼트 값을 읽음
  // /concerts/abc123 으로 접속하면 id = "abc123"
  const { id } = useParams()

  const [concert, setConcert] = useState<Concert | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchConcert() {
      const { data } = await supabase
        .from('concerts')
        .select('*')
        .eq('id', id)   // id가 URL의 id와 일치하는 행 하나만 가져옴
        .single()       // 배열이 아닌 객체 하나로 받음

      if (data) {
        setConcert(data)
      }
      setIsLoading(false)
    }

    fetchConcert()
  }, [id]) // id가 바뀌면 다시 가져옴

  if (isLoading) return <p>로딩 중...</p>
  if (!concert) return <p>공연을 찾을 수 없습니다</p>

  return (
    <div>
      <h1>{concert.title}</h1>
      <p>{concert.date}</p>
      <p>{concert.venue}</p>
      <p>{concert.description}</p>
    </div>
  )
}
