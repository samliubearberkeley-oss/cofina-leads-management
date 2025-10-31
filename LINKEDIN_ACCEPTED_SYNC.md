# LinkedIn Accepted 同步功能

## 功能说明

当在任何sheet（如Series A、Seed Stage VC等）选中或取消选中checkbox时，自动同步到：
1. **localStorage** - `linkedin_accepted_urls` 数组
2. **LinkedIn Accepted sheet** - 添加或删除对应的行

## 工作流程

### 选中Checkbox（✓）
```
1. 用户在Series A sheet中点击checkbox
2. Checkbox变为 ✓
3. 获取该行的LinkedIn URL
4. 同步到localStorage:
   - 将URL添加到 linkedin_accepted_urls 数组
5. 同步到LinkedIn Accepted sheet:
   - 查找该URL是否已存在
   - 如果不存在，从原始sheet复制完整行数据，添加到LinkedIn Accepted
   - 如果已存在，确保其checkbox列为 ✓
6. 当前sheet数据重新排序（已选中的排在前面）
```

### 取消选中Checkbox（空）
```
1. 用户在Series A sheet中再次点击checkbox
2. Checkbox变为空
3. 获取该行的LinkedIn URL
4. 从localStorage删除:
   - 从 linkedin_accepted_urls 数组中移除该URL
5. 从LinkedIn Accepted sheet删除:
   - 查找并删除该URL对应的整行
6. 当前sheet数据重新排序（未选中的排在后面）
```

## 代码实现

### 1. handleCellEdit 修改 (App.jsx)
```javascript
// 如果修改了linkedin accepted（第0列），同步到LinkedIn Accepted sheet和localStorage
if (cellIndex === 0 && currentSheet !== "LinkedIn Accepted") {
  // 获取该行的LinkedIn URL
  const linkedInColIndex = sheet.columns.findIndex(col => 
    col.toLowerCase().includes('linkedin') && 
    !col.toLowerCase().includes('accepted') && 
    !col.toLowerCase().includes('request')
  )
  
  if (linkedInColIndex >= 0) {
    const linkedInUrl = newData[actualRowIndex][linkedInColIndex]
    
    if (linkedInUrl) {
      // 同步到LinkedIn Accepted sheet和localStorage
      syncToLinkedInAccepted(linkedInUrl, newValue === '✓')
    }
  }
  
  // 排序数据
  sortDataByLinkedInAccepted(currentSheet)
}
```

### 2. syncToLinkedInAccepted 函数 (App.jsx)
```javascript
const syncToLinkedInAccepted = (linkedInUrl, isAccepted) => {
  // 1. 更新localStorage
  let acceptedUrls = JSON.parse(localStorage.getItem('linkedin_accepted_urls') || '[]')
  
  if (isAccepted) {
    if (!acceptedUrls.includes(linkedInUrl)) {
      acceptedUrls.push(linkedInUrl)
    }
  } else {
    acceptedUrls = acceptedUrls.filter(url => url !== linkedInUrl)
  }
  
  localStorage.setItem('linkedin_accepted_urls', JSON.stringify(acceptedUrls))
  
  // 2. 同步到LinkedIn Accepted sheet
  const linkedInAcceptedSheet = allData['LinkedIn Accepted']
  
  if (isAccepted) {
    // 添加行或更新
    const existingRowIndex = linkedInAcceptedSheet.data.findIndex(row => 
      row[urlColIndex] === linkedInUrl
    )
    
    if (existingRowIndex === -1) {
      // 从源sheet复制完整行数据
      const sourceRow = findSourceRow(linkedInUrl)
      const newRow = mapRowToLinkedInAccepted(sourceRow)
      linkedInAcceptedSheet.data.push(newRow)
    } else {
      // 更新现有行的checkbox
      linkedInAcceptedSheet.data[existingRowIndex][0] = '✓'
    }
  } else {
    // 删除行
    linkedInAcceptedSheet.data = linkedInAcceptedSheet.data.filter(row => 
      row[urlColIndex] !== linkedInUrl
    )
  }
  
  // 3. 更新React state
  setAllData(updatedData)
  setFilteredData(updatedData)
}
```

