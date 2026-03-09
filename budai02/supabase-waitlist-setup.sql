-- GlowCheck waitlist table
-- Run this once in Supabase Dashboard → SQL Editor (https://supabase.com/dashboard → your project → SQL Editor)

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  brand text,
  source text,
  created_at timestamptz default now()
);

-- Allow anyone to insert (for public landing page signups)
alter table public.waitlist enable row level security;

drop policy if exists "Allow anonymous insert" on public.waitlist;
create policy "Allow anonymous insert"
  on public.waitlist for insert
  to anon
  with check (true);
