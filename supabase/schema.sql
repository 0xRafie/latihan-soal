create table if not exists public.quizzes (
  id text primary key,
  group_code text not null,
  title text not null,
  description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  created_by text not null,
  created_at timestamptz not null,
  questions jsonb not null default '[]'::jsonb
);

create index if not exists quizzes_group_code_created_at_idx
  on public.quizzes (group_code, created_at desc);

create table if not exists public.attempts (
  id text primary key,
  group_code text not null,
  quiz_id text not null,
  quiz_title text not null,
  username text not null,
  score integer not null,
  correct_count integer not null,
  total_questions integer not null,
  duration_spent_seconds integer not null,
  completed_at timestamptz not null,
  answers jsonb not null default '{}'::jsonb,
  flags jsonb not null default '{}'::jsonb
);

create index if not exists attempts_group_code_completed_at_idx
  on public.attempts (group_code, completed_at desc);

alter table public.quizzes enable row level security;
alter table public.attempts enable row level security;

drop policy if exists "Allow public quiz reads" on public.quizzes;
drop policy if exists "Allow public quiz writes" on public.quizzes;
drop policy if exists "Allow public quiz updates" on public.quizzes;
drop policy if exists "Allow public attempt reads" on public.attempts;
drop policy if exists "Allow public attempt writes" on public.attempts;
drop policy if exists "Allow public attempt deletes" on public.attempts;

create policy "Allow public quiz reads"
  on public.quizzes for select
  using (true);

create policy "Allow public quiz writes"
  on public.quizzes for insert
  with check (true);

create policy "Allow public quiz updates"
  on public.quizzes for update
  using (true)
  with check (true);

create policy "Allow public attempt reads"
  on public.attempts for select
  using (true);

create policy "Allow public attempt writes"
  on public.attempts for insert
  with check (true);

create policy "Allow public attempt deletes"
  on public.attempts for delete
  using (true);

do $$
begin
  alter publication supabase_realtime add table public.quizzes;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.attempts;
exception
  when duplicate_object then null;
end $$;
