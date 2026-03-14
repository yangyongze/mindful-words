# 筛选与导出功能设计

## 概述

为 Mindful Words Chrome 扩展添加多维度筛选功能，支持标签、时间、来源的组合筛选，筛选后可通过选择模式复制或导出笔记。

## 功能需求

### 1. 筛选功能

#### 1.1 筛选维度

| 维度 | 类型 | 说明 |
|------|------|------|
| 标签 | 多选 | 从已有标签中选择一个或多个 |
| 时间 | 范围 | 快捷选项 + 自定义日期范围 |
| 来源 | 多选 | 从已有网站域名中选择一个或多个 |

#### 1.2 筛选交互

- 点击「标签/时间/来源」按钮展开下拉面板
- 选择条件后点击「确定」应用筛选
- 已选条件显示为可移除标签
- 支持组合筛选（多个维度同时生效）
- 「清除筛选」重置所有条件

#### 1.3 筛选逻辑

- 标签：笔记包含任一选中标签即匹配（OR 逻辑）
- 时间：笔记创建时间在选定范围内
- 来源：笔记来源域名匹配任一选中来源（OR 逻辑）
- 多维度：AND 逻辑（同时满足所有维度条件）

### 2. 搜索与筛选关系

- 搜索和筛选独立工作，可同时生效
- 搜索在筛选结果基础上进行
- 清除筛选不影响搜索关键词

### 3. 选择模式（保持现有逻辑）

- 筛选/搜索后，点击「选择」进入选择模式
- 在筛选结果中手动选择笔记
- 支持复制到剪贴板或导出文件

## 界面设计

### 布局结构

```
┌─────────────────────────────────────────────────┐
│ Mindful Words                                    │
│ are seeds, action makes them grow...             │
├─────────────────────────────────────────────────┤
│ 🔍 搜索...                    [选择] [设置]      │
├─────────────────────────────────────────────────┤
│ [标签 ▼] [时间 ▼] [来源 ▼]  [清除筛选]           │
│ 已选: [工作 ×] [学习 ×] [本周 ×]                 │
├─────────────────────────────────────────────────┤
│ 📄 笔记列表...                                   │
└─────────────────────────────────────────────────┘
```

### 下拉面板设计

#### 标签下拉

```
┌─────────────────────┐
│ ☑ 工作              │
│ ☑ 学习              │
│ ☐ 生活              │
│ ☐ 技术              │
│ ☐ 英语              │
│ [确定] [取消]        │
└─────────────────────┘
```

#### 时间下拉

```
┌─────────────────────┐
│ 快捷选项:           │
│ ○ 今天              │
│ ○ 昨天              │
│ ○ 本周              │
│ ○ 本月              │
│ ○ 最近7天           │
│ ○ 最近30天          │
│ ─────────────────── │
│ 自定义范围:         │
│ 开始: [2024-01-01]  │
│ 结束: [2024-03-14]  │
│ [确定] [取消]        │
└─────────────────────┘
```

#### 来源下拉

```
┌─────────────────────┐
│ ☑ zhihu.com         │
│ ☐ github.com        │
│ ☐ weibo.com         │
│ ☐ mp.weixin.qq.com  │
│ [确定] [取消]        │
└─────────────────────┘
```

## 数据结构

### 筛选状态

```javascript
data: {
  filters: {
    tags: [],           // 选中的标签数组 ['工作', '学习']
    timeRange: null,    // 时间范围 { type: 'week' | 'custom', start: Date, end: Date }
    sources: []         // 选中的来源数组 ['zhihu.com', 'github.com']
  }
}
```

### 筛选方法

```javascript
// 应用筛选
applyFilters() {
  let filtered = this.data.notes;
  
  // 标签筛选 (OR)
  if (this.data.filters.tags.length > 0) {
    filtered = filtered.filter(note => 
      note.tags && note.tags.some(tag => this.data.filters.tags.includes(tag))
    );
  }
  
  // 时间筛选
  if (this.data.filters.timeRange) {
    const { start, end } = this.data.filters.timeRange;
    filtered = filtered.filter(note => {
      const created = new Date(note.createdAt);
      return created >= start && created <= end;
    });
  }
  
  // 来源筛选 (OR)
  if (this.data.filters.sources.length > 0) {
    filtered = filtered.filter(note => {
      try {
        const hostname = new URL(note.url).hostname.replace('www.', '');
        return this.data.filters.sources.includes(hostname);
      } catch { return false; }
    });
  }
  
  // 结合搜索
  if (this.data.searchQuery) {
    filtered = filtered.filter(note => 
      note.content.includes(this.data.searchQuery) ||
      note.title.includes(this.data.searchQuery)
    );
  }
  
  this.data.filteredNotes = filtered;
  this.renderNotes(filtered);
}
```

## 实现要点

### 1. HTML 结构

- 筛选按钮区域：`#filter-bar`
- 已选条件显示：`#active-filters`
- 下拉面板：动态创建，点击外部关闭

### 2. CSS 样式

- 筛选按钮：与现有按钮风格一致
- 下拉面板：使用现有 `.export-menu` 样式基础
- 已选标签：使用现有 `.tag` 样式

### 3. 交互细节

- 下拉面板点击外部关闭
- ESC 键关闭下拉面板
- 筛选条件变化时自动重新渲染
- 无结果时显示空状态提示

## 文件变更

| 文件 | 变更 |
|------|------|
| popup.html | 添加筛选按钮和已选条件区域 |
| popup.css | 添加筛选相关样式 |
| popup.js | 添加筛选逻辑和状态管理 |

## 测试要点

1. 单维度筛选正确
2. 多维度组合筛选正确
3. 筛选 + 搜索组合正确
4. 清除筛选重置所有条件
5. 已选条件可单独移除
6. 时间范围计算正确（本周、本月等）
7. 无匹配结果时显示空状态
