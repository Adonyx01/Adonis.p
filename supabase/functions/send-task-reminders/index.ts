/**
 * Edge Function : rappels e-mail (fenêtre 30 min avant due_date).
 *
 * Secrets (Dashboard → Edge Functions → Secrets) :
 *   - RESEND_API_KEY, RESEND_FROM (optionnel, défaut ci-dessous)
 *   - SERVICE_ROLE_KEY : obligatoire sur le dashboard (JWT service_role).
 *     Fallback local : SUPABASE_SERVICE_ROLE_KEY (CLI / .env Deno).
 */

import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  })
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method Not Allowed' }, 405)
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret')
    if (!provided || provided !== cronSecret) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401)
    }
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey =
    Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Todo <onboarding@resend.dev>'

  const missing: string[] = []
  if (!SUPABASE_URL) missing.push('SUPABASE_URL')
  if (!serviceRoleKey) missing.push('SERVICE_ROLE_KEY')
  if (!RESEND_API_KEY) missing.push('RESEND_API_KEY')

  if (missing.length > 0) {
    return jsonResponse(
      { ok: false, error: 'Missing required environment variables', missing },
      500,
    )
  }

  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, user_id, text, due_date')
    .eq('completed', false)
    .is('reminder_sent_at', null)
    .not('due_date', 'is', null)

  if (tasksError) {
    return jsonResponse(
      { ok: false, error: 'Failed to load tasks', details: tasksError.message },
      500,
    )
  }

  const nowMs = Date.now()
  const windowMs = 30 * 60 * 1000

  const candidates = (tasks ?? []).filter((t) => {
    if (!t.due_date) return false
    const dueMs = new Date(t.due_date).getTime()
    if (Number.isNaN(dueMs)) return false
    return nowMs >= dueMs - windowMs && nowMs < dueMs
  })

  const checked = (tasks ?? []).length
  const errors: Array<{ taskId: string; userId?: string; message: string }> = []
  let sent = 0

  const dtf = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  for (const task of candidates) {
    const taskId = String(task.id)
    const userId = String(task.user_id)
    const taskText = String(task.text ?? '')
    const due = task.due_date ? new Date(task.due_date) : null

    if (!due || Number.isNaN(due.getTime())) {
      errors.push({ taskId, userId, message: 'Invalid due_date' })
      continue
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    const email = userData?.user?.email

    if (userError) {
      errors.push({ taskId, userId, message: userError.message })
      continue
    }

    if (!email) {
      errors.push({ taskId, userId, message: 'User has no email' })
      continue
    }

    const subject = `Rappel : ${taskText.slice(0, 60)}${taskText.length > 60 ? '…' : ''}`.trim()
    const titleEscaped = escapeHtml(taskText)
    const htmlDue = escapeHtml(dtf.format(due))
    const dueISO = escapeHtml(due.toISOString())

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
        <h2>Rappel de tâche</h2>
        <p><strong>Tâche :</strong> ${titleEscaped}</p>
        <p><strong>Échéance :</strong> ${htmlDue}</p>
        <hr />
        <p style="color:#666; font-size: 12px;">(Référence : ${dueISO})</p>
      </div>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject,
        html,
      }),
    })

    if (!resendRes.ok) {
      const errBody = await resendRes.text().catch(() => '')
      errors.push({
        taskId,
        userId,
        message: `Resend error ${resendRes.status}: ${errBody.slice(0, 500)}`,
      })
      continue
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', task.id)
      .eq('user_id', userId)

    if (updateError) {
      errors.push({
        taskId,
        userId,
        message: `Email envoyé mais mise à jour impossible : ${updateError.message}`,
      })
      continue
    }

    sent += 1
  }

  return jsonResponse({
    ok: true,
    checked,
    candidates: candidates.length,
    sent,
    ...(errors.length > 0 ? { errors } : {}),
  })
})