## 测试步骤

### 测试1: 选中checkbox同步
```
1. 刷新浏览器 (http://localhost:3002/)
2. 切换到 Series A sheet
3. 启用编辑模式
4. 选中第一行的checkbox
5. 查看控制台日志:
   🔗 Syncing to LinkedIn Accepted: url="...", isAccepted=true
   ➕ Added to localStorage: ...
   💾 LinkedIn Accepted URLs count: X
   ➕ Added row to LinkedIn Accepted sheet: ...
   ✅ LinkedIn Accepted sheet updated
6. 切换到 LinkedIn Accepted sheet
7. 验证: 应该看到新添加的行，checkbox列显示 ✓
```

### 测试2: 取消选中同步
```
1. 在 Series A sheet 中取消选中刚才选中的checkbox
2. 查看控制台日志:
   🔗 Syncing to LinkedIn Accepted: url="...", isAccepted=false
   ➖ Removed from localStorage: ...
   💾 LinkedIn Accepted URLs count: X
   ➖ Removed row from LinkedIn Accepted sheet: ...
   ✅ LinkedIn Accepted sheet updated
3. 切换到 LinkedIn Accepted sheet
4. 验证: 该行应该已被删除
```

### 测试3: 跨sheet同步
```
1. 在 Series A sheet 选中一个checkbox
2. 切换到 LinkedIn Accepted sheet，验证已添加
3. 切换到 Seed Stage VC sheet
4. 如果该LinkedIn URL也存在于此sheet，其checkbox应该也显示 ✓
5. 在任一sheet取消选中
6. 验证所有sheet和LinkedIn Accepted都同步更新
```

### 测试4: localStorage持久化
```
1. 选中几个checkbox
2. 刷新浏览器
3. 验证:
   - 已选中的checkbox仍然显示 ✓
   - LinkedIn Accepted sheet仍然包含这些行
   - 控制台显示从localStorage加载的数据
```

## 预期行为

| 操作 | localStorage | LinkedIn Accepted Sheet | 当前Sheet |
|------|--------------|------------------------|-----------|
| 选中checkbox | 添加URL | 添加行 | 标记✓，排序到顶部 |
| 取消选中 | 删除URL | 删除行 | 清空✓，排序到底部 |
| 刷新浏览器 | 保持 | 根据localStorage重建 | 根据localStorage标记 |

## 控制台日志示例

### 选中时:
```
📝 handleCellEdit: row=0, cell=0, newValue="✓", sheet="Series A"
💾 Updating cell: actualRow=0, cell=0, oldValue="", newValue="✓"
🔄 Checkbox changed (newValue="✓"), syncing to LinkedIn Accepted
🔗 Syncing to LinkedIn Accepted: url="https://www.linkedin.com/in/test", isAccepted=true
➕ Added to localStorage: https://www.linkedin.com/in/test
💾 LinkedIn Accepted URLs count: 1
➕ Added row to LinkedIn Accepted sheet: https://www.linkedin.com/in/test
✅ LinkedIn Accepted sheet updated
🔄 Sorting sheet "Series A", original data length: 10
```

### 取消选中时:
```
📝 handleCellEdit: row=0, cell=0, newValue="", sheet="Series A"
💾 Updating cell: actualRow=0, cell=0, oldValue="✓", newValue=""
🔄 Checkbox changed (newValue=""), syncing to LinkedIn Accepted
🔗 Syncing to LinkedIn Accepted: url="https://www.linkedin.com/in/test", isAccepted=false
➖ Removed from localStorage: https://www.linkedin.com/in/test
💾 LinkedIn Accepted URLs count: 0
➖ Removed row from LinkedIn Accepted sheet: https://www.linkedin.com/in/test
✅ LinkedIn Accepted sheet updated
🔄 Sorting sheet "Series A", original data length: 10
```

## 相关文件
- `src/App.jsx` - 主要逻辑（syncToLinkedInAccepted函数）
- `src/services/api.js` - localStorage读写
- `CHECKBOX_FIXES_SUMMARY.md` - Checkbox修复说明
- `EDIT_MODE_IMPROVEMENTS.md` - Edit模式改进说明
