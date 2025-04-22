# Mindful Words - 文字摘录插件

## 项目简介
Mindful Words 是一款简洁高效的浏览器扩展，帮助用户快速摘录网页上的文字内容并添加标签分类。

## 功能特点
- **一键保存**：选中网页文字后，点击插件图标或使用快捷键快速保存
- **标签管理**：为摘录内容添加自定义标签，方便分类检索
- **多格式导出**：支持JSON/CSV/TXT格式导出摘录内容
- **主题切换**：提供暗黑/明亮两种主题，保护眼睛
- **来源追踪**：自动记录摘录内容的来源URL
- **快捷键支持**：
  - Ctrl+Shift+S (Windows) / Command+Shift+S (Mac): 快速保存当前选中文本
  - Ctrl+Shift+O (Windows) / Command+Shift+O (Mac): 打开管理面板

## 安装指南
### Chrome浏览器安装
1. 下载项目代码
2. 在Chrome地址栏输入 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"，选择本项目目录

### Firefox浏览器安装
1. 下载项目代码
2. 在Firefox地址栏输入 `about:debugging`
3. 点击"临时加载附加组件"
4. 选择项目中的 `manifest.json` 文件

## 开发指南
```bash
# 克隆仓库
git clone https://github.com/your-repo/mindful-words.git

# 安装依赖 (如有)
npm install

# 构建扩展
npm run build

# 开发模式
npm run dev
```

## 贡献指南
欢迎提交Pull Request或Issue报告问题。贡献前请阅读：
1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 截图
![界面截图](screenshot.png)

## 许可证
MIT © 2023 Mindful Words