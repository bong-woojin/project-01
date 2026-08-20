-- 기존 시드 데이터 초기화 (테스트 공연 제외)
delete from seat_holds;
delete from seats where concert_id in (
  select id from concerts where is_test = false
);

-- =============================================
-- 배치 유형 1: 일렬형 (10행 × 20열 = 200석)
-- 공연: concerts 테이블 첫 번째 비테스트 공연
-- =============================================
insert into seats (concert_id, row_num, col, label)
select
  c.id,
  r.row_num,
  col.col,
  chr(64 + r.row_num) || '-' || col.col::text
from (select id from concerts where is_test = false order by date limit 1) c
cross join generate_series(1, 10) as r(row_num)
cross join generate_series(1, 20) as col(col);

-- =============================================
-- 배치 유형 2: 구역 분리형 (통로 포함, 200석)
-- 좌구역: col 1-10 / 통로: col 11-12 없음 / 우구역: col 13-22
-- 10행 × (10 + 10) = 200석
-- 공연: concerts 테이블 두 번째 비테스트 공연
-- =============================================
insert into seats (concert_id, row_num, col, label)
select
  c.id,
  r.row_num,
  col.col,
  chr(64 + r.row_num) || '-' || col.col::text
from (select id from concerts where is_test = false order by date limit 1 offset 1) c
cross join generate_series(1, 10) as r(row_num)
cross join (
  select generate_series(1, 10) as col
  union all
  select generate_series(13, 22)
) as col;

-- =============================================
-- 통합 테스트용 공연 + 좌석 (is_test = true)
-- 없으면 생성, 있으면 건너뜀
-- =============================================
do $$
declare
  v_concert_id uuid;
  v_seat_id uuid;
begin
  select id into v_concert_id from concerts where is_test = true limit 1;

  if not found then
    insert into concerts (title, date, venue, description, is_test)
    values ('테스트 공연 (경합 테스트용)', now(), '테스트 장소', null, true)
    returning id into v_concert_id;
  end if;

  -- 테스트 좌석 1개만 있으면 됨
  select id into v_seat_id from seats where concert_id = v_concert_id limit 1;
  if not found then
    insert into seats (concert_id, row_num, col, label)
    values (v_concert_id, 1, 1, 'A-1');
  end if;
end;
$$;
