#!/bin/bash
# 启动 React + Vite 前端和 Flask 后端

echo "=========================================="
echo "🚀 启动 Cofina 表格应用"
echo "=========================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3"
    exit 1
fi

cd "$(dirname "$0")"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 清理旧进程
echo "🧹 清理旧进程..."
pkill -f "python.*web_app.py" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# 启动 Flask 后端
echo "🔧 启动 Flask 后端..."
python3 web_app.py > /tmp/flask_backend.log 2>&1 &
FLASK_PID=$!
sleep 2

# 检查后端是否启动成功
if ! ps -p $FLASK_PID > /dev/null; then
    echo "❌ Flask 后端启动失败，查看日志: /tmp/flask_backend.log"
    exit 1
fi

echo "✅ Flask 后端已启动 (PID: $FLASK_PID)"

# 启动 Vite 前端
echo "⚡ 启动 Vite 前端..."
npm run dev &
VITE_PID=$!

echo "=========================================="
echo "✅ 应用已启动！"
echo "=========================================="
echo "🌐 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://127.0.0.1:5005"
echo "=========================================="
echo "💡 按 Ctrl+C 停止所有服务"
echo "=========================================="

# 等待用户中断
trap "echo ''; echo '正在停止服务...'; kill $FLASK_PID $VITE_PID 2>/dev/null; exit" INT TERM

wait

