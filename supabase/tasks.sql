-- Référence : structure que tu avais déjà (sans modifier si la table existe).
/*
create table tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  priority text,
  due_date timestamp,
  list_id text,
  user_id uuid references auth.users(id),
  completed boolean default false,
  created_at timestamp default now()
);
*/

-- ── À exécuter une fois sur ton projet : colonnes attendues par l’app React ──
-- (description + sous-tâches en JSON). Ignore les erreurs si les colonnes existent déjà.
alter table public.tasks add column if not exists description text not null default '';
alter table public.tasks add column if not exists subtasks jsonb not null default '[]'::jsonb;

create index if not exists tasks_user_id_created_at_idx
  on public.tasks (user_id, created_at desc);

-- ── Row Level Security (à faire si ce n’est pas déjà en place) ──
alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);
