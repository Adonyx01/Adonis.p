function ProgressBar({ completed, total }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="progress-area">
      <div className="progress-label">
        <span>{completed} sur {total} terminée{completed !== 1 ? 's' : ''}</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default ProgressBar
