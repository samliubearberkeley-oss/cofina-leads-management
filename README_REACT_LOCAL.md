# React + Vite 应用 - 本地CSV数据版本

## ✅ 已完成的功能

1. **直接从本地CSV文件读取数据** - 不需要后端API
2. **使用localStorage保存编辑** - 数据保存在浏览器本地
3. **完整编辑功能** - 编辑模式、圆圈选择器、添加/删除行等

## 🚀 使用方法

### 开发模式

```bash
# 只需要启动前端（不需要后端）
npm run dev
```

访问: http://localhost:3000

### 数据来源

- CSV文件位于 `public/` 目录
- 数据通过浏览器直接读取CSV文件
- 编辑的数据保存在浏览器 localStorage 中

### 功能说明

- ✅ 从CSV文件动态加载数据
- ✅ 编辑模式切换
- ✅ 圆圈行选择器
- ✅ 单元格编辑
- ✅ 添加/删除行
- ✅ 复制/粘贴行
- ✅ 撤销功能
- ✅ 搜索功能
- ✅ 数据自动保存到localStorage

## 📁 文件结构

```
public/
  ├── leads - a16z-gaming.csv
  ├── leads - Series A (1).csv
  ├── leads - Series Seed (2).csv
  ├── leads - Seed Stage VC (1).csv
  ├── leads - recent raised series B (2).csv
  └── leads - LinkedIn Contacts.csv

src/
  ├── services/
  │   └── api.js          # CSV读取和localStorage保存
  └── components/
      ├── TableView.jsx   # 表格组件（支持编辑）
      ├── EditToggle.jsx  # 编辑模式切换
      └── EditToolbar.jsx # 编辑工具栏
```

## 🔧 技术栈

- React 18
- Vite 5
- PapaParse (CSV解析)
- localStorage (数据持久化)

