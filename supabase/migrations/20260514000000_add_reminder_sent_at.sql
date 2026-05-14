-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Ajouter la colonne reminder_sent_at à la table tasks
--    Colle ce SQL dans Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz DEFAULT NULL;

-- Index pour accélérer la requête de l'Edge Function
CREATE INDEX IF NOT EXISTS idx_tasks_reminder
  ON tasks (due_date, reminder_sent_at)
  WHERE reminder_sent_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Activer les extensions nécessaires
--    (pg_cron et pg_net sont disponibles sur tous les plans Supabase)
--    Supabase Dashboard → Database → Extensions → cherche "pg_cron" et "pg_net"
--    Active-les depuis l'UI, OU exécute :
-- ─────────────────────────────────────────────────────────────────────────────

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Planifier l'appel de l'Edge Function toutes les 5 minutes
--    Remplace <PROJECT_REF> par l'identifiant de ton projet Supabase
--    Remplace <SERVICE_ROLE_KEY> par ta clé service role (Settings → API)
--    ATTENTION : ne commit jamais ce fichier avec la clé en clair !
-- ─────────────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'send-task-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
               ),
    body    := '{}'::jsonb
  );
  $$
);

-- Pour vérifier que le job est bien créé :
-- SELECT * FROM cron.job;

-- Pour supprimer le job si besoin :
-- SELECT cron.unschedule('send-task-reminders');
