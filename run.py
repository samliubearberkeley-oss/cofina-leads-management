#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化的启动脚本 - 确保应用正确启动
"""

import sys
import os

# 切换到脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# 确保依赖已安装
try:
    from flask_cors import CORS
except ImportError:
    print("正在安装 flask-cors...")
    os.system(f"{sys.executable} -m pip install flask-cors")
    from flask_cors import CORS

# 导入主应用
print("\n" + "=" * 60)
print("正在启动Web应用...")
print("=" * 60 + "\n")

# 直接导入并运行
if __name__ == '__main__':
    import web_app

