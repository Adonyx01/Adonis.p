import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import MainPanel from './components/MainPanel'
import TaskDetail from './components/TaskDetail'
import './App.css'

const INITIAL_LISTS = [
  { id: 'personal', name: 'Personnel', color: '#f87171' },
  { id: 'work', name: 'Travail', color: '#60a5fa' },
  { id: 'other', name: 'Autre', color: '#fbbf24' },
]

const INITIAL_TASKS = [
  {
    id: 1,
    text: 'Comprendre les hooks React',
    description: 'useState, useEffect, useContext, useRef...',
    completed: true,
    priority: 'high',
    listId: 'work',
    dueDate: '2026-05-10',
    subtasks: [
      { id: 101, text: 'useState & useReducer', completed: true },
      { id: 102, text: 'useEffect & cleanup', completed: true },
      { id: 103, text: 'useContext', completed: false },
    ],
  },
  {
    id: 2,
    text: 'Créer des composants réutilisables',
    description: 'Penser aux props, à la composition et au découpage.',
    completed: false,
    priority: 'high',
    listId: 'work',
    dueDate: '2026-05-11',
    subtasks: [],
  },
  {
    id: 3,
    text: 'Faire les courses',
    description: 'Lait, pain, fromage, fruits.',
    completed: false,
    priority: 'low',
    listId: 'personal',
    dueDate: '2026-05-09',
    subtasks: [
      { id: 301, text: 'Lait & pain', completed: false },
      { id: 302, text: 'Fruits de saison', completed: false },
    ],
  },
  {
    id: 4,
    text: 'Appeler le médecin',
    description: '',
    completed: false,
    priority: 'normal',
    listId: 'personal',
    dueDate: '2026-05-12',
    subtasks: [],
  },
  {
    id: 5,
    text: 'Préparer la démo du projet',
    description: 'Slides + démo live de l\'app Todo.',
    completed: false,
    priority: 'high',
    listId: 'work',
    dueDate: '2026-05-14',
    subtasks: [],
  },
]

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('todo-tasks-v2')
    return saved ? JSON.parse(saved) : INITIAL_TASKS
  })
  const [lists] = useState(INITIAL_LISTS)
  const [activeView, setActiveView] = useState('all')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    localStorage.setItem('todo-tasks-v2', JSON.stringify(tasks))
  }, [tasks])

  function addTask(data) {
    const task = { id: Date.now(), completed: false, subtasks: [], description: '', ...data }
    setTasks(prev => [task, ...prev])
    setSelectedTaskId(task.id)
  }

  function updateTask(id, changes) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (selectedTaskId === id) setSelectedTaskId(null)
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ))
  }

  function addSubtask(taskId, text) {
    const sub = { id: Date.now(), text, completed: false }
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t
    ))
  }

  function toggleSubtask(taskId, subId) {
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s) }
        : t
    ))
  }

  function deleteSubtask(taskId, subId) {
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subId) }
        : t
    ))
  }

  const today = new Date().toISOString().split('T')[0]

  const visibleTasks = tasks.filter(task => {
    if (searchQuery) return task.text.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeView === 'today') return task.dueDate === today
    if (activeView === 'upcoming') return task.dueDate > today
    if (activeView !== 'all') return task.listId === activeView
    return true
  })

  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null

  return (
    <div className={`app ${selectedTask ? 'with-detail' : ''}`}>
      <Sidebar
        lists={lists}
        tasks={tasks}
        today={today}
        activeView={activeView}
        onViewChange={v => { setActiveView(v); setSelectedTaskId(null) }}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
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

export default App
