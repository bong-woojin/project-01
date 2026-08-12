import { supabase } from './supabase'

export type ConfirmResult =
  | { success: true; bookingId: string }
  | { success: false; reason: 'hold_expired' | 'already_sold' | 'not_found' }

export async function confirmBooking(
  seatId: string,
  holderId: string,
  bookerName: string,
  bookerPhone: string
): Promise<ConfirmResult> {
  const { data, error } = await supabase.rpc('confirm_booking', {
    p_seat_id: seatId,
    p_holder_id: holderId,
    p_booker_name: bookerName,
    p_booker_phone: bookerPhone,
  })
  if (error) throw error
  const result = data as { success: boolean; booking_id?: string; reason?: string }
  if (result.success) return { success: true, bookingId: result.booking_id! }
  return { success: false, reason: result.reason as ConfirmResult['reason'] }
}
