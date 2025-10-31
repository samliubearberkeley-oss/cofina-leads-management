#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Web应用：展示5个表格数据，从CSV文件读取
"""

import os
import json
import numpy as np
import pandas as pd
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

# 检查是否存在 dist 目录（React 构建后的文件）
dist_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')
if os.path.exists(dist_path):
    # 生产模式：服务构建后的 React 文件
    app = Flask(__name__, static_folder='dist', static_url_path='')
else:
    # 开发模式：只提供 API 服务
    app = Flask(__name__)
    
CORS(app)  # 允许跨域请求

# 数据存储文件（用于保存accepted状态和编辑的数据）
DATA_STORAGE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data_storage.json')

# 定义文件路径
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_files = {
    "a16z-gaming": "leads - a16z-gaming.csv",
    "recent raised series B": "leads - recent raised series B (2).csv",
    "Seed Stage VC": "leads - Seed Stage VC (1).csv",
    "Series A": "leads - Series A (1).csv",
    "Series Seed": "leads - Series Seed (2).csv",
    "LinkedIn Contacts": "leads - LinkedIn Contacts.csv"
}

def load_storage():
    """加载存储的数据（accepted状态、编辑的数据等）"""
    if os.path.exists(DATA_STORAGE_FILE):
        try:
            with open(DATA_STORAGE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading storage: {e}")
            return {}
    return {}

def save_storage(storage_data):
    """保存存储的数据"""
    try:
        with open(DATA_STORAGE_FILE, 'w', encoding='utf-8') as f:
            json.dump(storage_data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving storage: {e}")
        return False

def load_data():
    """从CSV文件加载所有数据"""
    data = {}
    storage = load_storage()
    
    for sheet_name, csv_file in csv_files.items():
        csv_path = os.path.join(base_dir, csv_file)
        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path)
                # 添加"是否通过linked申请?"列到开头
                df.insert(0, "是否通过linked申请?", "")
                # 添加"linkedin accepted?"列（checkbox列）
                df.insert(1, "linkedin accepted?", "")
                # 添加"Accepted"列（如果不存在）
                if "Accepted" not in df.columns:
                    df.insert(2, "Accepted", "")
                
                # 将NaN值替换为None，以便JSON序列化
                df = df.replace({np.nan: None})
                # 转换为列表
                data_list = df.values.tolist()
                # 额外处理：确保所有NaN都被转换为None
                data_list = [[None if pd.isna(val) else val for val in row] for row in data_list]
                
                # 应用存储的数据（编辑和accepted状态）
                sheet_key = sheet_name
                if sheet_key in storage:
                    stored_data = storage[sheet_key]
                    # 应用编辑的数据
                    if 'edited_data' in stored_data:
                        for row_idx, row_data in stored_data['edited_data'].items():
                            row_idx = int(row_idx)
                            if row_idx < len(data_list):
                                for col_idx, value in row_data.items():
                                    col_idx = int(col_idx)
                                    if col_idx < len(data_list[row_idx]):
                                        data_list[row_idx][col_idx] = value
                    # 应用linkedin accepted状态
                    if 'linkedin_accepted' in stored_data:
                        linkedin_accepted_col_idx = df.columns.get_loc("linkedin accepted?") if "linkedin accepted?" in df.columns else -1
                        if linkedin_accepted_col_idx >= 0:
                            for row_idx, is_accepted in stored_data['linkedin_accepted'].items():
                                row_idx = int(row_idx)
                                if row_idx < len(data_list) and linkedin_accepted_col_idx < len(data_list[row_idx]):
                                    data_list[row_idx][linkedin_accepted_col_idx] = "✓" if is_accepted else ""
                    # 应用accepted状态
                    if 'accepted' in stored_data:
                        accepted_col_idx = df.columns.get_loc("Accepted") if "Accepted" in df.columns else -1
                        if accepted_col_idx >= 0:
                            for row_idx, is_accepted in stored_data['accepted'].items():
                                row_idx = int(row_idx)
                                if row_idx < len(data_list) and accepted_col_idx < len(data_list[row_idx]):
                                    data_list[row_idx][accepted_col_idx] = "✓" if is_accepted else ""
                
                data[sheet_name] = {
                    'columns': df.columns.tolist(),
                    'data': data_list
                }
            except Exception as e:
                print(f"Error loading {csv_file}: {e}")
                data[sheet_name] = {'columns': [], 'data': []}
        else:
            print(f"File not found: {csv_path}")
            data[sheet_name] = {'columns': [], 'data': []}
    return data

@app.route('/')
def index():
    """首页"""
    if os.path.exists(dist_path):
        # 生产模式：返回构建后的 React 应用
        return send_from_directory('dist', 'index.html')
    else:
        # 开发模式：提示使用 Vite 开发服务器
        return jsonify({
            'message': '请使用 React + Vite 开发服务器访问前端',
            'dev_server': 'http://localhost:3000',
            'api_endpoint': 'http://127.0.0.1:5005/api/data'
        })

@app.route('/api/data')
def api_data():
    """API: 返回所有数据"""
    try:
        data = load_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/save', methods=['POST'])
def api_save():
    """API: 保存编辑的数据和accepted状态"""
    try:
        storage = load_storage()
        request_data = request.get_json()
        
        sheet_name = request_data.get('sheet_name')
        edited_data = request_data.get('edited_data', {})
        accepted = request_data.get('accepted', {})
        linkedin_accepted = request_data.get('linkedin_accepted', {})
        
        if sheet_name:
            if sheet_name not in storage:
                storage[sheet_name] = {}
            
            if edited_data:
                storage[sheet_name]['edited_data'] = edited_data
            if accepted:
                storage[sheet_name]['accepted'] = accepted
            if linkedin_accepted:
                storage[sheet_name]['linkedin_accepted'] = linkedin_accepted
            
            if save_storage(storage):
                return jsonify({'status': 'success', 'message': '数据已保存'})
            else:
                return jsonify({'status': 'error', 'message': '保存失败'}), 500
        else:
            return jsonify({'status': 'error', 'message': '缺少sheet_name参数'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    import socket
    
    # 检查端口是否可用
    def is_port_available(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return True
            except OSError:
                return False
    
    # 尝试不同的端口，优先使用5005
    port = 5005
    if not is_port_available(port):
        port = 5000
        for try_port in range(5000, 5010):
            if is_port_available(try_port):
                port = try_port
                break
    
    print("=" * 60)
    print("🚀 Web应用启动中...")
    print("=" * 60)
    print(f"📂 数据源: CSV文件")
    print(f"📊 表格数量: {len(csv_files)}")
    print("=" * 60)
    print(f"🌐 访问地址: http://127.0.0.1:{port}")
    print(f"🌐 或者访问: http://localhost:{port}")
    print("=" * 60)
    print("💡 提示: 如果无法访问，请尝试使用 localhost 而不是 127.0.0.1")
    print("=" * 60)
    app.run(debug=True, host='127.0.0.1', port=port, threaded=True)
