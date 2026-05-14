import { useState, useEffect } from 'react'

function TaskForm({ lists, activeView, onAdd, disabled }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('normal')
  const [listId, setListId] = useState(() => lists.find(l => l.id === activeView)?.id ?? lists[0]?.id ?? '')
  const [dueDate, setDueDate] = useState('')

  // Sync listId when switching to a list-specific view
  useEffect(() => {
    const matchingList = lists.find(l => l.id === activeView)
    if (matchingList) setListId(matchingList.id)
  }, [activeView, lists])

  function handleSubmit(e) {
    e.preventDefault()
    if (disabled) return
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd({ text: trimmed, priority, listId, dueDate })
    setText('')
    setPriority('normal')
    setDueDate('')
  }

  return (
    <form className="task-form-inline" onSubmit={handleSubmit}>
      <span className="add-icon">+</span>
      <input
        type="text"
        placeholder="Ajouter une tâche..."
        value={text}
        disabled={disabled}
        onChange={e => setText(e.target.value)}
      />
      <div className="task-form-extras">
        <select value={priority} onChange={e => setPriority(e.target.value)} disabled={disabled}>
          <option value="low">Faible</option>
          <option value="normal">Normale</option>
          <option value="high">Haute</option>
        </select>
        <select value={listId} onChange={e => setListId(e.target.value)} disabled={disabled}>
          {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input
          type="datetime-local"
          className="task-form-date"
          value={dueDate}
          disabled={disabled}
          onChange={e => setDueDate(e.target.value)}
        />
        {text.trim() && (
          <button type="submit" className="btn-add-task">Ajouter</button>
        )}
      </div>
    </form>
  )
}

export default TaskForm
