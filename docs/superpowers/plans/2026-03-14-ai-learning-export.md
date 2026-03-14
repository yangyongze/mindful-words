# AI 学习导出功能实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Mindful Words 添加 AI 友好的导出功能，支持英语学习场景

**Architecture:** 在现有 Chrome 扩展基础上，新增笔记字段、AI 练习模式导出格式、一键复制功能

**Tech Stack:** Chrome Extension Manifest V3, 原生 JavaScript, Chrome Storage API

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `background.js` | 修改 | 新增 `note` 字段支持 |
| `popup.js` | 修改 | 笔记编辑、AI 导出格式、剪贴板复制 |
| `popup.html` | 修改 | 编辑模态框添加笔记输入框 |
| `popup.css` | 修改 | 笔记显示样式、复制成功提示样式 |

---

## Chunk 1: 数据结构变更

### Task 1: 更新 background.js 支持笔记字段

**Files:**
- Modify: `background.js:213-222`

- [ ] **Step 1: 在 saveNote 函数中添加 note 字段**

找到 `background.js` 中的 `saveNote` 函数，在笔记对象创建部分添加 `note` 字段：

```javascript
// 笔记对象创建
const newNote = {
  id: Date.now(),
  content: request.content,
  note: '',  // 新增：个人笔记字段，默认为空
  title: request.title || request.content.substring(0, 30) + '...',
  url: request.url,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: processedTags
};
```

- [ ] **Step 2: 验证 updateNote 函数兼容性**

确认 `updateNote` 函数（第 162-191 行）已支持更新任意字段，无需修改。现有代码使用展开运算符 `...noteData`，会自动支持新字段。

- [ ] **Step 3: 提交变更**

```bash
git add background.js
git commit -m "feat: 添加笔记字段支持"
```

---

## Chunk 2: UI 更新 - 编辑模态框

### Task 2: 更新编辑模态框添加笔记输入框

**Files:**
- Modify: `popup.html:76-85`

- [ ] **Step 1: 在编辑模态框中添加笔记输入框**

找到 `popup.html` 中编辑模态框的 `modal-body` 部分，在内容输入框后添加笔记输入框：

```html
<div class="modal-body">
  <div class="form-group">
    <label for="edit-content">内容:</label>
    <textarea id="edit-content" rows="6" placeholder="输入笔记内容..."></textarea>
  </div>
  <div class="form-group">
    <label for="edit-note">个人笔记:</label>
    <textarea id="edit-note" rows="3" placeholder="添加你的想法或备注..."></textarea>
  </div>
  <div class="form-group">
    <label for="edit-tags">标签:</label>
    <input type="text" id="edit-tags" placeholder="输入标签，用逗号分隔..." />
  </div>
</div>
```

- [ ] **Step 2: 提交变更**

```bash
git add popup.html
git commit -m "feat: 编辑模态框添加笔记输入框"
```

### Task 3: 更新 popup.js 元素引用和编辑逻辑

**Files:**
- Modify: `popup.js:4-16` (elements 对象)
- Modify: `popup.js:41-53` (initializeElements 函数)
- Modify: `popup.js:654-670` (openEditModal 函数)
- Modify: `popup.js:673-678` (closeEditModal 函数)
- Modify: `popup.js:681-734` (saveNoteEdit 函数)

- [ ] **Step 1: 添加 editNote 元素引用**

在 `elements` 对象中添加 `editNote`：

```javascript
elements: {
  notesList: null,
  settingsBtn: null,
  exportBtn: null,
  searchInput: null,
  clearSearchBtn: null,
  editModal: null,
  editContent: null,
  editNote: null,  // 新增
  editTags: null,
  closeModal: null,
  cancelEdit: null,
  saveEdit: null
},
```

- [ ] **Step 2: 在 initializeElements 中初始化 editNote**

在 `initializeElements` 函数中添加：

```javascript
this.elements.editNote = document.getElementById('edit-note');
```

- [ ] **Step 3: 更新 openEditModal 函数**

修改 `openEditModal` 函数，加载笔记字段：

```javascript
openEditModal(noteId) {
  const note = this.data.notes.find(n => n.id === noteId);
  if (!note) {
    console.error('找不到要编辑的笔记');
    return;
  }
  
  this.data.currentEditingNote = note;
  this.elements.editContent.value = note.content;
  this.elements.editNote.value = note.note || '';  // 新增
  this.elements.editTags.value = note.tags ? note.tags.join(', ') : '';
  this.elements.editModal.style.display = 'block';
  
  setTimeout(() => {
    this.elements.editContent.focus();
  }, 100);
},
```

- [ ] **Step 4: 更新 closeEditModal 函数**

修改 `closeEditModal` 函数，清空笔记字段：

```javascript
closeEditModal() {
  this.elements.editModal.style.display = 'none';
  this.data.currentEditingNote = null;
  this.elements.editContent.value = '';
  this.elements.editNote.value = '';  // 新增
  this.elements.editTags.value = '';
},
```

- [ ] **Step 5: 更新 saveNoteEdit 函数**

