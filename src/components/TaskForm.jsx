import { useState } from 'react'

function TaskForm({ lists, activeView, onAdd }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('normal')

  const defaultListId = lists.find(l => l.id === activeView)?.id ?? lists[0]?.id ?? ''
  const [listId, setListId] = useState(defaultListId)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd({ text: trimmed, priority, listId, dueDate: '' })
    setText('')
    setPriority('normal')
  }

  return (
    <form className="task-form-inline" onSubmit={handleSubmit}>
      <span className="add-icon">+</span>
      <input
        type="text"
        placeholder="Ajouter une tâche..."
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <select value={priority} onChange={e => setPriority(e.target.value)}>
        <option value="low">Faible</option>
        <option value="normal">Normale</option>
        <option value="high">Haute</option>
      </select>
      <select value={listId} onChange={e => setListId(e.target.value)}>
        {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      {text.trim() && (
        <button type="submit" className="btn-add-task">Ajouter</button>
      )}
    </form>
  )
}

export default TaskForm
