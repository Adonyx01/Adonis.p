import TaskForm from './TaskForm'
import TaskItem from './TaskItem'
import ProgressBar from './ProgressBar'

const VIEW_LABELS = {
  all:      'Toutes les tâches',
  today:    "Aujourd'hui",
  upcoming: 'À venir',
}

function MainPanel({ tasks, allTasks, lists, activeView, selectedTaskId, today, onSelect, onToggle, onDelete, onAdd, loading }) {
  const label = VIEW_LABELS[activeView] ?? lists.find(l => l.id === activeView)?.name ?? 'Tâches'
  const completed = allTasks.filter(t => t.completed).length

  return (
    <div className="main-panel">
      <div className="main-header">
        <h1 className="main-title">{label}</h1>
        <span className="main-count">{tasks.length}</span>
      </div>

      <div className="main-body">
        <TaskForm lists={lists} activeView={activeView} onAdd={onAdd} disabled={loading} />

        {loading ? (
          <p className="empty-state">Chargement des tâches…</p>
        ) : tasks.length === 0 ? (
          <p className="empty-state">Aucune tâche ici.</p>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              lists={lists}
              today={today}
              selected={task.id === selectedTaskId}
              onSelect={() => onSelect(task.id === selectedTaskId ? null : task.id)}
              onToggle={() => onToggle(task.id)}
              onDelete={() => onDelete(task.id)}
            />
          ))
        )}
      </div>

      <ProgressBar completed={completed} total={allTasks.length} />
    </div>
  )
}

export default MainPanel
