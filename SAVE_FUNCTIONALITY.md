# Save/Cancel 功能说明

## 功能概述

现在编辑模式有**暂存编辑**功能：
- ✅ 点击checkbox会变黑（选中）或变白（未选中）
- ✅ 所有编辑（checkbox、文字）都暂存，不立即保存
- ✅ 必须点击 **Save 按钮**才真正保存
- ✅ 点击 **Cancel 按钮**取消所有未保存的编辑
- ✅ 显示**未保存更改提示**

## 用户操作流程

### 1. 编辑数据（暂存）
```
1. 启用编辑模式
2. 点击checkbox → 变黑✓（已暂存，未保存）
3. 编辑单元格文字 → 文字改变（已暂存，未保存）
4. 顶部显示：⚠️ 有未保存的更改
5. Save和Cancel按钮变为可用（绿色和红色）
```

### 2. 保存编辑
```
1. 点击 💾 Save 按钮
2. 所有暂存的编辑应用到数据
3. Checkbox选中的项目同步到LinkedIn Accepted
4. 数据自动排序（选中的排在前面）
5. 保存到localStorage
6. 提示消失，按钮变灰
```

### 3. 取消编辑
```
1. 点击 ❌ Cancel 按钮
2. 所有暂存的编辑被丢弃
3. 表格恢复到上次保存的状态
4. 提示消失，按钮变灰
```

## 技术实现

### State管理
```javascript
const [pendingChanges, setPendingChanges] = useState({})
// 格式: { sheetName: { rowIndex: { cellIndex: newValue } } }

const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
```

### handleCellEdit - 只暂存
```javascript
const handleCellEdit = (rowIndex, cellIndex, newValue) => {
  // 不立即更新allData，只更新pendingChanges
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
```

### handleSaveChanges - 应用所有更改
```javascript
const handleSaveChanges = () => {
  // 1. 遍历所有pendingChanges
  for (const sheetName in pendingChanges) {
    for (const rowIndex in sheetChanges) {
      for (const cellIndex in rowChanges) {
        // 应用更改到allData
        newData[actualRowIndex][actualCellIndex] = newValue
        
        // 如果是checkbox，同步到LinkedIn Accepted
        if (actualCellIndex === 0) {
          syncToLinkedInAccepted(linkedInUrl, newValue === '✓')
        }
        
        // 保存到localStorage
        saveDataToBackend(...)
      }
    }
    
    // 如果有checkbox变更，重新排序
    if (hasCheckboxChanges) {
      sortDataByLinkedInAccepted(sheetName)
    }
  }
  
  // 2. 清空pendingChanges
  setPendingChanges({})
  setHasUnsavedChanges(false)
}
```

### handleCancelChanges - 丢弃所有更改
```javascript
const handleCancelChanges = () => {
  setPendingChanges({})
  setHasUnsavedChanges(false)
  setFilteredData({ ...filteredData }) // 强制重新渲染
}
```

### getDisplayData - 显示包含pending的数据
```javascript
const getDisplayData = () => {
  if (Object.keys(pendingChanges).length === 0) {
    return filteredData // 没有pending changes，直接返回原数据
  }
  
  // 复制filteredData
  const displayData = JSON.parse(JSON.stringify(filteredData))
  
  // 应用所有pendingChanges（仅用于显示）
  for (const sheetName in pendingChanges) {
    for (const rowIndex in sheetChanges) {
      for (const cellIndex in rowChanges) {
        displayData[sheetName].data[actualRowIndex][actualCellIndex] = newValue
      }
    }
  }
  
  return displayData
}
```

## UI组件

### 未保存更改提示
```jsx
{hasUnsavedChanges && (
  <div style={{ 
    background: '#fff3cd', 
    border: '1px solid #ffc107', 
    color: '#856404'
  }}>
    ⚠️ 有未保存的更改
  </div>
)}
```

### Save按钮
```jsx
<button 
  onClick={handleSaveChanges}
  disabled={!hasUnsavedChanges}
  style={{
    backgroundColor: hasUnsavedChanges ? '#28a745' : '#ccc',
    cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed'
  }}
>
  💾 Save
</button>
```

