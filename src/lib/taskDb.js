import { supabase } from './supabase'

/** Nom de la table dans ton projet Supabase */
export const TASKS_TABLE = 'tasks'

function dueDateFromRow(due) {
  if (due == null || due === '') return ''
  if (typeof due === 'string') return due.slice(0, 10)
  try {
    return new Date(due).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function rowToTask(row) {
  return {
    id: row.id,
    text: row.text ?? '',
    description: row.description ?? '',
    completed: Boolean(row.completed),
    priority: row.priority ?? 'normal',
    listId: row.list_id ?? 'personal',
    dueDate: dueDateFromRow(row.due_date),
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
  }
}

/** Envoie null si vide ; conserve l’heure pour un champ `timestamp` si présent. */
function normalizeDueDate(dueDate) {
  if (dueDate == null || dueDate === '') return null
  const s = String(dueDate).trim()
  if (s.includes('T')) return s
  const d = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null
}

export function buildInsertRow(userId, partial) {
  return {
    user_id: userId,
    text: partial.text?.trim() ?? '',
    description: partial.description ?? '',
    completed: partial.completed ?? false,
    priority: partial.priority ?? 'normal',
    list_id: partial.listId ?? 'personal',
    due_date: normalizeDueDate(partial.dueDate),
    subtasks: partial.subtasks ?? [],
  }
}

export function buildUpdatePatch(changes) {
  const patch = {}
  if ('text' in changes) patch.text = changes.text
  if ('description' in changes) patch.description = changes.description
  if ('completed' in changes) patch.completed = changes.completed
  if ('priority' in changes) patch.priority = changes.priority
  if ('listId' in changes) patch.list_id = changes.listId
  if ('dueDate' in changes) patch.due_date = normalizeDueDate(changes.dueDate)
  if ('subtasks' in changes) patch.subtasks = changes.subtasks
  return patch
}

export async function fetchTasks(userId) {
  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(rowToTask)
}

export async function insertTask(userId, partial) {
  const row = buildInsertRow(userId, partial)
  const { data, error } = await supabase.from(TASKS_TABLE).insert(row).select('*').single()
  if (error) throw error
  return rowToTask(data)
}

export async function updateTaskRow(taskId, userId, changes) {
  const patch = buildUpdatePatch(changes)
  if (Object.keys(patch).length === 0) return null

  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .update(patch)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return rowToTask(data)
}

export async function deleteTaskRow(taskId, userId) {
  const { error } = await supabase.from(TASKS_TABLE).delete().eq('id', taskId).eq('user_id', userId)
  if (error) throw error
}
