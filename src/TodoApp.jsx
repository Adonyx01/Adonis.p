import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import MainPanel from './components/MainPanel'
import TaskDetail from './components/TaskDetail'
import { supabase } from './lib/supabase'
import {
  fetchTasks,
  insertTask,
  updateTaskRow,
  deleteTaskRow,
} from './lib/taskDb'
import './App.css'

const INITIAL_LISTS = [
  { id: 'personal', name: 'Personnel', color: '#f87171' },
  { id: 'work', name: 'Travail', color: '#60a5fa' },
  { id: 'other', name: 'Autre', color: '#fbbf24' },
]

const PERSIST_DEBOUNCE_MS = 500

function TodoApp({ user }) {
  const [tasks, setTasks] = useState([])
  const [lists] = useState(INITIAL_LISTS)
  const [activeView, setActiveView] = useState('all')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const persistTimers = useRef(new Map())
  const pendingPatch = useRef(new Map())

  const reloadTasks = useCallback(async () => {
    const list = await fetchTasks(user.id)
    setTasks(list)
  }, [user.id])

  useEffect(() => {
    let cancelled = false
    fetchTasks(user.id)
      .then((list) => {
        if (!cancelled) {
          setTasks(list)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message ?? 'Impossible de charger les tâches.')
          setTasks([])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user.id])

  useEffect(() => {
    const timers = persistTimers.current
    const patches = pendingPatch.current
    return () => {
      for (const t of timers.values()) {
        clearTimeout(t)
      }
      timers.clear()
      patches.clear()
    }
  }, [])

  function flushPersist(taskId) {
    const timer = persistTimers.current.get(taskId)
    if (timer) {
      clearTimeout(timer)
      persistTimers.current.delete(taskId)
    }
    const merged = pendingPatch.current.get(taskId)
    pendingPatch.current.delete(taskId)
    if (!merged || Object.keys(merged).length === 0) return Promise.resolve()

    return updateTaskRow(taskId, user.id, merged).catch((err) => {
      setLoadError(err.message ?? 'Erreur de sauvegarde.')
      return reloadTasks()
    })
  }

  function schedulePersist(taskId, changes) {
    const prev = pendingPatch.current.get(taskId) ?? {}
    pendingPatch.current.set(taskId, { ...prev, ...changes })

    const existing = persistTimers.current.get(taskId)
    if (existing) clearTimeout(existing)

    const t = setTimeout(() => {
      persistTimers.current.delete(taskId)
      const merged = pendingPatch.current.get(taskId)
      pendingPatch.current.delete(taskId)
      if (!merged || Object.keys(merged).length === 0) return
      updateTaskRow(taskId, user.id, merged).catch((err) => {
        setLoadError(err.message ?? 'Erreur de sauvegarde.')
        reloadTasks()
      })
    }, PERSIST_DEBOUNCE_MS)
    persistTimers.current.set(taskId, t)
  }

  async function handleSignOut() {
    await Promise.all(
      [...persistTimers.current.keys()].map((id) => flushPersist(id))
    )
    await supabase.auth.signOut()
  }

  async function addTask(data) {
    setLoadError(null)
    try {
      const task = await insertTask(user.id, {
        completed: false,
        subtasks: [],
        description: '',
        ...data,
      })
      setTasks((prev) => [task, ...prev])
      setSelectedTaskId(task.id)
    } catch (err) {
      setLoadError(err.message ?? 'Impossible d’ajouter la tâche.')
    }
  }

  function updateTask(id, changes) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)))
    schedulePersist(id, changes)
  }

  async function deleteTask(id) {
    setLoadError(null)
    await flushPersist(id)
    try {
      await deleteTaskRow(id, user.id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (selectedTaskId === id) setSelectedTaskId(null)
    } catch (err) {
      setLoadError(err.message ?? 'Impossible de supprimer la tâche.')
    }
  }

  async function toggleTask(id) {
    setLoadError(null)
    let found = false
    let nextCompleted = false
    setTasks((prev) => {
      const t = prev.find((x) => x.id === id)
      if (!t) return prev
      found = true
      nextCompleted = !t.completed
      return prev.map((x) => (x.id === id ? { ...x, completed: nextCompleted } : x))
    })
    if (!found) return
    await flushPersist(id)
    try {
      await updateTaskRow(id, user.id, { completed: nextCompleted })
    } catch (err) {
      setLoadError(err.message ?? 'Impossible de mettre à jour la tâche.')
      reloadTasks()
    }
  }

  function addSubtask(taskId, text) {
    const sub = { id: crypto.randomUUID(), text, completed: false }
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t
      )
      const task = next.find((x) => x.id === taskId)
      if (task) schedulePersist(taskId, { subtasks: task.subtasks })
      return next
    })
  }

  function toggleSubtask(taskId, subId) {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== taskId) return t
        const subtasks = t.subtasks.map((s) =>
          s.id === subId ? { ...s, completed: !s.completed } : s
        )
        schedulePersist(taskId, { subtasks })
        return { ...t, subtasks }
      })
      return next
    })
  }

  function deleteSubtask(taskId, subId) {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== taskId) return t
        const subtasks = t.subtasks.filter((s) => s.id !== subId)
        schedulePersist(taskId, { subtasks })
        return { ...t, subtasks }
      })
      return next
    })
  }

  const today = new Date().toISOString().split('T')[0]

  const visibleTasks = tasks.filter((task) => {
    if (searchQuery) return task.text.toLowerCase().includes(searchQuery.toLowerCase())
    const dateStr = task.dueDate.slice(0, 10)
    if (activeView === 'today') return !task.completed && dateStr === today
    if (activeView === 'upcoming') return !task.completed && dateStr > today
    if (activeView !== 'all') return task.listId === activeView
    return true
  })

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  return (
    <div className={`app ${selectedTask ? 'with-detail' : ''}`}>
      {loadError && (
        <div className="app-error-banner" role="alert">
          {loadError}
          <button type="button" className="app-error-dismiss" onClick={() => setLoadError(null)}>
            Fermer
          </button>
        </div>
      )}
      <Sidebar
        lists={lists}
        tasks={tasks}
        today={today}
        activeView={activeView}
        onViewChange={(v) => {
          setActiveView(v)
          setSelectedTaskId(null)
        }}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        userEmail={user.email}
        onSignOut={handleSignOut}
      />
      <MainPanel
        tasks={visibleTasks}
        allTasks={tasks}
        lists={lists}
        activeView={activeView}
        selectedTaskId={selectedTaskId}
        today={today}
        onSelect={setSelectedTaskId}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onAdd={addTask}
        loading={loading}
      />
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          lists={lists}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onClose={() => setSelectedTaskId(null)}
          onAddSubtask={addSubtask}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
        />
      )}
    </div>
  )
}

export default TodoApp
