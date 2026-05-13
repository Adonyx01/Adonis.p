-- Exécute ce script une fois (Supabase → SQL).
-- Colonne pour n’envoyer qu’un seul rappel par tâche.

alter table public.tasks add column if not exists reminder_sent_at timestamptz;

comment on column public.tasks.reminder_sent_at is
  'Rempli quand le mail de rappel (~30 min avant échéance) a été envoyé.';

-- Index utile pour le job de rappels
create index if not exists tasks_reminder_due_idx
  on public.tasks (due_date)
  where reminder_sent_at is null and completed = false;

-- Planification du job (au choix) :
--  • Supabase : Edge Functions → fonction `send-task-reminders` → onglet Schedules / cron intégré si dispo sur ton plan
--  • Ou cron externe (GitHub Actions, cron-job.org, etc.) : POST sur l’URL de la fonction toutes les 5–10 min
--    avec le header `x-cron-secret` si tu as défini CRON_SECRET.
