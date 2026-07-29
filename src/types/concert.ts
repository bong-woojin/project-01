// DB의 concerts 테이블 구조와 1:1 대응
export type Concert = {
  id: string
  title: string
  date: string        // ISO 8601 형태로 서버에서 옴
  venue: string
  description: string | null
  is_test: boolean
}
