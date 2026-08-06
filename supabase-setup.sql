-- 1. seats 테이블
create table seats (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid references concerts(id) on delete cascade,
  row_num int not null,
  col int not null,
  label text not null,
  is_sold boolean not null default false
);

-- 2. seat_holds 테이블
create table seat_holds (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null unique references seats(id) on delete cascade,
  holder_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 3. 인덱스
create index on seats(concert_id);
create index on seat_holds(seat_id);
create index on seat_holds(expires_at);

-- 4. RLS
alter table seats enable row level security;
alter table seat_holds enable row level security;
create policy "seats 읽기" on seats for select using (true);

-- 5. 좌석 상태 조회 RPC
create or replace function get_seats_with_status(p_concert_id uuid, p_holder_id text)
returns table(id uuid, concert_id uuid, row_num int, col int, label text, is_sold boolean, is_held boolean, is_mine boolean, expires_at timestamptz)
language sql security definer set search_path = public
as $$
  select
    s.id, s.concert_id, s.row_num, s.col, s.label, s.is_sold,
    (h.id is not null) as is_held,
    coalesce(h.holder_id = p_holder_id, false) as is_mine,
    h.expires_at
  from seats s
  left join seat_holds h on h.seat_id = s.id and h.expires_at > now()
  where s.concert_id = p_concert_id;
$$;

-- 6. 선점 RPC
create or replace function try_hold_seat(p_seat_id uuid, p_holder_id text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_is_sold boolean;
  v_expires_at timestamptz := now() + interval '5 minutes';
begin
  select is_sold into v_is_sold from seats where id = p_seat_id;
  if not found then
    return json_build_object('success', false, 'reason', 'not_found');
  end if;
  if v_is_sold then
    return json_build_object('success', false, 'reason', 'sold');
  end if;
  insert into seat_holds (seat_id, holder_id, expires_at)
  values (p_seat_id, p_holder_id, v_expires_at)
  on conflict (seat_id) do update
    set holder_id = excluded.holder_id, expires_at = excluded.expires_at
    where seat_holds.expires_at <= now() or seat_holds.holder_id = excluded.holder_id;
  if not found then
    return json_build_object('success', false, 'reason', 'held_by_other');
  end if;
  return json_build_object('success', true, 'expires_at', v_expires_at);
end;
$$;

-- 7. 시드 데이터
insert into seats (concert_id, row_num, col, label)
select
  c.id,
  r.row_num,
  col.col,
  chr(64 + r.row_num) || '-' || col.col::text
from concerts c
cross join generate_series(1, 5) as r(row_num)
cross join generate_series(1, 10) as col(col)
where c.is_test = false;
