function Navbar({ remaining, total }) {
  return (
    <nav className="navbar">
      <h1>Ma Todo List</h1>
      <span className="counter">
        {remaining} / {total} tâche{total !== 1 ? 's' : ''} restante{remaining !== 1 ? 's' : ''}
      </span>
    </nav>
  )
}

export default Navbar
