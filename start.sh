#!/bin/bash
# 简单的启动脚本

echo "正在检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3，请先安装Python3"
    exit 1
fi

echo "正在检查依赖..."
if ! python3 -c "import flask" 2>/dev/null; then
    echo "📦 正在安装依赖包..."
    pip3 install -r requirements.txt
fi

echo ""
echo "🚀 启动Web应用..."
echo ""

python3 web_app.py

