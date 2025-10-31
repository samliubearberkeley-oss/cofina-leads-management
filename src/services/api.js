import Papa from 'papaparse'

// CSV 文件映射
const csvFiles = {
  "LinkedIn Accepted": "/leads - LinkedIn Accepted.csv",
  "a16z-gaming": "/leads - a16z-gaming.csv",
  "recent raised series B": "/leads - recent raised series B (2).csv",
  "Seed Stage VC": "/leads - Seed Stage VC (1).csv",
  "Series A": "/leads - Series A (1).csv",
  "Series Seed": "/leads - Series Seed (2).csv"
}

// 从localStorage加载保存的数据
const loadStorage = () => {
  try {
    const stored = localStorage.getItem('cofina_data_storage')
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('加载存储数据失败:', error)
    return {}
  }
}

// 保存数据到localStorage
const saveStorage = (data) => {
  try {
    localStorage.setItem('cofina_data_storage', JSON.stringify(data))
    return true
  } catch (error) {
    console.error('保存数据失败:', error)
    return false
  }
}

// 标准化 LinkedIn URL（用于匹配）
const normalizeLinkedInUrl = (url) => {
  if (!url) return ''
  const urlStr = String(url).trim()
  if (!urlStr.startsWith('http')) return ''
  
  // 移除查询参数和锚点
  try {
    const urlObj = new URL(urlStr)
    return urlObj.origin + urlObj.pathname
  } catch {
    // 如果 URL 解析失败，尝试简单处理
    return urlStr.split('?')[0].split('#')[0]
  }
}

// 读取CSV文件
const readCSV = async (filename) => {
  try {
    const response = await fetch(filename)
    if (!response.ok) {
      throw new Error(`无法读取文件: ${filename}`)
    }
    const text = await response.text()
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results)
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  } catch (error) {
    console.error(`读取CSV文件失败 ${filename}:`, error)
    throw error
  }
}

