import React from 'react'
import '../styles/Tabs.css'

function Tabs({ sheets, currentSheet, onSheetChange }) {
  // 分离 LinkedIn Accepted 和其他 sheets
  const linkedInAccepted = sheets.find(s => s === 'LinkedIn Accepted')
  const otherSheets = sheets.filter(s => s !== 'LinkedIn Accepted')
  
  return (
    <div className="tabs">
      {/* LinkedIn Accepted 单独显示在最前面 */}
      {linkedInAccepted && (
        <button
          key={linkedInAccepted}
          className={`tab linkedin-accepted ${currentSheet === linkedInAccepted ? 'active' : ''}`}
          onClick={() => onSheetChange(linkedInAccepted)}
        >
          <span className="tab-badge">⭐</span>
          {linkedInAccepted}
        </button>
      )}
      
      {/* 分隔线 */}
      {linkedInAccepted && otherSheets.length > 0 && (
        <div className="tab-divider"></div>
      )}
      
      {/* 其他 sheets */}
      {otherSheets.map(sheetName => (
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

