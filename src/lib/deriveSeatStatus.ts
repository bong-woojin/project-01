import type { SeatStatusPart } from "../types/seat";

type RawHoldData = {
  holderId: string | null; // 선점한 사람의 식별자. 없으면 null
  expiresAt: string | null; // 만료 시각 (ISO 8601). 없으면 null
  isSold: boolean; // 판매 완료 여부
};

export function deriveSeatStatus(
  raw: RawHoldData,
  myId: string,
  now: Date,
): SeatStatusPart {
  // 1. 판매 완료 여부를 가장 먼저 확인 — holderId가 있어도 sold가 우선
  if (raw.isSold) {
    return { status: "sold" };
  }

  // 2. 아무도 선점하지 않은 상태
  if (raw.holderId === null) {
    return { status: "available" };
  }

  // 3. holderId는 있는데 expiresAt이 없으면 — 비정상 데이터, 안전하게 잠금 처리
  if (raw.expiresAt === null) {
    if (import.meta.env.DEV) {
      console.warn(
        "[deriveSeatStatus] holderId가 있는데 expiresAt이 없습니다.",
      );
    }
    return { status: "held-by-other" };
  }

  // 4. 선점 시각이 현재와 같거나 과거면 만료된 것으로 처리 (expiresAt <= now)
  if (new Date(raw.expiresAt) <= now) {
    return { status: "available" };
  }

  // 5. 유효한 선점 — 내가 잡은 좌석인지 확인
  if (raw.holderId === myId) {
    return { status: "held-by-me", expiresAt: raw.expiresAt };
  }

  // 6. 유효한 선점이지만 남의 좌석
  return { status: "held-by-other" };
}
