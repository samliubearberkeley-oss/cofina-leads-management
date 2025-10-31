# Leads数据管理系统

## 📋 功能说明

1. **Excel合并**: 将5个CSV文件合并到一个Excel文件中，每个CSV作为单独的sheet
2. **Web应用**: 动态展示5个表格，类似Excel的体验
3. **新列添加**: 每个表格最前面都添加了"是否通过linked申请?"列

## 📁 文件说明

- `merge_csvs_to_excel.py` - 合并CSV到Excel的脚本
- `web_app.py` - Web应用主程序
- `merged_leads.xlsx` - 合并后的Excel文件（自动生成）
- `requirements.txt` - Python依赖包

## 🚀 使用方法

### 1. 安装依赖

```bash
pip3 install -r requirements.txt
```

### 2. 生成Excel文件

```bash
python3 merge_csvs_to_excel.py
```

这将生成 `merged_leads.xlsx` 文件，包含5个sheet：
- a16z-gaming
- recent raised series B
- Seed Stage VC
- Series A
- Series Seed

### 3. 启动Web应用

**方法1: 使用启动脚本（推荐）**
```bash
./start.sh
```

**方法2: 直接运行Python**
```bash
python3 web_app.py
```

启动后，根据终端显示的地址访问，通常是：
- **http://127.0.0.1:5000** 或
- **http://localhost:5000**

⚠️ **如果遇到403错误**：
- 尝试使用 `localhost` 而不是 `127.0.0.1`
- 如果端口5000被占用，应用会自动使用5001-5009端口
- 确保终端显示的访问地址与浏览器地址一致

## ✨ Web应用功能

- ✅ 动态表格展示，类似Excel体验
- ✅ 5个表格切换浏览
- ✅ 实时搜索功能
- ✅ 统计信息显示（总行数、总列数）
- ✅ 响应式设计，支持滚动浏览
- ✅ 链接自动识别和点击
- ✅ 美观的UI界面

## 📊 表格说明

每个表格都包含：
- **是否通过linked申请?** (新增列，位于最前面)
- 原始CSV文件的所有列

## 🔧 技术栈

- Python 3
- Flask (Web框架)
- Pandas (数据处理)
- OpenPyXL (Excel操作)
- HTML/CSS/JavaScript (前端展示)

