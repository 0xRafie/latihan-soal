create table if not exists public.quizzes (
  id text not null,
  group_code text not null,
  title text not null,
  description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  created_by text not null,
  created_at timestamptz not null,
  questions jsonb not null default '[]'::jsonb,
  primary key (group_code, id)
);

create index if not exists quizzes_group_code_created_at_idx
  on public.quizzes (group_code, created_at desc);

create or replace function public.merge_question_arrays(
  existing_questions jsonb,
  incoming_questions jsonb
)
returns jsonb
language sql
immutable
as $$
  with old_items as (
    select distinct on (id) id, question, ord
    from (
      select value->>'id' as id, value as question, ordinality::integer as ord
      from jsonb_array_elements(coalesce(existing_questions, '[]'::jsonb)) with ordinality
      where value ? 'id'
    ) items
    order by id, ord
  ),
  new_items as (
    select distinct on (id) id, question, ord
    from (
      select value->>'id' as id, value as question, ordinality::integer as ord
      from jsonb_array_elements(coalesce(incoming_questions, '[]'::jsonb)) with ordinality
      where value ? 'id'
    ) items
    order by id, ord desc
  ),
  item_ids as (
    select id from old_items
    union
    select id from new_items
  ),
  merged_items as (
    select
      coalesce(new_items.question, old_items.question) as question,
      coalesce(old_items.ord, (select count(*) from old_items) + new_items.ord) as ord
    from item_ids
    left join old_items using (id)
    left join new_items using (id)
  )
  select coalesce(jsonb_agg(question order by ord), '[]'::jsonb)
  from merged_items;
$$;

create or replace function public.upsert_quiz_merge_questions(
  p_id text,
  p_group_code text,
  p_title text,
  p_description text,
  p_duration_minutes integer,
  p_created_by text,
  p_created_at timestamptz,
  p_questions jsonb
)
returns void
language plpgsql
as $$
begin
  insert into public.quizzes (
    id,
    group_code,
    title,
    description,
    duration_minutes,
    created_by,
    created_at,
    questions
  )
  values (
    p_id,
    p_group_code,
    p_title,
    p_description,
    p_duration_minutes,
    p_created_by,
    p_created_at,
    coalesce(p_questions, '[]'::jsonb)
  )
  on conflict (group_code, id) do update set
    title = excluded.title,
    description = excluded.description,
    duration_minutes = excluded.duration_minutes,
    created_by = excluded.created_by,
    created_at = excluded.created_at,
    questions = public.merge_question_arrays(public.quizzes.questions, excluded.questions);
end;
$$;

grant execute on function public.merge_question_arrays(jsonb, jsonb) to anon, authenticated;
grant execute on function public.upsert_quiz_merge_questions(text, text, text, text, integer, text, timestamptz, jsonb) to anon, authenticated;

create or replace function public.delete_quiz_if_creator(
  p_id text,
  p_group_code text,
  p_username text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.quizzes
  where id = p_id
    and group_code = p_group_code
    and created_by = p_username;
end;
$$;

grant execute on function public.delete_quiz_if_creator(text, text, text) to anon, authenticated;

create table if not exists public.attempts (
  id text not null,
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
  flags jsonb not null default '{}'::jsonb,
  primary key (group_code, id)
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
drop policy if exists "Allow public attempt updates" on public.attempts;
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

create policy "Allow public attempt updates"
  on public.attempts for update
  using (true)
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
