import TaskItem from './TaskItem'

function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <p className="task-list-empty">Aucune tâche à afficher.</p>
  }

  return (
    <ul className="task-list" style={{ listStyle: 'none' }}>
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

export default TaskList
