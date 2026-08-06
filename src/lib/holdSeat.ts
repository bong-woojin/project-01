import { supabase } from './supabase'

export type HoldResult =
  | { success: true; expiresAt: string }
  | { success: false; reason: 'held_by_other' | 'sold' | 'not_found' }

export async function holdSeat(seatId: string, holderId: string): Promise<HoldResult> {
  const { data, error } = await supabase.rpc('try_hold_seat', {
    p_seat_id: seatId,
    p_holder_id: holderId,
  })
  if (error) throw error
  return data as HoldResult
}
