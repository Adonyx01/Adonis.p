import { useState } from 'react'

function TaskForm({ lists, activeView, onAdd, disabled }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('normal')

  const defaultListId = lists.find(l => l.id === activeView)?.id ?? lists[0]?.id ?? ''
  const [listId, setListId] = useState(defaultListId)
  const [dueDate, setDueDate] = useState('')

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
        value={dueDate}
        disabled={disabled}
        onChange={e => setDueDate(e.target.value)}
      />
      {text.trim() && (
        <button type="submit" className="btn-add-task">Ajouter</button>
      )}
    </form>
  )
}

export default TaskForm
