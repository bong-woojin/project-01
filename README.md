# 소극장 예매 서비스

## 무슨 문제를 해결하는가

<!-- 직접 작성: 소극장 운영자가 겪는 문제 (구글폼+엑셀, 중복 배정 등) -->

## 왜 기존 도구로 안 되는가

<!-- 직접 작성: 구글폼/네이버폼의 한계 -->

## 핵심 판단

| 판단 | 결정 | 문서 |
|------|------|------|
| 좌석 상태 모델링 | Discriminated Union — 불가능한 상태를 타입으로 차단 | [007](docs/decisions/007-seat-type-modeling.md) |
| 동시 선점 처리 | Postgres `UNIQUE + ON CONFLICT` — DB가 원자적으로 처리 | [009](docs/decisions/009-seat-hold-api.md) |
| 좌석 배치 렌더링 | DOM + CSS Grid — Canvas 대신, 접근성 기본 제공 | [008](docs/decisions/008-seat-rendering.md) |
| 키보드 내비게이션 | Roving tabindex — 200석을 탭 한 번에 진입 | [008](docs/decisions/008-seat-rendering.md) |

전체 결정 기록: [docs/decisions/](docs/decisions/)

## 데모

<!-- 배포 URL 추가 -->

<!-- 스크린샷 또는 GIF -->

## 안 한 것과 이유

| 항목 | 이유 |
|------|------|
| 결제 연동 | 현장 결제 가정. 2차에서 재검토. |
| 실시간 구독 | 5초 폴링으로 대체. 2차에서 Supabase Realtime으로 전환 예정. |
| SMS 인증 | 소극장 규모에 과함. `/bookings/:id` URL이 예매 확인서 역할. |
| 주최자 어드민 | 1차 범위 밖. |
| E2E 테스트 | 2차로 미룸. 경합은 통합 테스트로 증명. |

## 로컬 세팅 순서

빈 Supabase 프로젝트에서 아래 순서대로 실행하면 재현됩니다.

**1단계 — concerts 테이블 생성** (Supabase Table Editor에서 직접 생성)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK, gen_random_uuid() |
| title | text | not null |
| date | timestamptz | not null |
| venue | text | not null |
| description | text | nullable |
| is_test | bool | not null, default false |

RLS 활성화 후 anon SELECT 정책 추가.

**2단계 — concerts 행 추가** (Table Editor에서 직접 입력)

공연 2개 이상 추가. is_test = false.

**3단계 — 스키마 실행** (SQL 에디터)

`supabase-schema.sql` 전체 복붙 후 실행.

**4단계 — 시드 실행** (SQL 에디터)

`supabase-seed.sql` 전체 복붙 후 실행.

**5단계 — 환경변수**

`.env.local` 생성:

```
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**6단계 — 실행**

```
npm install
npm run dev
```

## AI를 어떻게 썼는가

<!-- 직접 작성 -->
