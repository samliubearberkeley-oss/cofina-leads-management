import React, { useState, useEffect, useRef } from 'react'
import '../styles/TableView.css'

function TableView({ data, editMode, onCellEdit, selectedRows, onRowSelect }) {
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const tableRef = useRef(null)

  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
      if (!editMode) return

      // Ctrl+N: Add row
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        // This will be handled by parent
      }

      // Delete: Delete selected rows
      if (e.key === 'Delete' && selectedRows.size > 0) {
        e.preventDefault()
        // This will be handled by parent
      }

      // Ctrl+C: Copy
      if (e.ctrlKey && e.key === 'c' && selectedRows.size > 0) {
        e.preventDefault()
        // This will be handled by parent
      }

      // Ctrl+V: Paste
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault()
        // This will be handled by parent
      }

      // Ctrl+Z: Undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        // This will be handled by parent
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editMode, selectedRows])

  if (!data || !data.columns || !data.data || data.data.length === 0) {
    return (
      <div className="table-container">
        <div className="empty">No data available</div>
      </div>
    )
  }

  const isLinkColumn = (colName) => {
    const lower = colName.toLowerCase()
    return lower.includes('linkedin') || lower.includes('website') || lower.includes('link')
  }

  const handleCellClick = (rowIndex, cellIndex, cellValue) => {
    if (!editMode) return
    setEditingCell({ rowIndex, cellIndex })
    setEditingValue(cellValue === null || cellValue === undefined ? '' : String(cellValue))
  }

  const handleCellBlur = (rowIndex, cellIndex) => {
    if (!editingCell) return
    if (editingCell.rowIndex === rowIndex && editingCell.cellIndex === cellIndex) {
      const oldValue = data.data[rowIndex][cellIndex]
      const newValue = editingValue.trim()
      
      if (newValue !== String(oldValue || '')) {
        onCellEdit(rowIndex, cellIndex, newValue)
      }
      
      setEditingCell(null)
      setEditingValue('')
    }
  }

  const handleCellKeyDown = (e, rowIndex, cellIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCellBlur(rowIndex, cellIndex)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditingValue('')
    }
  }

  const handleRowClick = (rowIndex, e) => {
    if (!editMode) return
    
    // 如果点击的是checkbox或row selector，不处理行选择
    const clickedCell = e.target.closest('td')
    const clickedElement = e.target
    
    // 检查是否点击了checkbox本身或checkbox所在的td
    if (clickedElement?.type === 'checkbox' || 
        clickedElement?.tagName === 'INPUT' ||
        clickedCell?.classList.contains('checkbox-cell') || 
        clickedCell?.classList.contains('row-selector-cell')) {
      return
    }

    // 如果点击的是链接，不处理行选择
    if (clickedElement?.tagName === 'A') {
      return
    }

    const modifierPressed = e.ctrlKey || e.metaKey
    const shiftPressed = e.shiftKey
    
    if (onRowSelect) {
      onRowSelect(rowIndex, { modifierPressed, shiftPressed })
    }
  }
  
  const handleRowMouseDown = (rowIndex, e) => {
    if (!editMode) return
    
    // 如果点击的是checkbox或row selector，不处理行选择
    const clickedCell = e.target?.closest ? e.target.closest('td') : null
    const clickedElement = e.target
    
    if (clickedCell?.classList.contains('checkbox-cell') || 
        clickedCell?.classList.contains('row-selector-cell') ||
        clickedElement?.type === 'checkbox' ||
        clickedElement?.tagName === 'A' ||
        clickedElement?.tagName === 'INPUT') {
      return
    }
    
    // 如果是双击contentEditable单元格，不处理行选择
    if (clickedCell?.hasAttribute('contenteditable') && clickedCell?.getAttribute('contenteditable') === 'true') {
      if (e.detail === 2) {
        return
      }
    }

    const modifierPressed = e.ctrlKey || e.metaKey
    const shiftPressed = e.shiftKey
    
    if (onRowSelect) {
      onRowSelect(rowIndex, { modifierPressed, shiftPressed })
    }
  }

  const toggleRowSelection = (rowIndex, e) => {
    if (!editMode) return
    if (onRowSelect) {
      onRowSelect(rowIndex, { modifierPressed: e?.ctrlKey || e?.metaKey, shiftPressed: e?.shiftKey })
    }
  }

  const isCheckboxColumn = (colIndex) => {
    return colIndex === 0 && data.columns[0] === 'linkedin accepted?'
  }

  const renderCell = (cell, rowIndex, cellIndex, stableKey = null) => {
    const cellValue = cell === null || cell === undefined ? '' : String(cell)
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === cellIndex
    const isCheckbox = isCheckboxColumn(cellIndex)

    if (isCheckbox) {
      const checked = cellValue && (
        cellValue === '✓' ||
        cellValue.toLowerCase() === '是' || 
        cellValue.toLowerCase() === 'yes' || 
        cellValue === '1'
      )
      
      return (
        <td
          key={cellIndex}
          className="checkbox-cell"
          onClick={(e) => {
            e.stopPropagation()
            console.log(`🔲 Checkbox TD clicked: target=${e.target.tagName}, editMode=${editMode}`)
            
            // 如果checkbox被禁用，不允许点击
            if (!editMode) {
              console.log('❌ Edit mode disabled, ignoring click')
              return
            }
            
            // 如果点击的是td而不是checkbox，手动切换checkbox状态
            if (e.target.tagName !== 'INPUT') {
              const checkbox = e.currentTarget.querySelector('input[type="checkbox"]')
              if (checkbox && !checkbox.disabled) {
                // 基于数据状态（cellValue）而不是DOM状态（checkbox.checked）来计算新值
                // 这样可以避免排序后状态不同步的问题
                const currentChecked = cellValue === '✓'
                const newValue = currentChecked ? '' : '✓'
                console.log(`📍 TD clicked: cellValue="${cellValue}", currentChecked=${currentChecked}, newValue="${newValue}"`)
                onCellEdit(rowIndex, cellIndex, newValue)
              }
            } else {
              console.log('✓ Checkbox input clicked, onChange will handle it')
            }
          }}
        >
          <input
            type="checkbox"
            disabled={!editMode}
            checked={checked}
            onChange={(e) => {
              e.stopPropagation()
              const newValue = e.target.checked ? '✓' : ''
              console.log(`Checkbox onChange: row=${rowIndex}, cell=${cellIndex}, currentValue="${cellValue}", checked=${e.target.checked}, newValue="${newValue}", willChange=${cellValue !== newValue}`)
              
              // 如果值没有变化，不要调用onCellEdit
              if (cellValue === newValue) {
                console.log('❌ Value not changed, skipping onCellEdit')
                return
              }
              console.log('✅ Calling onCellEdit')
              onCellEdit(rowIndex, cellIndex, newValue)
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          />
        </td>
      )
    }

    if (isEditing) {
      return (
        <td key={cellIndex}>
          <input
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={() => handleCellBlur(rowIndex, cellIndex)}
            onKeyDown={(e) => handleCellKeyDown(e, rowIndex, cellIndex)}
            autoFocus
            className="cell-input"
          />
        </td>
      )
    }

    const isLink = cellValue.startsWith('http') && cellIndex < data.columns.length
    const colName = data.columns[cellIndex]
    
    return (
      <td
        key={cellIndex}
        contentEditable={editMode && !isLink}
        onClick={(e) => {
          // 单击单元格：在编辑模式下允许直接编辑，不选择行
          if (editMode && !isEditing) {
            e.stopPropagation() // 阻止事件传播到TR，避免触发行选择
            // 让单元格获得焦点，用户可以直接编辑
          }
        }}
        onBlur={(e) => {
          if (editMode && !isEditing) {
            const newValue = e.target.textContent.trim()
            const oldValue = cellValue
            if (newValue !== oldValue) {
              console.log(`📝 Cell edited: row=${rowIndex}, cell=${cellIndex}, oldValue="${oldValue}", newValue="${newValue}"`)
              onCellEdit(rowIndex, cellIndex, newValue)
            }
          }
        }}
        suppressContentEditableWarning
        style={{
          background: editMode ? 'rgba(230, 154, 0, 0.05)' : 'transparent',
          cursor: editMode ? 'text' : 'default'
        }}
      >
        {isLink && isLinkColumn(colName) ? (
          <a
            href={cellValue}
            target="_blank"
            rel="noopener noreferrer"
            className="link-cell"
            onClick={(e) => e.stopPropagation()}
          >
            {cellValue.length > 50 ? cellValue.substring(0, 50) + '...' : cellValue}
          </a>
        ) : (
          cellValue
        )}
      </td>
    )
  }

  return (
    <div className="table-container">
      <table ref={tableRef} id="dataTable" className={editMode ? 'edit-mode' : ''}>
        <thead>
          <tr>
            {editMode && (
              <th className="row-selector-cell"></th>
            )}
            {data.columns.map((col, index) => (
              <th key={index}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.data.map((row, rowIndex) => {
            const isSelected = selectedRows.has(rowIndex)
            // 使用稳定的key：只基于LinkedIn URL，不包含rowIndex
            // 这样排序后，相同的行（相同的LinkedIn URL）的key保持不变
            // React就能正确追踪和更新这一行
            const linkedInColIndex = data.columns.findIndex(col => 
              col.toLowerCase().includes('linkedin') && 
              !col.toLowerCase().includes('accepted') && 
              !col.toLowerCase().includes('request')
            )
            const stableKey = (linkedInColIndex >= 0 && row[linkedInColIndex]) 
              ? row[linkedInColIndex]  // 只用URL，不加rowIndex
              : `row-${rowIndex}`      // 如果没有URL，用row-前缀避免与URL冲突
            
            return (
              <tr
                key={stableKey}
                className={isSelected ? 'selected' : ''}
              >
                {editMode && (
                  <td
                    className={`row-selector-cell ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleRowSelection(rowIndex, e)
                    }}
                  >
                    <div className="row-selector-circle"></div>
                  </td>
                )}
                {row.map((cell, cellIndex) => renderCell(cell, rowIndex, cellIndex, stableKey))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default TableView
