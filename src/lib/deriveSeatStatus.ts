import type { SeatStatusPart } from "../types/seat";

// get_seats_with_status RPC가 반환하는 형태 — holder_id는 서버에서 비교하고 결과만 내려줌
type RawHoldData = {
  isHeld: boolean;      // 활성 선점이 있는지 여부
  isMine: boolean;      // 내 선점인지 여부 (서버가 holder_id와 비교해서 계산)
  expiresAt: string | null; // 만료 시각 (ISO 8601). 선점 없으면 null
  isSold: boolean;      // 판매 완료 여부
};

export function deriveSeatStatus(raw: RawHoldData, now: Date): SeatStatusPart {
  // 1. 판매 완료 여부를 가장 먼저 확인 — isHeld가 true여도 sold가 우선
  if (raw.isSold) {
    return { status: "sold" };
  }

  // 2. 아무도 선점하지 않은 상태
  if (!raw.isHeld) {
    return { status: "available" };
  }

  // 3. 선점은 있는데 expiresAt이 없으면 — 비정상 데이터, 안전하게 잠금 처리
  if (raw.expiresAt === null) {
    if (import.meta.env.DEV) {
      console.warn(
        "[deriveSeatStatus] isHeld인데 expiresAt이 없습니다.",
      );
    }
    return { status: "held-by-other" };
  }

  // 4. 선점 시각이 현재와 같거나 과거면 만료된 것으로 처리 (expiresAt <= now)
  if (new Date(raw.expiresAt) <= now) {
    return { status: "available" };
  }

  // 5. 유효한 선점 — 내 좌석인지 확인 (서버가 이미 비교한 결과)
  if (raw.isMine) {
    return { status: "held-by-me", expiresAt: raw.expiresAt };
  }

  // 6. 유효한 선점이지만 남의 좌석
  return { status: "held-by-other" };
}
