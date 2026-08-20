/**
 * 경합 통합 테스트 — 실제 Supabase DB에 접근
 *
 * 실행 전 조건:
 *   1. concerts 테이블에 is_test = true 공연이 1개 있어야 함
 *   2. 그 공연에 좌석(seats)이 1개 이상 있어야 함
 *
 * 실행 방법:
 *   npx vitest run src/lib/holdSeat.integration.test.ts
 */
import { describe, it, expect, afterAll } from 'vitest'
import { supabase } from './supabase'
import { holdSeat } from './holdSeat'

async function getTestSeatId(): Promise<string> {
  const { data: concerts } = await supabase
    .from('concerts')
    .select('id')
    .eq('is_test', true)
    .limit(1)
    .single()

  if (!concerts) throw new Error('is_test = true 공연이 없습니다. SQL로 먼저 만들어주세요.')

  const { data: seat } = await supabase
    .from('seats')
    .select('id')
    .eq('concert_id', concerts.id)
    .limit(1)
    .single()

  if (!seat) throw new Error('테스트 공연에 좌석이 없습니다.')

  return seat.id
}

async function cleanupHold(seatId: string) {
  await supabase.rpc('release_hold', {
    p_seat_id: seatId,
    p_holder_id: 'test-user-A',
  })
  await supabase.rpc('release_hold', {
    p_seat_id: seatId,
    p_holder_id: 'test-user-B',
  })
}

let testSeatId: string

describe('holdSeat 경합 테스트', () => {
  it('같은 좌석에 동시 선점 요청 시 하나만 성공한다', async () => {
    testSeatId = await getTestSeatId()

    await cleanupHold(testSeatId)

    const [resultA, resultB] = await Promise.all([
      holdSeat(testSeatId, 'test-user-A'),
      holdSeat(testSeatId, 'test-user-B'),
    ])

    const successes = [resultA, resultB].filter(r => r.success)
    const failures = [resultA, resultB].filter(r => !r.success)

    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)
    expect(failures[0]).toMatchObject({ success: false, reason: 'held_by_other' })
  })

  afterAll(async () => {
    if (testSeatId) await cleanupHold(testSeatId)
  })
})
