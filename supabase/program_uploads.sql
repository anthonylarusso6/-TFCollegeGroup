-- Drafts for the "Import Rich's slides" review screen. Run once in Supabase → SQL Editor.
-- Until this exists, the review screen keeps its draft in the browser (localStorage) instead.
create table if not exists public.program_uploads (
  id uuid primary key default gen_random_uuid(),
  phase text,
  status text not null default 'draft',
  parsed jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.program_uploads enable row level security;
drop policy if exists program_uploads_anon_rw on public.program_uploads;
create policy program_uploads_anon_rw on public.program_uploads for all to anon, authenticated using (true) with check (true);
