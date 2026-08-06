// 상태와 무관하게 모든 좌석이 가지는 공통 필드
export type SeatBase = {
  id: string
  row_num: number  // 행 번호 (1부터 시작) — DB column명과 동일
  col: number      // 열 번호 (1부터 시작)
  label: string    // 화면에 표시할 좌석 이름 (예: "A-1")
}

// 상태별로 가질 수 있는 필드가 다름 — status로 narrowing
export type SeatStatusPart =
  | { status: 'available' }
  | { status: 'held-by-me'; expiresAt: string }  // 내가 선점 중, 만료 시각 포함
  | { status: 'held-by-other' }                  // 남의 선점 — 만료 시각 노출 안 함
  | { status: 'sold' }

// 최종 Seat 타입: 공통 필드 + 상태 필드
export type Seat = SeatBase & SeatStatusPart

// status 값만 필요할 때 쓰는 편의 타입
export type SeatStatus = SeatStatusPart['status']
// 'available' | 'held-by-me' | 'held-by-other' | 'sold'
