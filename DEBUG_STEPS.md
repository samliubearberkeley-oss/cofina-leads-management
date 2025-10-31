# 调试步骤

## 问题：编辑模式下无法取消选择行

## 调试步骤

### 1. 确认编辑模式已启用
- 打开 http://localhost:3002/
- 打开浏览器控制台（F12）
- 点击左侧的 "Edit Mode" 复选框
- **应该看到控制台输出**：
  ```
  ===== 编辑模式切换 =====
  当前编辑模式: false
  新编辑模式: true
  编辑模式已设置为: true
  ```
- 如果没看到这些日志，说明 React 应用有问题，需要重新构建

### 2. 测试点击行
- 确保编辑模式已启用（Edit Mode 复选框已勾选）
- 点击表格中的任意一行（例如点击 Company Name 列的单元格）
- **应该看到控制台输出**：
  ```
  TD contentEditable onMouseDown: {rowIndex: 0, cellIndex: 2, detail: 1}
  阻止 contentEditable 获得焦点
  TR onMouseDown 触发: 0
  handleRowMouseDown 被调用: {rowIndex: 0, targetTag: "TD", cellClass: "...", detail: 1}
  调用 onRowSelect: {rowIndex: 0, modifierPressed: false, shiftPressed: false}
  handleRowSelect 被调用: {rowIndex: 0, modifierPressed: false, shiftPressed: false, currentlySelected: [], isRowSelected: false}
  普通点击，选择: 0
  更新后的选择: [0]
  ```
- 行应该被高亮选中

### 3. 测试取消选择
- 再次点击同一行
- **应该看到控制台输出**：
  ```
  TD contentEditable onMouseDown: {rowIndex: 0, cellIndex: 2, detail: 1}
  阻止 contentEditable 获得焦点
  TR onMouseDown 触发: 0
  handleRowMouseDown 被调用: {rowIndex: 0, targetTag: "TD", cellClass: "...", detail: 1}
  调用 onRowSelect: {rowIndex: 0, modifierPressed: false, shiftPressed: false}
  handleRowSelect 被调用: {rowIndex: 0, modifierPressed: false, shiftPressed: false, currentlySelected: [0], isRowSelected: true}
  普通点击，取消选择: 0
  更新后的选择: []
  ```
- 行的高亮应该消失

## 如果没有看到这些日志

### 情况 A：点击编辑模式复选框后没有日志
- **原因**：React 应用没有正确加载或构建
- **解决**：
  ```bash
  cd /Users/liujiekun/Desktop/cofina表格
  npm run build
  # 或者如果使用开发模式
  npm start
  ```

### 情况 B：点击行后没有日志
- **原因**：事件处理器没有绑定或被阻止
- **需要的信息**：
  1. 编辑模式是否启用（Edit Mode 复选框是否勾选）
  2. 点击的是哪个单元格（checkbox、行选择器圆圈、还是普通单元格）
  3. 是否看到行被高亮选中

### 情况 C：看到部分日志但功能不工作
- **需要的信息**：具体看到了哪些日志，缺少哪些日志

## 当前状态报告模板

请按照以下格式提供信息：

```
1. 点击 "Edit Mode" 复选框后的控制台日志：
   [粘贴日志]

2. 编辑模式是否启用（复选框是否勾选）：
   [是/否]

3. 点击表格中的单元格后的控制台日志：
   [粘贴日志]

4. 行是否被高亮选中：
   [是/否]

5. 再次点击同一行后的控制台日志：
   [粘贴日志]

6. 行的高亮是否消失：
   [是/否]
```

