const FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'active', label: 'Actives' },
  { value: 'done', label: 'Terminées' },
]

function FilterBar({ current, onChange }) {
  return (
    <div className="filter-bar">
      {FILTERS.map(f => (
        <button
          key={f.value}
          className={current === f.value ? 'active' : ''}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

export default FilterBar
