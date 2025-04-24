# Mindful Words - 文字摘录插件

[![版本](https://img.shields.io/badge/版本-0.8.0-blue.svg)](https://github.com/yangyongze/mindful-words/releases/tag/v0.8.0)
[![许可证](https://img.shields.io/badge/许可证-MIT-green.svg)](LICENSE)

## 项目简介
Mindful Words 是一款简洁高效的浏览器扩展，帮助用户快速摘录网页上的文字内容并添加标签分类。专注于简约设计和良好的用户体验，让收集和整理网页上的精彩片段变得轻松愉悦。

## 功能特点
- **一键保存**：选中网页文字后，点击插件图标或使用快捷键快速保存
- **标签管理**：为摘录内容添加自定义标签，方便分类检索
- **多格式导出**：支持JSON/CSV/TXT格式导出摘录内容
- **主题切换**：提供暗黑/明亮两种主题，保护眼睛
- **来源追踪**：自动记录摘录内容的来源URL
- **精美界面**：全新设计的用户界面，专注内容和体验
- **便捷操作**：直观的操作流程和反馈机制
- **快捷键支持**：
  - Ctrl+Shift+S (Windows) / Command+Shift+S (Mac): 快速保存当前选中文本
  - Ctrl+Shift+O (Windows) / Command+Shift+O (Mac): 打开管理面板

## 最新版本 (v0.8.0) 亮点
- **全新UI设计**：采用苹果设计风格的界面，更加精致美观
- **优化用户体验**：改进的交互动效和视觉反馈
- **改进导出功能**：重新设计的导出选项，支持多种格式
- **代码质量提升**：重构内部结构，提高稳定性和性能

查看完整[更新日志](CHANGELOG.md)了解详细变更。

## 安装指南
### Chrome浏览器安装
1. 下载[最新版本](https://github.com/yangyongze/mindful-words/releases/latest)代码
2. 在Chrome地址栏输入 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"，选择本项目目录

### Firefox浏览器安装
1. 下载项目代码
2. 在Firefox地址栏输入 `about:debugging`
3. 点击"临时加载附加组件"
4. 选择项目中的 `manifest.json` 文件

## 使用指南
1. **收集文字**：在任意网页上选中文字，按 Ctrl+Shift+S (或 Command+Shift+S) 保存
2. **管理笔记**：点击浏览器工具栏中的 Mindful Words 图标打开管理面板
3. **添加标签**：点击笔记下方的标签按钮，为笔记添加分类标签
4. **导出数据**：点击导出按钮，选择所需格式导出所有笔记
5. **切换主题**：在设置中切换暗色/亮色主题

## 开发指南
```bash
# 克隆仓库
git clone https://github.com/yangyongze/mindful-words.git

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
![新版界面截图](screenshot.png)
*图片显示的是v0.8.0版本的全新界面*

## 许可证
MIT © 2023 Mindful Words