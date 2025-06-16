# Mindful Words - 文字摘录插件

[![版本](https://img.shields.io/badge/版本-0.9.0-blue.svg)](https://github.com/yangyongze/mindful-words/releases/tag/v0.9.0)
[![许可证](https://img.shields.io/badge/许可证-MIT-green.svg)](LICENSE)

## 项目简介
Mindful Words 是一款简洁高效的浏览器扩展，帮助用户快速摘录网页上的文字内容并添加标签分类。专注于简约设计和良好的用户体验，让收集和整理网页上的精彩片段变得轻松愉悦。

## 功能特点
- **一键保存与快捷键**：选中网页文字后，使用 `Ctrl+Shift+S` (Windows/Linux) 或 `Command+Shift+S` (Mac) 快捷键快速保存。
- **笔记编辑与管理**：直接在弹出窗口中编辑笔记内容和标签，支持搜索笔记。
- **高级标签管理**：在选项页面集中管理所有标签，支持对标签进行添加、编辑（自动更新所有相关笔记）和删除（自动从所有相关笔记移除）。
- **多格式导出**：支持将笔记导出为 JSON, CSV, TXT 格式。
- **主题切换**：提供浅色、深色及跟随系统三种主题模式。
- **来源追踪**：自动记录摘录内容的来源URL。
- **滚动位置记忆**：弹出窗口的笔记列表会记住上次的滚动位置。
- **精美界面与用户体验**：直观的操作流程和即时反馈机制，界面清爽易用。
- **数据健壮性**：增强的后台数据存储机制，包含重试和备用存储方案。

## 最新版本 (v0.9.0) 亮点
- **笔记编辑功能**：现在可以直接在插件的弹出窗口中编辑已保存笔记的内容和标签。
- **笔记搜索**：弹出窗口增加了搜索功能，可以快速查找笔记。
- **高级标签管理**：选项页面提供了全面的标签管理功能，包括编辑和删除标签时自动更新所有相关笔记。
- **滚动位置记忆**：提升了弹出窗口笔记列表的使用体验。
- **内容捕获改进**：增加了 `Ctrl+Shift+S` 快捷键，并优化了保存时的用户反馈。
- **数据存储增强**：提升了数据存储的可靠性。

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
1. **收集文字**：在任意网页上选中文字，按 `Ctrl+Shift+S` (Windows/Linux) 或 `Command+Shift+S` (Mac) 即可快速保存。
2. **查看与搜索笔记**：点击浏览器工具栏中的 Mindful Words 图标打开管理面板，可在此处查看、搜索和编辑笔记。
3. **编辑笔记与标签**：在管理面板中，点击笔记下方的“编辑”按钮修改内容，点击“标签”按钮或在编辑模态框中修改标签。
4. **高级标签管理**：进入扩展程序的选项页面，可以对所有标签进行统一管理（编辑、删除）。
5. **导出数据**：在管理面板中点击导出按钮，选择所需格式（JSON, CSV, TXT）导出所有笔记。
6. **切换主题**：在选项页面中选择浅色、深色或跟随系统主题。

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
MIT © 2024 Mindful Words