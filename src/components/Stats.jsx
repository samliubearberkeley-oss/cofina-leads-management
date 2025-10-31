import React from 'react'
import '../styles/Stats.css'

function Stats({ stats }) {
  return (
    <div className="stats">
      <div className="stat-item">
        <div className="stat-value">{stats.totalRows}</div>
        <div className="stat-label">Total Rows</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{stats.totalCols}</div>
        <div className="stat-label">Total Columns</div>
      </div>
      <div className="stat-item stat-sheet">
        <div className="stat-label">Current Sheet</div>
        <div className="stat-sheet-name">{stats.currentSheet}</div>
      </div>
    </div>
  )
}

export default Stats