### Cancel按钮
```jsx
<button 
  onClick={handleCancelChanges}
  disabled={!hasUnsavedChanges}
  style={{
    backgroundColor: hasUnsavedChanges ? '#dc3545' : '#ccc',
    cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed'
  }}
>
  ❌ Cancel
</button>
```

## 测试步骤

### 测试1: Checkbox编辑和保存
```
1. 刷新浏览器 (http://localhost:3002/)
2. 切换到 Series A sheet
3. 启用编辑模式
4. 点击第一行checkbox → 应该变黑✓
5. 查看：
   - 顶部显示 "⚠️ 有未保存的更改"
   - Save和Cancel按钮变为绿色和红色
   - 控制台显示: 💡 Change added to pending (not saved yet)
6. 点击Save按钮
7. 查看：
   - 控制台显示: 💾 Saving all pending changes...
   - 控制台显示: ✅ All changes saved!
   - 提示消失
   - 按钮变灰
   - Checkbox仍然是✓
8. 切换到 LinkedIn Accepted sheet
9. 验证: 该行已添加到LinkedIn Accepted
```

### 测试2: 取消编辑
```
1. 在 Series A sheet 中点击一个未选中的checkbox → 变黑✓
2. 点击另一个checkbox → 也变黑✓
3. 编辑某个单元格的文字
4. 查看：顶部显示 "⚠️ 有未保存的更改"
5. 点击 Cancel 按钮
6. 查看：
   - 所有checkbox恢复原状（✓消失）
   - 文字恢复原内容
   - 提示消失
   - 按钮变灰
   - 控制台显示: ❌ Canceling all pending changes...
```

### 测试3: 多次编辑后保存
```
1. 选中3个checkbox
2. 编辑2个单元格
3. 取消选中1个checkbox
4. 再选中1个新的checkbox
5. 查看：提示显示 "⚠️ 有未保存的更改"
6. 点击Save
7. 验证：
   - 所有更改都已应用
   - LinkedIn Accepted正确同步
   - 数据正确排序
```

### 测试4: 切换sheet不丢失pending
```
1. 在 Series A sheet 选中checkbox（不保存）
2. 切换到 Seed Stage VC sheet
3. 选中另一个checkbox（不保存）
4. 查看：提示仍显示 "⚠️ 有未保存的更改"
5. 点击Save
6. 切换回Series A：checkbox仍然✓
7. 切换到Seed Stage VC：checkbox仍然✓
8. 切换到LinkedIn Accepted：两个URL都已添加
```

## 控制台日志示例

### 编辑时（暂存）:
```
📝 handleCellEdit (pending): row=0, cell=0, newValue="✓", sheet="Series A"
💡 Change added to pending (not saved yet)
```

### 保存时:
```
💾 Saving all pending changes...
  Applying: sheet="Series A", row=0, cell=0, "" -> "✓"
🔗 Syncing to LinkedIn Accepted: url="https://...", isAccepted=true
➕ Added to localStorage: https://...
💾 LinkedIn Accepted URLs count: 1
➕ Added row to LinkedIn Accepted sheet: https://...
✅ LinkedIn Accepted sheet updated
🔄 Sorting sheet "Series A"
✅ All changes saved!
```

### 取消时:
```
❌ Canceling all pending changes...
```

## 预期行为

| 操作 | 立即效果 | 点击Save后 | 点击Cancel后 |
|------|---------|-----------|-------------|
| 选中checkbox | 显示✓（暂存） | 真正保存，同步到LinkedIn Accepted | ✓消失，恢复原状 |
| 取消checkbox | ✓消失（暂存） | 真正删除，从LinkedIn Accepted移除 | ✓重新显示，恢复原状 |
| 编辑文字 | 文字改变（暂存） | 真正保存到localStorage | 文字恢复原内容 |
| 切换sheet | pending保留 | 应用到所有sheets | 所有sheets恢复原状 |

## 相关文件
- `src/App.jsx` - 主要逻辑
- `CHECKBOX_FIXES_SUMMARY.md` - Checkbox修复
- `EDIT_MODE_IMPROVEMENTS.md` - Edit模式改进
- `LINKEDIN_ACCEPTED_SYNC.md` - LinkedIn Accepted同步
