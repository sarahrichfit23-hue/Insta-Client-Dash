-- ─────────────────────────────────────────────────────────────
-- ICE PIPELINE™ — Supabase Schema
-- Run this entire file in: Supabase → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- PROFILES (extends Supabase auth.users)
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text,
  full_name    text,
  cohort       text,
  is_admin     boolean default false,
  created_at   timestamptz default now()
);

-- PROSPECTS
create table public.prospects (
  id           bigserial primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  handle       text not null,
  source       text,
  notes        text,
  email        text,
  channel      int not null default 3,
  intent       text,
  added_date   date default current_date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- TOUCHES (one row per touch logged on a prospect)
create table public.touches (
  id           bigserial primary key,
  prospect_id  bigint references public.prospects(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  touch_type   text not null,
  note         text,
  touch_date   date default current_date,
  created_at   timestamptz default now()
);

-- DAILY METRICS
create table public.daily_metrics (
  id           bigserial primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  metric_date  date default current_date,
  dms          int default 0,
  replies      int default 0,
  emails       int default 0,
  offers       int default 0,
  sales        int default 0,
  unique(user_id, metric_date)
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.prospects      enable row level security;
alter table public.touches        enable row level security;
alter table public.daily_metrics  enable row level security;

-- PROFILES: users see their own, admins see all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- PROSPECTS: users own their data, admins can read all
create policy "Users manage own prospects"
  on public.prospects for all
  using (auth.uid() = user_id);

create policy "Admins can read all prospects"
  on public.prospects for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- TOUCHES: users own their data, admins can read all
create policy "Users manage own touches"
  on public.touches for all
  using (auth.uid() = user_id);

create policy "Admins can read all touches"
  on public.touches for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- DAILY METRICS: users own their data, admins can read all
create policy "Users manage own metrics"
  on public.daily_metrics for all
  using (auth.uid() = user_id);

create policy "Admins can read all metrics"
  on public.daily_metrics for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prospects_updated_at
  before update on public.prospects
  for each row execute procedure public.set_updated_at();
