# Mindful Words - AI 学习导出功能设计

## 概述

为 Mindful Words Chrome 扩展新增 AI 友好的导出功能，支持英语学习场景。用户收集的单词、句子可以一键导出为结构化文本，粘贴到豆包、千问等 AI 应用中进行口语练习。

## 目标用户

- 英语学习者
- 使用 AI 应用（豆包、千问）进行口语练习的用户
- 工作后复盘反思的学习者

## 核心场景

```
网页浏览 → 收集内容 → 补充笔记 → 导出 → 粘贴到 AI → 语音练习
```

## 功能设计

### 1. 数据结构变更

#### 1.1 新增 `note` 字段

```javascript
{
  id: Number,           // 时间戳作为唯一标识
  content: String,      // 收集的内容（单词/句子）
  note: String,         // 新增：个人笔记（可选）
  title: String,        // 网页标题
  url: String,          // 来源网页 URL
  createdAt: String,    // 创建时间
  updatedAt: String,    // 最后更新时间
  tags: Array<String>   // 标签数组
}
```

#### 1.2 数据迁移

- 现有数据自动兼容，`note` 字段默认为空字符串
- 无需手动迁移

### 2. 导出格式

#### 2.1 新增"AI 练习模式"导出

**格式模板：**

```
我想练习以下英语内容，请你作为我的口语练习伙伴：

【学习内容】
1. {content}
   来源：{title}
   笔记：{note}

2. {content}
   来源：{title}

...

请这样帮我学习：
1. 先简单解释每个词/句子的意思和用法
2. 在我们的对话中自然地使用这些词，引导我多说
3. 适时测试我是否掌握，比如让我造句或回答问题
4. 纠正我的错误，鼓励我继续练习
```

**示例输出：**

```
我想练习以下英语内容，请你作为我的口语练习伙伴：

【学习内容】
1. serendipity
   来源：The Art of Happy Accidents
   笔记：这个词很常用，记住它

2. "It was pure serendipity that we met at the coffee shop."
   来源：The Art of Happy Accidents

3. ephemeral
   来源：Poetry Foundation
   笔记：形容短暂美好的事物

请这样帮我学习：
1. 先简单解释每个词/句子的意思和用法
2. 在我们的对话中自然地使用这些词，引导我多说
3. 适时测试我是否掌握，比如让我造句或回答问题
4. 纠正我的错误，鼓励我继续练习
```

#### 2.2 保留原有导出格式

- JSON 格式
- CSV 格式
- TXT 格式

### 3. UI 改进

#### 3.1 笔记编辑功能

**位置：** 笔记列表中每条记录

**交互：**
- 每条记录显示"添加笔记"按钮（无笔记时）或笔记内容（有笔记时）
- 点击可编辑笔记
- 支持快捷键保存（Enter）

#### 3.2 一键复制导出

**功能：**
- 导出后自动复制到剪贴板
- 显示"已复制到剪贴板"提示（2秒后消失）

#### 3.3 导出模板选择

**位置：** 导出按钮下拉菜单

**选项：**
- AI 练习模式（新增，默认）
- JSON 格式
- CSV 格式
- TXT 格式

#### 3.4 筛选导出

**功能：**
- 支持多选记录
- 仅导出选中的记录
- 未选中时导出全部

## 技术实现

### 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `popup.html` | 新增笔记编辑 UI、导出模板选择 |
| `popup.js` | 笔记编辑逻辑、导出格式生成、剪贴板复制 |
| `popup.css` | 笔记编辑样式、提示样式 |
| `background.js` | 新增 `update_note` 消息处理（已有，确认兼容） |
| `options.js` | 无需修改 |

### 关键代码逻辑

#### 导出格式生成

```javascript
function generateAIExport(notes) {
  const header = `我想练习以下英语内容，请你作为我的口语练习伙伴：\n\n【学习内容】`;
  
  const items = notes.map((note, index) => {
    let item = `${index + 1}. ${note.content}`;
    if (note.title) item += `\n   来源：${note.title}`;
    if (note.note) item += `\n   笔记：${note.note}`;
    return item;
  }).join('\n\n');
  
  const footer = `
请这样帮我学习：
1. 先简单解释每个词/句子的意思和用法
2. 在我们的对话中自然地使用这些词，引导我多说
3. 适时测试我是否掌握，比如让我造句或回答问题
4. 纠正我的错误，鼓励我继续练习`;

  return header + '\n' + items + footer;
}
```

#### 剪贴板复制

```javascript
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showCopySuccess();
  } catch (err) {
    console.error('复制失败:', err);
  }
}
```

## 兼容性

- Chrome Extension Manifest V3
- Chrome Storage API（现有数据完全兼容）
- 无外部依赖

## 测试要点

1. 笔记添加/编辑/删除功能
2. AI 练习模式导出格式正确性
3. 剪贴板复制功能
4. 筛选导出功能
5. 现有数据兼容性
6. 空笔记时不显示"笔记："行

## 未来扩展

- 自定义导出模板
- 学习进度标记
- 复习提醒
- 与 AI API 直接集成
