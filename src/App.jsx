import React, { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import Stats from './components/Stats'
import SearchBox from './components/SearchBox'
import Tabs from './components/Tabs'
import TableView from './components/TableView'
import EditToggle from './components/EditToggle'
import EditToolbar from './components/EditToolbar'
import { fetchData, saveData } from './services/api'
import './styles/App.css'

function App() {
  const [allData, setAllData] = useState({})
  const [filteredData, setFilteredData] = useState({})
  const [currentSheet, setCurrentSheet] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [lastSelectedRow, setLastSelectedRow] = useState(null)
  const [copiedRows, setCopiedRows] = useState([])
  const [undoStack, setUndoStack] = useState([])
  const [pendingChanges, setPendingChanges] = useState({}) // 暂存的编辑，格式: { sheetName: { rowIndex: { cellIndex: newValue } } }
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const dataRef = useRef({})

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchTerm, allData])

  useEffect(() => {
    dataRef.current = allData
  }, [allData])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchData()
      setAllData(data)
      setFilteredData(data)
      dataRef.current = data
      
      // 显示第一个表格
      if (Object.keys(data).length > 0) {
        const firstSheet = Object.keys(data)[0]
        setCurrentSheet(firstSheet)
      }
      setLoading(false)
    } catch (error) {
      console.error('加载数据失败:', error)
      setLoading(false)
    }
  }

  const filterData = () => {
    if (!searchTerm.trim()) {
      setFilteredData(allData)
      return
    }

    const filtered = {}
    Object.keys(allData).forEach(sheetName => {
      const sheet = allData[sheetName]
      const filteredRows = sheet.data.filter(row => {
        return row.some(cell => {
          const cellStr = String(cell || '').toLowerCase()
          return cellStr.includes(searchTerm.toLowerCase())
        })
      })
      
      // 排序：将linkedin accepted的行排到最上面（除了 LinkedIn Accepted sheet）
      if (sheetName !== "LinkedIn Accepted") {
        filteredRows.sort((a, b) => {
          const aAccepted = a[0] && (a[0] === '✓' || a[0] === '1' || String(a[0]).toLowerCase() === 'yes')
          const bAccepted = b[0] && (b[0] === '✓' || b[0] === '1' || String(b[0]).toLowerCase() === 'yes')
          if (aAccepted && !bAccepted) return -1
          if (!aAccepted && bAccepted) return 1
          return 0
        })
      }
      
      filtered[sheetName] = {
        columns: sheet.columns,
        data: filteredRows
      }
    })
    
    setFilteredData(filtered)
  }

  const handleSheetChange = (sheetName) => {
    setCurrentSheet(sheetName)
    setSelectedRows(new Set())
    setLastSelectedRow(null)
  }

  const handleSearchChange = (term) => {
    setSearchTerm(term)
  }

  const handleEditModeToggle = (enabled) => {
    setEditMode(enabled)
    if (!enabled) {
      setSelectedRows(new Set())
      setUndoStack([])
    }
  }

  const handleRowSelect = (rowIndex, options = {}) => {
    if (!editMode) return

    const { modifierPressed = false, shiftPressed = false } = options

    if (shiftPressed && lastSelectedRow !== null) {
      // Shift + 点击：范围选择
      const start = Math.min(lastSelectedRow, rowIndex)
      const end = Math.max(lastSelectedRow, rowIndex)
      const newSelected = new Set(selectedRows)
      for (let i = start; i <= end; i++) {
        newSelected.add(i)
      }
      setSelectedRows(newSelected)
    } else {
      // 普通点击或 Ctrl/Cmd + 点击
      const newSelected = modifierPressed ? new Set(selectedRows) : new Set(selectedRows)
      if (modifierPressed) {
        // Ctrl/Cmd + 点击：切换选择状态
        if (newSelected.has(rowIndex)) {
          newSelected.delete(rowIndex)
        } else {
          newSelected.add(rowIndex)
        }
      } else {
        // 普通点击：如果已选中则取消，否则只选择这一个
        if (newSelected.has(rowIndex)) {
          // 已选中，取消选择
          newSelected.delete(rowIndex)
        } else {
          // 未选中，清除其他选择，只选择这一个
          newSelected.clear()
          newSelected.add(rowIndex)
        }
      }
      setSelectedRows(newSelected)
    }
    
    setLastSelectedRow(rowIndex)
  }

  const handleCellEdit = (rowIndex, cellIndex, newValue) => {
    console.log(`📝 handleCellEdit (pending): row=${rowIndex}, cell=${cellIndex}, newValue="${newValue}", sheet="${currentSheet}"`)
    
    // 只暂存编辑，不立即应用到allData
    const newPendingChanges = { ...pendingChanges }
    if (!newPendingChanges[currentSheet]) {
      newPendingChanges[currentSheet] = {}
    }
    if (!newPendingChanges[currentSheet][rowIndex]) {
      newPendingChanges[currentSheet][rowIndex] = {}
    }
    
    newPendingChanges[currentSheet][rowIndex][cellIndex] = newValue
    setPendingChanges(newPendingChanges)
    setHasUnsavedChanges(true)
    
    console.log(`💡 Change added to pending (not saved yet)`)
  }

  const handleSaveChanges = () => {
    console.log(`💾 Saving all pending changes...`)
    
    // 应用所有pendingChanges到allData
    let updatedAllData = { ...allData }
    
    for (const sheetName in pendingChanges) {
      const sheetChanges = pendingChanges[sheetName]
      const sheet = { ...updatedAllData[sheetName] }
      const newData = sheet.data.map(row => [...row])
      
      for (const rowIndex in sheetChanges) {
        const rowChanges = sheetChanges[rowIndex]
        const actualRowIndex = parseInt(rowIndex)
        
        if (actualRowIndex < newData.length) {
          for (const cellIndex in rowChanges) {
            const actualCellIndex = parseInt(cellIndex)
            const newValue = rowChanges[cellIndex]
            const oldValue = newData[actualRowIndex][actualCellIndex]
            
            console.log(`  Applying: sheet="${sheetName}", row=${actualRowIndex}, cell=${actualCellIndex}, "${oldValue}" -> "${newValue}"`)
            
            newData[actualRowIndex][actualCellIndex] = newValue
            
            // 如果是checkbox（第0列），同步到LinkedIn Accepted
            if (actualCellIndex === 0 && sheetName !== "LinkedIn Accepted") {
              const linkedInColIndex = sheet.columns.findIndex(col => 
                col.toLowerCase().includes('linkedin') && 
                !col.toLowerCase().includes('accepted') && 
                !col.toLowerCase().includes('request')
              )
              
              if (linkedInColIndex >= 0 && linkedInColIndex < newData[actualRowIndex].length) {
                const linkedInUrl = String(newData[actualRowIndex][linkedInColIndex] || '').trim()
                if (linkedInUrl) {
                  syncToLinkedInAccepted(linkedInUrl, newValue === '✓')
                }
              }
            }
            
            // 保存到backend
            saveDataToBackend(sheetName, actualRowIndex, actualCellIndex, newValue)
          }
        }
      }
      
      sheet.data = newData
      updatedAllData[sheetName] = sheet
      
      // 如果该sheet有checkbox变更，重新排序
      if (sheetChanges && Object.values(sheetChanges).some(row => row[0] !== undefined) && sheetName !== "LinkedIn Accepted") {
        console.log(`🔄 Sorting sheet "${sheetName}"`)
        sortDataByLinkedInAccepted(sheetName, updatedAllData)
      }
    }
    
    setAllData(updatedAllData)
    setFilteredData(updatedAllData)
    setPendingChanges({})
    setHasUnsavedChanges(false)
    
    console.log(`✅ All changes saved!`)
  }

  const handleCancelChanges = () => {
    console.log(`❌ Canceling all pending changes...`)
    setPendingChanges({})
    setHasUnsavedChanges(false)
    // 强制重新渲染以显示原始数据
    setFilteredData({ ...filteredData })
  }

  const saveDataToBackend = async (sheetName, rowIndex, cellIndex, value) => {
    try {
      const sheet = allData[sheetName]
      if (!sheet) return
      
      // 判断是哪个列
      let editedData = {}
      let accepted = {}
      let linkedinAccepted = {}
      
      if (cellIndex === 0) {
        // "linkedin accepted?" 列
        linkedinAccepted = {
          [rowIndex]: value === '1' || value === '✓'
        }
      } else if (cellIndex === 1) {
        // "Accepted" 列
        accepted = {
          [rowIndex]: value === '1' || value === '✓'
        }
      } else {
        // 其他列
        editedData = {
          [rowIndex]: {
            [cellIndex]: value
          }
        }
      }
      
      await saveData(sheetName, editedData, accepted, linkedinAccepted)
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const syncToLinkedInAccepted = (linkedInUrl, isAccepted) => {
    console.log(`🔗 Syncing to LinkedIn Accepted: url="${linkedInUrl}", isAccepted=${isAccepted}`)
    
    // 1. 更新localStorage中的linkedin_accepted_urls
    let acceptedUrls = []
    try {
      const stored = localStorage.getItem('linkedin_accepted_urls')
      if (stored) {
        acceptedUrls = JSON.parse(stored)
      }
    } catch (e) {
      console.error('读取linkedin_accepted_urls失败:', e)
    }
    
    if (isAccepted) {
      // 添加URL（如果不存在）
      if (!acceptedUrls.includes(linkedInUrl)) {
        acceptedUrls.push(linkedInUrl)
        console.log(`➕ Added to localStorage: ${linkedInUrl}`)
      }
    } else {
      // 删除URL
      const index = acceptedUrls.indexOf(linkedInUrl)
      if (index > -1) {
        acceptedUrls.splice(index, 1)
        console.log(`➖ Removed from localStorage: ${linkedInUrl}`)
      }
    }
    
    // 保存到localStorage
    localStorage.setItem('linkedin_accepted_urls', JSON.stringify(acceptedUrls))
    console.log(`💾 LinkedIn Accepted URLs count: ${acceptedUrls.length}`)
    
    // 2. 同步到LinkedIn Accepted sheet
    const linkedInAcceptedSheet = { ...allData['LinkedIn Accepted'] }
    if (!linkedInAcceptedSheet || !linkedInAcceptedSheet.data) {
      console.warn('LinkedIn Accepted sheet not found')
      return
    }
    
    // 找到LinkedIn URL所在的列
    const urlColIndex = linkedInAcceptedSheet.columns.findIndex(col => 
      col.toLowerCase().includes('linkedin') && 
      !col.toLowerCase().includes('accepted')
    )
    
    if (urlColIndex === -1) {
      console.warn('LinkedIn URL column not found in LinkedIn Accepted sheet')
      return
    }
    
    // 查找该URL是否已存在
    const existingRowIndex = linkedInAcceptedSheet.data.findIndex(row => 
      row[urlColIndex] && String(row[urlColIndex]).trim() === linkedInUrl
    )
    
    let needsUpdate = false
    
    if (isAccepted) {
      // 如果要添加，但不存在，则添加新行
      if (existingRowIndex === -1) {
        // 从原始sheet中查找完整的行数据
        let fullRowData = null
        let sourceSheet = null
        
        for (const sheetName in allData) {
          if (sheetName === 'LinkedIn Accepted') continue
          const sheet = allData[sheetName]
          const linkedInCol = sheet.columns.findIndex(col => 
            col.toLowerCase().includes('linkedin') && 
            !col.toLowerCase().includes('accepted') && 
            !col.toLowerCase().includes('request')
          )
          if (linkedInCol >= 0) {
            const foundRow = sheet.data.find(row => 
              row[linkedInCol] && String(row[linkedInCol]).trim() === linkedInUrl
            )
            if (foundRow) {
              fullRowData = foundRow
              sourceSheet = sheet
              break
            }
          }
        }
        
        if (fullRowData && sourceSheet) {
          // 创建新行，匹配LinkedIn Accepted sheet的列结构
          const newRow = linkedInAcceptedSheet.columns.map((col, idx) => {
            // 对于LinkedIn Accepted sheet，第0列是linkedin accepted?，应该设为✓
            if (idx === 0) return '✓'
            
            // 找到源sheet中对应的列索引
            const sourceColIdx = sourceSheet.columns.indexOf(col)
            if (sourceColIdx >= 0 && sourceColIdx < fullRowData.length) {
              return fullRowData[sourceColIdx] || ''
            }
            return ''
          })
          
          linkedInAcceptedSheet.data.push(newRow)
          needsUpdate = true
          console.log(`➕ Added row to LinkedIn Accepted sheet: ${linkedInUrl}`)
        } else {
          console.warn(`⚠️ Could not find source data for ${linkedInUrl}`)
        }
      } else {
        // 如果已存在，确保checkbox列（第0列）是✓
        if (linkedInAcceptedSheet.data[existingRowIndex][0] !== '✓') {
          linkedInAcceptedSheet.data[existingRowIndex] = [...linkedInAcceptedSheet.data[existingRowIndex]]
          linkedInAcceptedSheet.data[existingRowIndex][0] = '✓'
          needsUpdate = true
          console.log(`✓ Updated existing row in LinkedIn Accepted sheet: ${linkedInUrl}`)
        }
      }
    } else {
      // 如果要删除，并且存在，则删除该行
      if (existingRowIndex !== -1) {
        linkedInAcceptedSheet.data.splice(existingRowIndex, 1)
        needsUpdate = true
        console.log(`➖ Removed row from LinkedIn Accepted sheet: ${linkedInUrl}`)
      }
    }
    
    // 3. 更新allData
    if (needsUpdate) {
      const updatedData = {
        ...allData,
        'LinkedIn Accepted': linkedInAcceptedSheet
      }
      setAllData(updatedData)
      
      // 更新filteredData
      if (searchTerm.trim()) {
        // 有搜索时，重新过滤
        const filtered = {}
        Object.keys(updatedData).forEach(sheetName => {
          const sheet = updatedData[sheetName]
          const filteredRows = sheet.data.filter(row => {
            return row.some(cell => {
              const cellStr = String(cell || '').toLowerCase()
              return cellStr.includes(searchTerm.toLowerCase())
            })
          })
          filtered[sheetName] = {
            columns: sheet.columns,
            data: filteredRows
          }
        })
        setFilteredData(filtered)
      } else {
        setFilteredData(updatedData)
      }
      
      console.log(`✅ LinkedIn Accepted sheet updated`)
    }
  }

  // 获取包含pending changes的显示数据
  const getDisplayData = () => {
    if (Object.keys(pendingChanges).length === 0) {
      return filteredData
    }
    
    const displayData = JSON.parse(JSON.stringify(filteredData))
    
    for (const sheetName in pendingChanges) {
      if (!displayData[sheetName]) continue
      
      const sheetChanges = pendingChanges[sheetName]
      for (const rowIndex in sheetChanges) {
        const actualRowIndex = parseInt(rowIndex)
        if (actualRowIndex < displayData[sheetName].data.length) {
          const rowChanges = sheetChanges[rowIndex]
          for (const cellIndex in rowChanges) {
            const actualCellIndex = parseInt(cellIndex)
            displayData[sheetName].data[actualRowIndex][actualCellIndex] = rowChanges[cellIndex]
          }
        }
      }
    }
    
    return displayData
  }

  const sortDataByLinkedInAccepted = (sheetName, dataToSort = null) => {
    const useData = dataToSort || allData
    const sheet = { ...useData[sheetName] }
    if (!sheet || !sheet.data) return
    
    console.log(`🔄 Sorting sheet "${sheetName}", original data length: ${sheet.data.length}`)
    
    const sortedData = [...sheet.data].sort((a, b) => {
      const aAccepted = a[0] && (a[0] === '✓' || a[0] === '1' || String(a[0]).toLowerCase() === 'yes')
      const bAccepted = b[0] && (b[0] === '✓' || b[0] === '1' || String(b[0]).toLowerCase() === 'yes')
      if (aAccepted && !bAccepted) return -1
      if (!aAccepted && bAccepted) return 1
      return 0
    })
    
    console.log(`✅ Sorted data length: ${sortedData.length}`)
    
    sheet.data = sortedData
    
    // 如果传入了dataToSort，更新该数据并返回（用于handleSaveChanges）
    if (dataToSort) {
      dataToSort[sheetName] = sheet
      return
    }
    
    // 否则更新全局state
    const updatedData = {
      ...allData,
      [sheetName]: sheet
    }
    
    setAllData(updatedData)
    
    // 如果有搜索过滤，需要重新过滤
    // 注意：必须基于updatedData而不是allData，因为setAllData是异步的
    if (searchTerm.trim()) {
      console.log('🔍 Has search term, filtering updated data...')
      const filtered = {}
      Object.keys(updatedData).forEach(sheetName => {
        const sheet = updatedData[sheetName]
        const filteredRows = sheet.data.filter(row => {
          return row.some(cell => {
            const cellStr = String(cell || '').toLowerCase()
            return cellStr.includes(searchTerm.toLowerCase())
          })
        })
        
        filtered[sheetName] = {
          columns: sheet.columns,
          data: filteredRows
        }
      })
      setFilteredData(filtered)
    } else {
      console.log('📋 No search term, setting filtered data to updated data')
      setFilteredData(updatedData)
    }
  }

  const handleAddRow = () => {
    if (!editMode || !currentSheet) return
    
    const sheet = { ...allData[currentSheet] }
    const newRow = new Array(sheet.columns.length).fill('')
    newRow[0] = '' // Checkbox column
    
    sheet.data = [...sheet.data, newRow]
    
    const updatedData = {
      ...allData,
      [currentSheet]: sheet
    }
    
    setAllData(updatedData)
    setFilteredData(updatedData)
    
    setUndoStack([...undoStack, {
      action: 'add_row',
      sheet: currentSheet,
      rowIndex: sheet.data.length - 1
    }])
  }

  const handleDeleteRows = () => {
    if (!editMode || selectedRows.size === 0) return
    
    if (!window.confirm(`删除 ${selectedRows.size} 行?`)) return
    
    const sheet = { ...allData[currentSheet] }
    const indicesToDelete = Array.from(selectedRows).sort((a, b) => b - a)
    const deletedRows = []
    
    indicesToDelete.forEach(index => {
      deletedRows.push({
        index,
        data: [...sheet.data[index]]
      })
      sheet.data.splice(index, 1)
    })
    
    const updatedData = {
      ...allData,
      [currentSheet]: sheet
    }
    
    setAllData(updatedData)
    setFilteredData(updatedData)
    setSelectedRows(new Set())
    
    setUndoStack([...undoStack, {
      action: 'delete_rows',
      sheet: currentSheet,
      deletedRows
    }])
  }

  const handleCopyRows = () => {
    if (selectedRows.size === 0) return
    
    const sheet = filteredData[currentSheet]
    const copied = Array.from(selectedRows).map(index => ({
      index,
      data: [...sheet.data[index]]
    }))
    
    setCopiedRows(copied)
  }

  const handlePasteRows = () => {
    if (copiedRows.length === 0) return
    
    const sheet = { ...allData[currentSheet] }
    const insertIndex = lastSelectedRow !== null ? lastSelectedRow + 1 : sheet.data.length
    
    copiedRows.forEach(({ data }) => {
      sheet.data.splice(insertIndex, 0, [...data])
    })
    
    const updatedData = {
      ...allData,
      [currentSheet]: sheet
    }
    
    setAllData(updatedData)
    setFilteredData(updatedData)
    
    setUndoStack([...undoStack, {
      action: 'paste_rows',
      sheet: currentSheet,
      insertIndex,
      count: copiedRows.length
    }])
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    
    const lastAction = undoStack[undoStack.length - 1]
    const sheet = { ...allData[currentSheet] }
    
    if (lastAction.action === 'cell_edit') {
      sheet.data[lastAction.rowIndex][lastAction.cellIndex] = lastAction.oldValue
    } else if (lastAction.action === 'add_row') {
      sheet.data.splice(lastAction.rowIndex, 1)
    } else if (lastAction.action === 'delete_rows') {
      lastAction.deletedRows.forEach(({ index, data }) => {
        sheet.data.splice(index, 0, data)
      })
    } else if (lastAction.action === 'paste_rows') {
      for (let i = 0; i < lastAction.count; i++) {
        sheet.data.splice(lastAction.insertIndex, 1)
      }
    }
    
    const updatedData = {
      ...allData,
      [currentSheet]: sheet
    }
    
    setAllData(updatedData)
    setFilteredData(updatedData)
    setUndoStack(undoStack.slice(0, -1))
  }

  const getStats = () => {
    const displayData = getDisplayData()
    const data = displayData[currentSheet] || { columns: [], data: [] }
    return {
      totalRows: data.data.length,
      totalCols: data.columns.length,
      currentSheet: currentSheet || '-'
    }
  }

  return (
    <div className="app">
      <div className="sidebar">
        <EditToggle editMode={editMode} onToggle={handleEditModeToggle} />
        <Tabs 
          sheets={Object.keys(allData)} 
          currentSheet={currentSheet}
          onSheetChange={handleSheetChange}
        />
      </div>
      <div className="container">
        <Header />
        <Stats stats={getStats()} />
        <div style={{ display: 'flex', gap: '15px', padding: '20px', alignItems: 'center' }}>
          <SearchBox value={searchTerm} onChange={handleSearchChange} />
          {hasUnsavedChanges && (
            <div style={{ 
              padding: '8px 15px', 
              background: '#fff3cd', 
              border: '1px solid #ffc107', 
              borderRadius: '4px',
              color: '#856404',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ⚠️ 有未保存的更改
            </div>
          )}
        </div>
        {editMode && (
          <div style={{ padding: '0 20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <EditToolbar
              onAddRow={handleAddRow}
              onDeleteRows={handleDeleteRows}
              onCopyRows={handleCopyRows}
              onPasteRows={handlePasteRows}
              onUndo={handleUndo}
              canDelete={selectedRows.size > 0}
              canCopy={selectedRows.size > 0}
              canUndo={undoStack.length > 0}
            />
            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
              <button 
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: hasUnsavedChanges ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                💾 Save
              </button>
              <button 
                onClick={handleCancelChanges}
                disabled={!hasUnsavedChanges}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: hasUnsavedChanges ? '#dc3545' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="loading">正在加载数据...</div>
        ) : (
          <TableView
            data={getDisplayData()[currentSheet]}
            editMode={editMode}
            onCellEdit={handleCellEdit}
            selectedRows={selectedRows}
            onRowSelect={handleRowSelect}
          />
        )}
      </div>
    </div>
  )
}

export default App
