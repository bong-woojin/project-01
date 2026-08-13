import { useEffect, useState } from 'react'

// expiresAt: ISO 8601 문자열. null이면 카운트다운 안 함.
// 반환: 남은 초. 0이면 만료.
export function useCountdown(expiresAt: string | null): number {
  const [remaining, setRemaining] = useState(() => calcRemaining(expiresAt))

  useEffect(() => {
    if (!expiresAt) { setRemaining(0); return }

    setRemaining(calcRemaining(expiresAt))
    const timer = setInterval(() => {
      const r = calcRemaining(expiresAt)
      setRemaining(r)
      if (r <= 0) clearInterval(timer)
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt])

  return remaining
}

function calcRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
