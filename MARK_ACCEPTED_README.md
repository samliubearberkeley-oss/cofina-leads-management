# 批量标记LinkedIn链接为Accepted - 使用说明

## 方法一：使用HTML工具页面（推荐）

1. 在浏览器中打开应用的主页面（例如：`http://localhost:5173` 或您的实际地址）
2. 在同一个浏览器中打开 `mark_accepted.html` 文件
3. 点击"开始标记"按钮
4. 等待处理完成
5. 刷新主应用页面以查看更新

## 方法二：在浏览器控制台运行脚本

1. 打开主应用页面
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. 复制 `mark_accepted.js` 文件的内容
5. 粘贴到控制台并回车执行

## 需要标记的链接列表

- Series A: 13个链接
- Series Seed: 23个链接  
- Seed Stage VC: 28个链接
- recent raised series B: 10个链接

总共：74个LinkedIn链接

## 注意事项

- 确保在主应用的同一域名下运行此工具
- 标记后的数据会保存在浏览器的 localStorage 中
- 刷新主应用页面后，对应的 checkbox 会自动打勾
- 如果某个链接在CSV文件中找不到，该链接会被跳过

