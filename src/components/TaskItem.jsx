function TaskItem({ task, lists, today, selected, onSelect, onToggle, onDelete }) {
  const list = lists.find(l => l.id === task.listId)

  function dateLabel() {
    if (!task.dueDate) return null
    if (task.dueDate === today) return { text: 'Aujourd\'hui', cls: 'today' }
    if (task.dueDate < today)  return { text: task.dueDate, cls: 'overdue' }
    return { text: task.dueDate, cls: '' }
  }

  const date = dateLabel()
  const doneSubtasks = task.subtasks.filter(s => s.completed).length

  function handleCheckbox(e) {
    e.stopPropagation()
    onToggle()
  }

  function handleDelete(e) {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div
      className={`task-item ${task.completed ? 'completed' : ''} ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <button
        className={`checkbox-btn ${task.completed ? 'done' : ''}`}
        onClick={handleCheckbox}
        aria-label={task.completed ? 'Marquer comme active' : 'Marquer comme terminée'}
      >
        {task.completed && <span className="checkmark" />}
      </button>

      {list && <span className="list-stripe" style={{ background: list.color }} />}

      <div className="task-content">
        <span className="task-text">{task.text}</span>
        {(date || task.subtasks.length > 0) && (
          <div className="task-meta">
            {date && <span className={`meta-date ${date.cls}`}>{date.text}</span>}
            {task.subtasks.length > 0 && (
              <span className="meta-date">
                {doneSubtasks}/{task.subtasks.length} sous-tâches
              </span>
            )}
          </div>
        )}
      </div>

      <div className="task-right">
        <span className={`priority-dot ${task.priority}`} />
        <button className="btn-delete-task" onClick={handleDelete} aria-label="Supprimer">✕</button>
        <span className="task-arrow">›</span>
      </div>
    </div>
  )
}

export default TaskItem
