-- ※ concerts 테이블이 먼저 존재해야 합니다.

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
-- seat_holds: 정책 없음. RPC(security definer)를 통해서만 접근 가능.

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

-- 7. bookings 테이블
create table bookings (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid references concerts(id),
  seat_id uuid references seats(id),
  holder_id text not null,
  booker_name text not null,
  booker_phone text not null,
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;
-- bookings: 직접 읽기 정책 없음. get_booking RPC(security definer)를 통해서만 읽을 수 있다.

-- 8. confirm_booking RPC
create or replace function confirm_booking(p_seat_id uuid, p_holder_id text, p_booker_name text, p_booker_phone text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_seat record;
  v_hold_id uuid;
  v_booking_id uuid;
begin
  select * into v_seat from seats where id = p_seat_id;
  if not found then return json_build_object('success', false, 'reason', 'not_found'); end if;
  if v_seat.is_sold then return json_build_object('success', false, 'reason', 'already_sold'); end if;

  select id into v_hold_id from seat_holds
  where seat_id = p_seat_id and holder_id = p_holder_id and expires_at > now() limit 1;
  if not found then return json_build_object('success', false, 'reason', 'hold_expired'); end if;

  insert into bookings (concert_id, seat_id, holder_id, booker_name, booker_phone)
  values (v_seat.concert_id, p_seat_id, p_holder_id, p_booker_name, p_booker_phone)
  returning id into v_booking_id;

  update seats set is_sold = true where id = p_seat_id;

  return json_build_object('success', true, 'booking_id', v_booking_id);
end;
$$;

-- 9. release_hold RPC
create or replace function release_hold(p_seat_id uuid, p_holder_id text)
returns void
language sql security definer set search_path = public
as $$
  delete from seat_holds
  where seat_id = p_seat_id and holder_id = p_holder_id;
$$;

-- 10. get_booking RPC
create or replace function get_booking(p_booking_id uuid)
returns table(
  id uuid,
  booker_name text,
  booker_phone text,
  created_at timestamptz,
  seat_label text,
  concert_title text,
  concert_date timestamptz,
  concert_venue text
)
language sql security definer set search_path = public
as $$
  select
    b.id,
    b.booker_name,
    b.booker_phone,
    b.created_at,
    s.label as seat_label,
    c.title as concert_title,
    c.date as concert_date,
    c.venue as concert_venue
  from bookings b
  join seats s on s.id = b.seat_id
  join concerts c on c.id = b.concert_id
  where b.id = p_booking_id;
$$;
