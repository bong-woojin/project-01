import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Concert } from '../types/concert'

export default function ConcertListPage() {
  // useState: 컴포넌트가 기억할 값을 만듦
  // concerts는 현재 값, setConcerts는 그 값을 바꾸는 함수
  // 초기값은 빈 배열 — 데이터를 아직 못 가져왔으니까
  const [concerts, setConcerts] = useState<Concert[]>([])

  // isLoading: 데이터를 가져오는 중인지 여부
  const [isLoading, setIsLoading] = useState(true)

  // useEffect: 컴포넌트가 화면에 처음 나타날 때 실행
  // 두 번째 인자 []는 "딱 한 번만 실행"을 의미
  useEffect(() => {
    async function fetchConcerts() {
      const { data } = await supabase
        .from('concerts')
        .select('*')
        .eq('is_test', false)  // is_test가 false인 것만 가져옴

      if (data) {
        setConcerts(data)  // 가져온 데이터를 state에 저장 → 화면이 다시 그려짐
      }
      setIsLoading(false)
    }

    fetchConcerts()
  }, [])

  if (isLoading) {
    return <p>로딩 중...</p>
  }

  return (
    <ul>
      {/* concerts 배열을 순회하며 각 공연을 <li>로 렌더링 */}
      {concerts.map((concert) => (
        <li key={concert.id}>
          <Link to={`/concerts/${concert.id}`}>
            {concert.title} — {concert.date}
          </Link>
        </li>
      ))}
    </ul>
  )
}
