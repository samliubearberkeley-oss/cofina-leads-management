import React from 'react'
import '../styles/Stats.css'

function Stats({ stats }) {
  return (
    <div className="stats">
      <div className="stat-item">
        <div className="stat-value">{stats.totalRows}</div>
        <div className="stat-label">总行数</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{stats.totalCols}</div>
        <div className="stat-label">总列数</div>
      </div>
      <div className="stat-item">
        <div className="stat-value" id="currentSheet">{stats.currentSheet}</div>
        <div className="stat-label">当前表格</div>
      </div>
    </div>
  )
}

export default Stats