修改 `saveNoteEdit` 函数，保存笔记字段：

```javascript
saveNoteEdit() {
  if (!this.data.currentEditingNote) {
    console.error('没有正在编辑的笔记');
    return;
  }
  
  const content = this.elements.editContent.value.trim();
  if (!content) {
    alert('笔记内容不能为空');
    return;
  }
  
  const noteText = this.elements.editNote.value.trim();  // 新增
  const tagsInput = this.elements.editTags.value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
  
  const updatedNote = {
    ...this.data.currentEditingNote,
    content: content,
    note: noteText,  // 新增
    tags: tags,
    updatedAt: new Date().toISOString()
  };
  
  chrome.runtime.sendMessage({
    type: 'update_note',
    id: this.data.currentEditingNote.id,
    noteData: updatedNote
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('更新笔记失败:', chrome.runtime.lastError);
      alert('更新笔记失败，请重试');
      return;
    }
    
    if (response && response.status === 'success') {
      const noteIndex = this.data.notes.findIndex(n => n.id === this.data.currentEditingNote.id);
      if (noteIndex !== -1) {
        this.data.notes[noteIndex] = updatedNote;
      }
      
      if (this.data.searchQuery) {
        this.searchNotes(this.data.searchQuery);
      } else {
        this.renderNotes();
      }
      
      this.closeEditModal();
    } else {
      alert('更新笔记失败，请重试');
    }
  });
}
```

- [ ] **Step 6: 提交变更**

```bash
git add popup.js
git commit -m "feat: 笔记编辑功能支持个人笔记字段"
```

---

## Chunk 3: UI 更新 - 笔记列表显示

### Task 4: 更新笔记列表渲染显示笔记

**Files:**
- Modify: `popup.js:220-260` (renderNotes 函数)

- [ ] **Step 1: 在 renderNotes 中添加笔记显示**

修改 `renderNotes` 函数中构建笔记 HTML 的部分，在 `note-content` 后添加笔记显示：

```javascript
let html = '';
sortedNotes.forEach(note => {
  const formattedDate = this.formatDate(note.createdAt);
  
  let tagsHtml = '';
  if (note.tags && note.tags.length > 0) {
    tagsHtml = `<div class="note-tags">
      ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
    </div>`;
  }
  
  // 新增：笔记显示
  let noteHtml = '';
  if (note.note && note.note.trim()) {
    noteHtml = `<div class="note-personal-note">${this.formatContent(note.note)}</div>`;
  }
  
  let displayUrl = '';
  try {
    const url = new URL(note.url);
    displayUrl = url.hostname.replace('www.', '');
  } catch (e) {
    displayUrl = '网页';
  }
  
  html += `
    <div class="note-item" data-id="${note.id}">
      <div class="note-content">${this.formatContent(note.content)}</div>
      ${noteHtml}
      ${tagsHtml}
      <div class="note-meta">
        ${formattedDate} · 
        <a href="${note.url}" target="_blank" class="note-url" title="${note.url}">${displayUrl}</a>
        <span class="spacer"></span>
        <span class="edit-note" data-id="${note.id}" title="编辑笔记">编辑</span>
        <span class="edit-tags" data-id="${note.id}" title="编辑标签">标签</span>
        <span class="delete-note" data-id="${note.id}" title="删除笔记">删除</span>
      </div>
    </div>
  `;
});
```

- [ ] **Step 2: 提交变更**

```bash
git add popup.js
git commit -m "feat: 笔记列表显示个人笔记"
```

### Task 5: 添加笔记显示样式

**Files:**
- Modify: `popup.css`

- [ ] **Step 1: 添加个人笔记样式**

在 `popup.css` 文件末尾添加：

```css
.note-personal-note {
  font-size: 13px;
  color: var(--secondary-text);
  background-color: var(--card-bg-color);
  padding: 8px 12px;
  border-radius: 6px;
  margin: 8px 0;
  border-left: 3px solid var(--accent-color);
  font-style: italic;
  line-height: 1.4;
}
```

- [ ] **Step 2: 提交变更**

```bash
git add popup.css
git commit -m "feat: 添加个人笔记显示样式"
```

---

## Chunk 4: AI 练习模式导出

### Task 6: 添加 AI 练习模式导出选项

**Files:**
- Modify: `popup.js:347-527` (showExportOptions 函数)

- [ ] **Step 1: 在导出菜单中添加 AI 练习模式选项**

修改 `showExportOptions` 函数中的导出菜单 HTML，在 JSON 选项前添加 AI 练习模式：

```javascript
exportMenu.innerHTML = `
  <div class="export-menu-header">导出选项</div>
  <div class="export-options">
    <div class="export-option export-option-ai" data-format="ai">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
        <circle cx="12" cy="12" r="4"></circle>
      </svg>
      <div class="option-content">
        <span class="option-label">AI 练习模式</span>
        <span class="option-desc">适合粘贴到豆包、千问等 AI 应用</span>
      </div>
    </div>
    <div class="export-option export-option-json" data-format="json">
      ...
    </div>
    ...
  </div>
`;
```

