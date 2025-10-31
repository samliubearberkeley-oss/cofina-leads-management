// Checkbox问题分析

// 问题：checkbox无法取消选择

// 当前代码流程：
// 1. checkbox的checked状态由cellValue决定
// 2. 用户点击checkbox
// 3. onChange触发，调用onCellEdit
// 4. handleCellEdit更新allData和filteredData
// 5. React重新渲染，checkbox状态应该更新

// 可能的问题：
// 1. checkbox的checked状态更新延迟
// 2. 事件被阻止
// 3. 数据更新后排序导致行索引变化

