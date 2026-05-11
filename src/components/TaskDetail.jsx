import { useState, useRef, useEffect } from 'react'

function TaskDetail({ task, lists, onUpdate, onDelete, onClose, onAddSubtask, onToggleSubtask, onDeleteSubtask }) {
  const [newSubText, setNewSubText] = useState('')
  const subInputRef = useRef(null)

  
  function handleField(field, value) {
    onUpdate(task.id, { [field]: value })
  }

  function submitSubtask(e) {
    e.preventDefault()
    const text = newSubText.trim()
    if (!text) return
    onAddSubtask(task.id, text)
    setNewSubText('')
    subInputRef.current?.focus()
  }

  const PRIORITIES = [
    { value: 'low',    label: 'Faible' },
    { value: 'normal', label: 'Normale' },
    { value: 'high',   label: 'Haute' },
  ]

  return (
    <aside className="task-detail">
      <div className="detail-header">
        <span className="detail-header-title">Détails</span>
        <button className="btn-close-detail" onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      <div className="detail-body">
        {/* Title */}
        <textarea
          className="detail-title-input"
          value={task.text}
          rows={2}
          onChange={e => handleField('text', e.target.value)}
        />

        {/* Description */}
        <div className="detail-field">
          <span className="detail-field-label">Description</span>
          <textarea
            className="detail-desc-textarea"
            placeholder="Ajouter une description..."
            value={task.description}
            rows={3}
            onChange={e => handleField('description', e.target.value)}
          />
        </div>

        {/* List */}
        <div className="detail-field">
          <span className="detail-field-label">Liste</span>
          <select
            className="detail-select"
            value={task.listId}
            onChange={e => handleField('listId', e.target.value)}
          >
            {lists.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Due date */}
        <div className="detail-field">
          <span className="detail-field-label">Date d'échéance</span>
          <input
            type="date"
            className="detail-input-date"
            value={task.dueDate}
            onChange={e => handleField('dueDate', e.target.value)}
          />
        </div>

        {/* Priority */}
        <div className="detail-field">
          <span className="detail-field-label">Priorité</span>
          <div className="priority-buttons">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                className={`priority-btn ${task.priority === p.value ? `active-${p.value}` : ''}`}
                onClick={() => handleField('priority', p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subtasks */}
        <div className="detail-field subtasks-section">
          <span className="detail-field-label">
            Sous-tâches
            {task.subtasks.length > 0 && (
              <> — {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</>
            )}
          </span>

          {task.subtasks.map(sub => (
            <div key={sub.id} className="subtask-item">
              <button
                className={`subtask-checkbox ${sub.completed ? 'done' : ''}`}
                onClick={() => onToggleSubtask(task.id, sub.id)}
              >
                {sub.completed && <span className="subtask-check-mark" />}
              </button>
              <span className={`subtask-text ${sub.completed ? 'done' : ''}`}>{sub.text}</span>
              <button
                className="btn-delete-sub"
                onClick={() => onDeleteSubtask(task.id, sub.id)}
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}

          <form className="add-subtask-form" onSubmit={submitSubtask}>
            <span className="add-sub-icon">+</span>
            <input
              ref={subInputRef}
              type="text"
              placeholder="Nouvelle sous-tâche..."
              value={newSubText}
              onChange={e => setNewSubText(e.target.value)}
            />
          </form>
        </div>
      </div>

      <div className="detail-footer">
        <button className="btn-delete-full" onClick={() => onDelete(task.id)}>
          Supprimer la tâche
        </button>
      </div>
    </aside>
  )
}

export default TaskDetail