- [ ] **Step 2: 提交变更**

```bash
git add popup.js
git commit -m "feat: 导出菜单添加 AI 练习模式选项"
```

### Task 7: 实现 AI 练习模式导出格式

**Files:**
- Modify: `popup.js` (新增函数)

- [ ] **Step 1: 添加 generateAIExport 函数**

在 `popup.js` 中 `exportNotesAsTXT` 函数后添加：

```javascript
generateAIExport(notes) {
  const header = `我想练习以下英语内容，请你作为我的口语练习伙伴：\n\n【学习内容】`;
  
  const items = notes.map((note, index) => {
    let item = `${index + 1}. ${note.content}`;
    if (note.title) {
      item += `\n   来源：${note.title}`;
    }
    if (note.note && note.note.trim()) {
      item += `\n   笔记：${note.note}`;
    }
    return item;
  }).join('\n\n');
  
  const footer = `

请这样帮我学习：
1. 先简单解释每个词/句子的意思和用法
2. 在我们的对话中自然地使用这些词，引导我多说
3. 适时测试我是否掌握，比如让我造句或回答问题
4. 纠正我的错误，鼓励我继续练习`;

  return header + '\n' + items + footer;
},
```

- [ ] **Step 2: 提交变更**

```bash
git add popup.js
git commit -m "feat: 实现 AI 练习模式导出格式"
```

---

## Chunk 5: 剪贴板复制功能

### Task 8: 实现一键复制到剪贴板

**Files:**
- Modify: `popup.js` (新增函数)

- [ ] **Step 1: 添加 copyToClipboard 函数**

在 `popup.js` 中添加：

```javascript
async copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    this.showCopySuccess();
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
},
```

- [ ] **Step 2: 添加 showCopySuccess 函数**

```javascript
showCopySuccess() {
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = '已复制到剪贴板';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
},
```

- [ ] **Step 3: 提交变更**

```bash
git add popup.js
git commit -m "feat: 实现剪贴板复制功能"
```

### Task 9: 更新导出选项点击处理

**Files:**
- Modify: `popup.js:502-519` (导出选项点击处理)

- [ ] **Step 1: 添加 AI 模式导出处理**

修改导出选项点击处理，添加 AI 模式：

```javascript
exportMenu.querySelectorAll('.export-option').forEach(option => {
  option.addEventListener('click', (e) => {
    const format = e.currentTarget.dataset.format;
    
    if (format === 'ai') {
      const aiText = this.generateAIExport(this.data.notes);
      this.copyToClipboard(aiText);
    } else if (format === 'json') {
      this.exportNotesAsJSON(this.data.notes);
    } else if (format === 'csv') {
      this.exportNotesAsCSV(this.data.notes);
    } else if (format === 'txt') {
      this.exportNotesAsTXT(this.data.notes);
    }
    
    exportMenu.remove();
    backdrop.remove();
    style.remove();
  });
});
```

- [ ] **Step 2: 提交变更**

```bash
git add popup.js
git commit -m "feat: AI 模式导出使用剪贴板复制"
```

### Task 10: 添加复制成功提示样式

**Files:**
- Modify: `popup.css`

- [ ] **Step 1: 添加复制成功提示样式**

在 `popup.css` 文件末尾添加：

```css
.copy-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--accent-color);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  animation: toastSlideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.copy-toast.fade-out {
  animation: toastFadeOut 0.3s ease forwards;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toastFadeOut {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}

.export-option-ai .export-option-icon,
.export-option-ai svg {
  background-color: rgba(175, 82, 222, 0.1);
  color: #af52de;
}

[data-theme="dark"] .export-option-ai .export-option-icon,
[data-theme="dark"] .export-option-ai svg {
  background-color: rgba(191, 90, 242, 0.15);
  color: #bf5af2;
}
```

- [ ] **Step 2: 提交变更**

```bash
git add popup.css
git commit -m "feat: 添加复制成功提示样式"
```

---

## Chunk 6: 最终验证

### Task 11: 功能验证

- [ ] **Step 1: 在 Chrome 中加载扩展进行测试**

1. 打开 Chrome，进入 `chrome://extensions/`
2. 启用开发者模式
3. 点击"加载已解压的扩展程序"，选择项目目录
4. 测试以下功能：
   - 保存新笔记
   - 编辑笔记，添加个人笔记
   - 笔记列表显示个人笔记
   - 导出 AI 练习模式，验证格式正确
   - 验证复制到剪贴板功能

- [ ] **Step 2: 最终提交**

```bash
git add -A
git commit -m "feat: 完成 AI 学习导出功能"
```

---

## 测试清单

- [ ] 新保存的笔记包含空的 `note` 字段
- [ ] 编辑笔记时可以添加/修改个人笔记
- [ ] 笔记列表正确显示个人笔记
- [ ] AI 练习模式导出格式正确
- [ ] 复制到剪贴板功能正常
- [ ] 复制成功提示正确显示
- [ ] 深色模式下样式正确
- [ ] 现有数据兼容（无 `note` 字段的旧数据不报错）
