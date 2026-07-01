create extension if not exists pgcrypto;

create table if not exists public.online_profiles (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  provider text not null check (provider in ('guest', 'google')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.online_teams (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null unique references public.online_profiles(id) on delete cascade,
  team_name text not null,
  flag_pixels jsonb not null default '[]'::jsonb,
  draft jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.online_profiles enable row level security;
alter table public.online_teams enable row level security;

grant usage on schema public to service_role;
grant all on public.online_profiles to service_role;
grant all on public.online_teams to service_role;
