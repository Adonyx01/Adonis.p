import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-cron-secret, content-type',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  })
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'GET' && req.method !== 'POST') return json({ ok: false, error: 'Method Not Allowed' }, 405)

  // CRON_SECRET check
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret')
    if (!provided || provided !== cronSecret) return json({ ok: false, error: 'Unauthorized' }, 401)
  }

  // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase — never undefined in production
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Adonis Project <onboarding@resend.dev>'

  if (!RESEND_API_KEY) return json({ ok: false, error: 'Missing RESEND_API_KEY secret' }, 500)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Fetch tasks due in the 55–65 minute window that haven't been reminded yet
  const windowStart = new Date(Date.now() + 55 * 60 * 1000).toISOString()
  const windowEnd   = new Date(Date.now() + 65 * 60 * 1000).toISOString()

  const { data: tasks, error: fetchError } = await supabase
    .from('tasks')
    .select('id, user_id, text, due_date')
    .is('reminder_sent_at', null)
    .eq('completed', false)
    .gte('due_date', windowStart)
    .lte('due_date', windowEnd)

  if (fetchError) {
    console.error('fetch error', fetchError)
    return json({ ok: false, error: fetchError.message }, 500)
  }

  const checked = tasks?.length ?? 0
  const candidates = checked

  if (!tasks?.length) return json({ ok: true, checked, candidates, sent: 0 })

  console.log(`${candidates} task(s) to remind`)

  const errors: Array<{ taskId: string; message: string }> = []
  let sent = 0

  const dtf = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' })

  for (const task of tasks) {
    const taskId = String(task.id)

    // Get user email via admin API
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(task.user_id)
    const email = userData?.user?.email

    if (userError || !email) {
      errors.push({ taskId, message: userError?.message ?? 'User has no email' })
      continue
    }

    const due = new Date(task.due_date)
    const htmlDue = escapeHtml(dtf.format(due))
    const titleEscaped = escapeHtml(String(task.text ?? ''))

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject: `⏰ Rappel : "${task.text?.slice(0, 60)}" dans 1h`,
        html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#1a1830;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <div style="padding:24px 28px 20px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <span style="font-size:15px;font-weight:600;color:#e8e9f0;">Todo App by Adonis</span>
    </div>
    <div style="padding:28px 28px 24px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#4e5060;text-transform:uppercase;letter-spacing:1px;">Rappel de tâche</p>
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#e8e9f0;line-height:1.3;">${titleEscaped}</h1>
      <div style="background:#16143a;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#8b8d9e;">Échéance</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#a78bfa;">${htmlDue}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#8b8d9e;line-height:1.5;">
        Cette tâche est due dans environ <strong style="color:#fbbf24;">1 heure</strong>. C'est le moment de t'y mettre !
      </p>
    </div>
  </div>
</body>
</html>`,
      }),
    })

    if (!resendRes.ok) {
      const body = await resendRes.text().catch(() => '')
      errors.push({ taskId, message: `Resend ${resendRes.status}: ${body.slice(0, 300)}` })
      continue
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', task.id)
      .eq('user_id', task.user_id)

    if (updateError) {
      errors.push({ taskId, message: `Update failed: ${updateError.message}` })
      continue
    }

    console.log(`Reminder sent: "${task.text}" → ${email}`)
    sent++
  }

  return json({ ok: true, checked, candidates, sent, ...(errors.length ? { errors } : {}) })
})
