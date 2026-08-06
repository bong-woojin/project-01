# 009. 좌석 선점 API 설계

## 결정 요약

| 항목 | 결정 |
|------|------|
| 사용자 식별 | localStorage UUID |
| 만료 기준 | 서버 (`now() + interval '5 minutes'`) |
| 선점 유지 시간 | 5분 (임시값 — E-3 이후 실측하여 확정) |
| 선점 요청 처리 | 비관적 — 서버 응답 후 UI 변경 |

## 사용자 식별 — localStorage UUID

로그인 없이 브라우저마다 UUID를 생성해 localStorage에 저장한다.
같은 브라우저의 여러 탭은 같은 UUID를 공유하므로 같은 사람으로 취급된다.
스푸핑 가능하지만 1차 포트폴리오 범위에서 현실적 위협이 아니다.

holder_id를 클라이언트가 정하므로 조작 가능하다. 익명 로그인으로 서버 발급 식별자를 쓰는 것이 정석이나 1차 범위에서 제외했다.

되돌리는 비용: Supabase Auth 익명 로그인으로 교체 시 userId 취득 방식만 바꾸면 됨. 선점 로직은 그대로.

## 만료 기준 — 서버

클라이언트 시계는 조작 가능하다. 만료 시각은 Postgres에서 `now() + interval '5 minutes'`로 계산한다.
클라이언트는 만료 시각을 표시하는 데만 쓴다.

선점 유지 시간 5분은 임시값이다. 좌석 선택부터 정보 입력 완료까지 실측한 뒤 E-3 이후 확정한다.

## 비관적 처리

서버 응답을 받은 뒤 UI를 바꾼다.
선점 성공 → `held-by-me`로 전환 / 실패 → 실패 이유 메시지 표시.
낙관적 처리(먼저 바꾸고 롤백)보다 구조가 단순하고 실패 케이스를 놓칠 가능성이 낮다.

## DB 스키마

### seats 테이블
공연별 좌석 목록. 배치 정보(row_num, col, label)를 저장한다.
`is_sold`는 결제 완료 후 서버에서만 true로 바꾼다 (클라이언트에서 쓰지 않음).

### seat_holds 테이블
현재 선점 기록. 좌석당 1행 (`seat_id UNIQUE`). 이력은 G단계 `bookings` 테이블이 담당한다.
만료된 행은 삭제하지 않고, 새 선점 시 upsert로 덮어쓴다.
`holder_id`는 클라이언트에 노출하지 않는다 — `get_seats_with_status` RPC가 `is_mine` 불리언으로 가공해서 반환한다.

### RLS 정책
`seat_holds`는 RLS 활성화 후 정책을 두지 않는다. 정책이 없으면 직접 접근이 전면 차단된다.
삽입/수정 정책을 추가하면 클라이언트가 RPC를 우회해 남의 선점을 덮어쓸 수 있으므로 두지 않는다.
`try_hold_seat`, `get_seats_with_status` 는 `security definer`이므로 RLS를 우회해 정상 동작한다.
두 함수 모두 `SET search_path = public` 추가 (Supabase 보안 권장사항).

### try_hold_seat RPC
원자적 선점 처리. `INSERT ... ON CONFLICT (seat_id) DO UPDATE` 방식으로 Postgres가 동시성을 처리한다.
ON CONFLICT의 WHERE 조건: `expires_at <= now()` (만료) OR `holder_id = 요청자` (갱신) 일 때만 UPDATE.
두 조건 모두 아니면 → 다른 사람이 유효하게 선점 중 → `held_by_other` 반환.

반환값:
- 성공: `{ success: true, expires_at: string }`
- 실패: `{ success: false, reason: 'sold' | 'held_by_other' | 'not_found' }`

## 이 결정이 틀렸다면 어떻게 알 수 있나

두 브라우저 창에서 동시에 같은 좌석을 클릭했을 때 한쪽만 성공하면 RPC가 정상 동작하는 것이다.
둘 다 성공하면 원자성이 깨진 것 — RPC를 재검토해야 한다.

## 되돌리는 비용

- localStorage UUID → Supabase Auth: userId 취득 방식 1곳만 교체
- 비관적 → 낙관적 처리: holdSeat 호출부에 로딩 상태 추가, 실패 시 롤백 로직 추가
- 5분 → 다른 시간: Postgres RPC의 interval 값 1줄 수정
