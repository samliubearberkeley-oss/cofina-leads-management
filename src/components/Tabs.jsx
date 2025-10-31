import React from 'react'
import '../styles/Tabs.css'

function Tabs({ sheets, currentSheet, onSheetChange }) {
  return (
    <div className="tabs">
      {sheets.map(sheetName => (
        <button
          key={sheetName}
          className={`tab ${currentSheet === sheetName ? 'active' : ''}`}
          onClick={() => onSheetChange(sheetName)}
        >
          {sheetName}
        </button>
      ))}
    </div>
  )
}

export default Tabs