// 从CSV文件加载所有数据
export const fetchData = async () => {
  try {
    const storage = loadStorage()
    const allData = {}
    
    for (const [sheetName, csvPath] of Object.entries(csvFiles)) {
      try {
        const result = await readCSV(csvPath)
        
        // 获取列名
        const columns = result.meta.fields || []
        
        // 对于 LinkedIn Accepted sheet，不需要添加额外的列
        const isLinkedInAccepted = sheetName === "LinkedIn Accepted"
        
        // 添加额外的列（除了 LinkedIn Accepted）- 只保留 linkedin accepted?，移除"是否通过linked申请?"
        const extendedColumns = isLinkedInAccepted
          ? columns
          : [
              "linkedin accepted?",
              "Accepted",
              ...columns
            ]
        
        // 转换为数据数组
        const data = result.data.map(row => {
          if (isLinkedInAccepted) {
            // LinkedIn Accepted sheet: 直接使用原始列
            return columns.map(col => row[col] || '')
          } else {
            // 其他sheet: 添加额外的列（2个：linkedin accepted? 和 Accepted）
            const rowArray = ['', '', ...columns.map(col => row[col] || '')]
            return rowArray
          }
        })
        
        // 应用存储的数据
        if (storage[sheetName]) {
          const stored = storage[sheetName]
          
          // 应用编辑的数据
          if (stored.edited_data) {
            Object.entries(stored.edited_data).forEach(([rowIdx, rowData]) => {
              const rowIndex = parseInt(rowIdx)
              if (rowIndex < data.length) {
                Object.entries(rowData).forEach(([colIdx, value]) => {
                  const colIndex = parseInt(colIdx)
                  if (colIndex < data[rowIndex].length) {
                    data[rowIndex][colIndex] = value
                  }
                })
              }
            })
          }
          
          // 应用accepted状态（第1列）
          if (stored.accepted) {
            const acceptedColIdx = 1
            Object.entries(stored.accepted).forEach(([rowIdx, isAccepted]) => {
              const rowIndex = parseInt(rowIdx)
              if (rowIndex < data.length) {
                data[rowIndex][acceptedColIdx] = isAccepted ? '✓' : ''
              }
            })
          }
          
          // 注意：linkedin accepted状态稍后在匹配后应用
        }
        
        allData[sheetName] = {
          columns: extendedColumns,
          data: data
        }
      } catch (error) {
        console.error(`加载 ${sheetName} 失败:`, error)
        allData[sheetName] = {
          columns: [],
          data: []
        }
      }
    }
    
    // 处理 LinkedIn Accepted sheet 的关联：在其他 sheet 中自动打钩
    // 注意：这必须在排序之前完成，因为需要使用原始行索引
    if (allData["LinkedIn Accepted"] && allData["LinkedIn Accepted"].data) {
      const linkedInAcceptedSheet = allData["LinkedIn Accepted"]
      const linkedInUrls = linkedInAcceptedSheet.data.map(row => {
        // LinkedIn URL 在第一列（LinkedIn列）
        const linkedInColIndex = linkedInAcceptedSheet.columns.indexOf('LinkedIn')
        return linkedInColIndex >= 0 ? (row[linkedInColIndex] || '') : (row[0] || '')
      }).filter(url => url && url.startsWith('http'))
      
      console.log('LinkedIn Accepted URLs:', linkedInUrls.length)
      
      // 遍历所有其他 sheet
      Object.keys(allData).forEach(sheetName => {
        if (sheetName === "LinkedIn Accepted") return
        
        const sheet = allData[sheetName]
        if (!sheet || !sheet.data || !sheet.columns) return
        
        // 找到所有 LinkedIn 列（可能叫 LinkedIn, CEO Linkedin, LinkedIn URL, COO/CFO Linkedin 等）
        const linkedInColIndices = []
        sheet.columns.forEach((col, idx) => {
          const lower = col.toLowerCase()
          if (lower.includes('linkedin') && !lower.includes('accepted') && !lower.includes('request')) {
            linkedInColIndices.push(idx)
          }
        })
        
        console.log(`Sheet ${sheetName} LinkedIn columns:`, linkedInColIndices.map(i => sheet.columns[i]))
        
        if (linkedInColIndices.length === 0) return
        
        let matchedCount = 0
        
        // 遍历 sheet 中的每一行（使用原始索引，排序之前）
        sheet.data.forEach((row, rowIndex) => {
          // 检查这一行的任何一个 LinkedIn 列是否匹配
          let isAccepted = false
          
          for (const linkedInColIndex of linkedInColIndices) {
            const rowLinkedIn = row[linkedInColIndex] || ''
            const normalizedRowLinkedIn = normalizeLinkedInUrl(rowLinkedIn)
            
            if (!normalizedRowLinkedIn) continue
            
            // 检查是否在 LinkedIn Accepted 列表中
            const matched = linkedInUrls.some(url => {
              const normalizedAcceptedLinkedIn = normalizeLinkedInUrl(url)
              if (normalizedRowLinkedIn === normalizedAcceptedLinkedIn) {
                console.log(`Match found: ${normalizedRowLinkedIn} in sheet ${sheetName} row ${rowIndex}`)
                return true
              }
              return false
            })
            
            if (matched) {
              isAccepted = true
              matchedCount++
              break
            }
          }
          
          if (isAccepted) {
            // 更新存储（使用原始行索引）
            if (!storage[sheetName]) {
              storage[sheetName] = {}
            }
            if (!storage[sheetName].linkedin_accepted) {
              storage[sheetName].linkedin_accepted = {}
            }
            storage[sheetName].linkedin_accepted[rowIndex] = true
          }
        })
        
        console.log(`Sheet ${sheetName}: ${matchedCount} rows matched`)
      })
      
      // 保存更新后的存储
      saveStorage(storage)
    }
    
    // 应用存储的 linkedin_accepted 状态（包括匹配的和用户手动修改的）
    // 使用原始行索引，排序之前应用
    Object.keys(allData).forEach(sheetName => {
      if (sheetName === "LinkedIn Accepted") return
      
      const sheet = allData[sheetName]
      if (!sheet || !sheet.data) return
      
      if (storage[sheetName] && storage[sheetName].linkedin_accepted) {
        const stored = storage[sheetName]
        Object.entries(stored.linkedin_accepted).forEach(([rowIdx, isAccepted]) => {
          const rowIndex = parseInt(rowIdx)
          if (rowIndex < sheet.data.length) {
            sheet.data[rowIndex][0] = isAccepted ? '✓' : ''
          }
        })
      }
      
      // 重新排序（匹配和应用状态后）
      sheet.data.sort((a, b) => {
        const aAccepted = a[0] && (a[0] === '✓' || a[0] === '1' || String(a[0]).toLowerCase() === 'yes')
        const bAccepted = b[0] && (b[0] === '✓' || b[0] === '1' || String(b[0]).toLowerCase() === 'yes')
        if (aAccepted && !bAccepted) return -1
        if (!aAccepted && bAccepted) return 1
        return 0
      })
    })
    
    return allData
  } catch (error) {
    console.error('加载数据失败:', error)
    throw error
  }
}

// 保存数据到localStorage
export const saveData = async (sheetName, editedData, accepted, linkedinAccepted) => {
  try {
    const storage = loadStorage()
    
    if (!storage[sheetName]) {
      storage[sheetName] = {}
    }
    
    if (editedData && Object.keys(editedData).length > 0) {
      storage[sheetName].edited_data = editedData
    }
    
    if (accepted && Object.keys(accepted).length > 0) {
      storage[sheetName].accepted = accepted
    }
    
    if (linkedinAccepted && Object.keys(linkedinAccepted).length > 0) {
      storage[sheetName].linkedin_accepted = linkedinAccepted
    }
    
    if (saveStorage(storage)) {
      return { status: 'success', message: '数据已保存' }
    } else {
      throw new Error('保存失败')
    }
  } catch (error) {
    console.error('保存数据失败:', error)
    throw error
  }
}
