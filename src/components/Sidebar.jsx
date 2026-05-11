
import logo from "../components/logo.jpg";
const VIEWS = [
  { id: 'upcoming', label: 'À venir',      icon: '»' },
  { id: 'today',    label: "Aujourd'hui",  icon: '≡' },
  { id: 'all',      label: 'Toutes',       icon: '◫' },
]

function Sidebar({ lists, tasks, today, activeView, onViewChange, searchQuery, onSearch }) {
  function countFor(viewId) {
    if (viewId === 'today')    return tasks.filter(t => t.dueDate === today).length
    if (viewId === 'upcoming') return tasks.filter(t => t.dueDate > today).length
    return tasks.length
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="Logo" className="logo-icon" />
        <span className="logo-name">Adonis Project</span>
      </div>

      <div className="sidebar-search">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      <p className="sidebar-section">Tâches</p>
      {VIEWS.map(v => (
        <button
          key={v.id}
          className={`nav-item ${activeView === v.id ? 'active' : ''}`}
          onClick={() => onViewChange(v.id)}
        >
          <span className="nav-icon">{v.icon}</span>
          <span className="nav-label">{v.label}</span>
          <span className="nav-count">{countFor(v.id)}</span>
        </button>
      ))}

      <p className="sidebar-section">Listes</p>
      {lists.map(list => (
        <button
          key={list.id}
          className={`nav-item ${activeView === list.id ? 'active' : ''}`}
          onClick={() => onViewChange(list.id)}
        >
          <span className="list-dot" style={{ background: list.color }} />
          <span className="nav-label">{list.name}</span>
          <span className="nav-count">{tasks.filter(t => t.listId === list.id).length}</span>
        </button>
      ))}

      <div className="sidebar-footer">
        <button className="nav-item">
          <span className="nav-icon">⚙</span>
          <span className="nav-label">Paramètres</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
