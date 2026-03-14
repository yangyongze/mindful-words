# 筛选与导出功能实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Mindful Words 添加多维度筛选功能（标签、时间、来源），支持组合筛选，筛选后可通过选择模式复制或导出。

**Architecture:** 在现有 popup.html 中添加筛选栏，使用下拉面板实现多选筛选，筛选逻辑在 popup.js 中实现，通过 filteredNotes 状态管理筛选结果。

**Tech Stack:** HTML/CSS/JavaScript (Chrome Extension)

---

## Chunk 1: HTML 结构与 CSS 样式

### Task 1: 添加筛选栏 HTML 结构

**Files:**
- Modify: `d:\CodeAICo\mindful-words\popup.html`

- [ ] **Step 1: 在搜索栏下方添加筛选栏**

在 `</header>` 之前添加筛选栏：

```html
  <!-- 筛选栏 -->
  <div id="filter-bar" class="filter-bar">
    <div class="filter-buttons">
      <button id="filter-tags-btn" class="filter-btn">
        标签
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <button id="filter-time-btn" class="filter-btn">
        时间
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <button id="filter-source-btn" class="filter-btn">
        来源
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <button id="clear-filters-btn" class="filter-btn filter-btn-clear hidden">清除筛选</button>
    </div>
    <div id="active-filters" class="active-filters hidden"></div>
  </div>
```

- [ ] **Step 2: 验证 HTML 结构正确**

检查文件确保结构正确。

---

### Task 2: 添加筛选栏 CSS 样式

**Files:**
- Modify: `d:\CodeAICo\mindful-words\popup.css`

- [ ] **Step 1: 添加筛选栏样式**

在文件末尾添加：

```css
/* 筛选栏 */
.filter-bar {
  padding: 8px 16px;
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
}

.filter-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  background-color: var(--hover-bg-color);
}

.filter-btn.active {
  background-color: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.filter-btn-clear {
  color: var(--secondary-text);
  border-color: transparent;
}

.filter-btn-clear:hover {
  color: var(--error-color);
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.active-filters.hidden {
  display: none;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: rgba(0, 102, 204, 0.1);
  color: var(--accent-color);
  border-radius: 4px;
  font-size: 12px;
}

.filter-tag .remove-filter {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.filter-tag .remove-filter:hover {
  opacity: 1;
}

/* 筛选下拉面板 */
.filter-dropdown {
  position: absolute;
  background: var(--bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  animation: fadeIn var(--transition-fast);
}

.filter-dropdown-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
}

.filter-dropdown-content {
  padding: 8px 0;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.filter-option:hover {
  background-color: var(--hover-bg-color);
}

.filter-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-color);
}

.filter-option label {
  flex: 1;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-color);
}

.filter-dropdown-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
}

.filter-dropdown-footer button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-dropdown-footer .btn-cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.filter-dropdown-footer .btn-cancel:hover {
  background-color: var(--hover-bg-color);
}

.filter-dropdown-footer .btn-confirm {
  background: var(--accent-color);
  border: none;
  color: white;
}

.filter-dropdown-footer .btn-confirm:hover {
  opacity: 0.9;
}

/* 时间筛选特殊样式 */
.time-shortcuts {
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
}

.time-shortcuts label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  color: var(--text-color);
  cursor: pointer;
}

.time-shortcuts input[type="radio"] {
  accent-color: var(--accent-color);
}

.time-custom {
  padding: 12px 16px;
}

.time-custom label {
  display: block;
  font-size: 12px;
  color: var(--secondary-text);
  margin-bottom: 4px;
}

.time-custom input[type="date"] {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  background-color: var(--card-bg-color);
  color: var(--text-color);
  margin-bottom: 8px;
}

.time-custom input[type="date"]:focus {
  outline: none;
  border-color: var(--accent-color);
}
```

- [ ] **Step 2: 验证 CSS 样式正确**

检查文件确保样式正确添加。

---

## Chunk 2: JavaScript 筛选逻辑

### Task 3: 添加筛选状态和元素引用

**Files:**
- Modify: `d:\CodeAICo\mindful-words\popup.js`

- [ ] **Step 1: 添加筛选相关元素引用**

在 `elements` 对象中添加：

```javascript
    filterTagsBtn: null,
    filterTimeBtn: null,
    filterSourceBtn: null,
    clearFiltersBtn: null,
    activeFilters: null
```

- [ ] **Step 2: 添加筛选状态**

在 `data` 对象中添加：

```javascript
    filters: {
      tags: [],
      timeRange: null,
      sources: []
    }
```

- [ ] **Step 3: 初始化筛选元素引用**

在 `initializeElements` 方法中添加：

```javascript
    this.elements.filterTagsBtn = document.getElementById('filter-tags-btn');
    this.elements.filterTimeBtn = document.getElementById('filter-time-btn');
    this.elements.filterSourceBtn = document.getElementById('filter-source-btn');
    this.elements.clearFiltersBtn = document.getElementById('clear-filters-btn');
    this.elements.activeFilters = document.getElementById('active-filters');
```

---

### Task 4: 添加筛选事件监听器

**Files:**
- Modify: `d:\CodeAICo\mindful-words\popup.js`

- [ ] **Step 1: 在 setupEventListeners 中添加筛选事件监听**

在方法末尾添加：

```javascript
    // 筛选按钮事件监听
    this.elements.filterTagsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showFilterDropdown('tags');
    });
    
    this.elements.filterTimeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showFilterDropdown('time');
    });
    
    this.elements.filterSourceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showFilterDropdown('source');
    });
    
    this.elements.clearFiltersBtn.addEventListener('click', () => {
      this.clearAllFilters();
    });
```

---

### Task 5: 实现筛选下拉面板

**Files:**
- Modify: `d:\CodeAICo\mindful-words\popup.js`

- [ ] **Step 1: 添加 showFilterDropdown 方法**

在文件末尾 `downloadFile` 方法之后添加：

```javascript
,
  
  // 显示筛选下拉面板
  showFilterDropdown(type) {
    // 关闭其他下拉面板
    this.closeAllFilterDropdowns();
    
    const btn = type === 'tags' ? this.elements.filterTagsBtn 
              : type === 'time' ? this.elements.filterTimeBtn 
              : this.elements.filterSourceBtn;
    
    const rect = btn.getBoundingClientRect();
    
    let dropdown;
    if (type === 'tags') {
      dropdown = this.createTagsDropdown();
    } else if (type === 'time') {
      dropdown = this.createTimeDropdown();
    } else {
      dropdown = this.createSourceDropdown();
    }
    
    dropdown.className = 'filter-dropdown';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    
    document.body.appendChild(dropdown);
    btn.classList.add('active');
    
    // 点击外部关闭
    const closeHandler = (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        this.closeAllFilterDropdowns();
        document.removeEventListener('click', closeHandler);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
    }, 0);
  },
  
  // 关闭所有筛选下拉面板
  closeAllFilterDropdowns() {
    document.querySelectorAll('.filter-dropdown').forEach(el => el.remove());
    this.elements.filterTagsBtn.classList.remove('active');
    this.elements.filterTimeBtn.classList.remove('active');
    this.elements.filterSourceBtn.classList.remove('active');
  },
  
  // 创建标签下拉面板
  createTagsDropdown() {
    const dropdown = document.createElement('div');
    const allTags = this.getAllTags();
    const selectedTags = this.data.filters.tags;
    
    let optionsHtml = '';
    allTags.forEach(tag => {
      const checked = selectedTags.includes(tag) ? 'checked' : '';
      optionsHtml += `
        <div class="filter-option">
          <input type="checkbox" id="tag-${tag}" value="${tag}" ${checked}>
          <label for="tag-${tag}">${tag}</label>
        </div>
      `;
    });
    
    if (allTags.length === 0) {
      optionsHtml = '<div class="filter-option" style="color: var(--secondary-text);">暂无标签</div>';
    }
    
    dropdown.innerHTML = `
      <div class="filter-dropdown-header">选择标签</div>
      <div class="filter-dropdown-content">${optionsHtml}</div>
      <div class="filter-dropdown-footer">
        <button class="btn-cancel">取消</button>
        <button class="btn-confirm">确定</button>
      </div>
    `;
    
    dropdown.querySelector('.btn-cancel').addEventListener('click', () => {
      this.closeAllFilterDropdowns();
    });
    
    dropdown.querySelector('.btn-confirm').addEventListener('click', () => {
      const checked = dropdown.querySelectorAll('input[type="checkbox"]:checked');
      this.data.filters.tags = Array.from(checked).map(cb => cb.value);
      this.closeAllFilterDropdowns();
      this.applyFilters();
    });
    
    return dropdown;
  },
  
  // 创建时间下拉面板
  createTimeDropdown() {
    const dropdown = document.createElement('div');
    
    dropdown.innerHTML = `
      <div class="filter-dropdown-header">选择时间范围</div>
      <div class="time-shortcuts">
        <label><input type="radio" name="time-shortcut" value="today"> 今天</label>
        <label><input type="radio" name="time-shortcut" value="yesterday"> 昨天</label>
        <label><input type="radio" name="time-shortcut" value="week"> 本周</label>
        <label><input type="radio" name="time-shortcut" value="month"> 本月</label>
        <label><input type="radio" name="time-shortcut" value="last7"> 最近7天</label>
        <label><input type="radio" name="time-shortcut" value="last30"> 最近30天</label>
        <label><input type="radio" name="time-shortcut" value="custom"> 自定义</label>
      </div>
      <div class="time-custom hidden">
        <label>开始日期</label>
        <input type="date" id="time-start">
        <label>结束日期</label>
        <input type="date" id="time-end">
      </div>
      <div class="filter-dropdown-footer">
        <button class="btn-cancel">取消</button>
        <button class="btn-confirm">确定</button>
      </div>
    `;
    
    const customSection = dropdown.querySelector('.time-custom');
    const radios = dropdown.querySelectorAll('input[name="time-shortcut"]');
    
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'custom') {
          customSection.classList.remove('hidden');
        } else {
          customSection.classList.add('hidden');
        }
      });
    });
    
    dropdown.querySelector('.btn-cancel').addEventListener('click', () => {
      this.closeAllFilterDropdowns();
    });
    
    dropdown.querySelector('.btn-confirm').addEventListener('click', () => {
      const selected = dropdown.querySelector('input[name="time-shortcut"]:checked');
      if (!selected) {
        this.data.filters.timeRange = null;
      } else if (selected.value === 'custom') {
        const start = dropdown.querySelector('#time-start').value;
        const end = dropdown.querySelector('#time-end').value;
        if (start && end) {
          this.data.filters.timeRange = {
            type: 'custom',
            start: new Date(start),
            end: new Date(end + 'T23:59:59')
          };
        }
      } else {
        this.data.filters.timeRange = this.getTimeRange(selected.value);
      }
      this.closeAllFilterDropdowns();
      this.applyFilters();
    });
    
    return dropdown;
  },
  
  // 创建来源下拉面板
  createSourceDropdown() {
    const dropdown = document.createElement('div');
    const allSources = this.getAllSources();
    const selectedSources = this.data.filters.sources;
    
    let optionsHtml = '';
    allSources.forEach(source => {
      const checked = selectedSources.includes(source) ? 'checked' : '';
      optionsHtml += `
        <div class="filter-option">
          <input type="checkbox" id="source-${source.replace(/\./g, '-')}" value="${source}" ${checked}>
          <label for="source-${source.replace(/\./g, '-')}">${source}</label>
        </div>
      `;
    });
    
    if (allSources.length === 0) {
      optionsHtml = '<div class="filter-option" style="color: var(--secondary-text);">暂无来源</div>';
    }
    
    dropdown.innerHTML = `
      <div class="filter-dropdown-header">选择来源</div>
      <div class="filter-dropdown-content">${optionsHtml}</div>
      <div class="filter-dropdown-footer">
        <button class="btn-cancel">取消</button>
        <button class="btn-confirm">确定</button>
      </div>
    `;
    
    dropdown.querySelector('.btn-cancel').addEventListener('click', () => {
      this.closeAllFilterDropdowns();
    });
    
    dropdown.querySelector('.btn-confirm').addEventListener('click', () => {
      const checked = dropdown.querySelectorAll('input[type="checkbox"]:checked');
      this.data.filters.sources = Array.from(checked).map(cb => cb.value);
      this.closeAllFilterDropdowns();
      this.applyFilters();
    });
    
    return dropdown;
  },
  
  // 获取所有标签
  getAllTags() {
    const tags = new Set();
    this.data.notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  },
  
  // 获取所有来源
  getAllSources() {
    const sources = new Set();
    this.data.notes.forEach(note => {
      try {
        const hostname = new URL(note.url).hostname.replace('www.', '');
        sources.add(hostname);
      } catch (e) {}
    });
    return Array.from(sources).sort();
  },
  
  // 获取时间范围
  getTimeRange(shortcut) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (shortcut) {
      case 'today':
        return { type: 'today', start: today, end: now };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { type: 'yesterday', start: yesterday, end: new Date(today.getTime() - 1) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return { type: 'week', start: weekStart, end: now };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { type: 'month', start: monthStart, end: now };
      case 'last7':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 6);
        return { type: 'last7', start: last7, end: now };
      case 'last30':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 29);
        return { type: 'last30', start: last30, end: now };
      default:
        return null;
    }
  }
```

---

### Task 6: 实现筛选应用逻辑

**Files:**
- Modify: `d:\CodeAICo\mindful-words\popup.js`

- [ ] **Step 1: 添加 applyFilters 方法**

在 `getTimeRange` 方法之后添加：

```javascript
,
  
  // 应用筛选
  applyFilters() {
    let filtered = [...this.data.notes];
    
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
      const query = this.data.searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.content.toLowerCase().includes(query) ||
        note.title.toLowerCase().includes(query) ||
        (note.note && note.note.toLowerCase().includes(query))
      );
    }
    
    this.data.filteredNotes = filtered;
    this.renderNotes(filtered);
    this.updateActiveFilters();
    this.updateFilterButtons();
  },
  
  // 更新已选筛选条件显示
  updateActiveFilters() {
    const container = this.elements.activeFilters;
    const tags = [];
    
    // 标签
    this.data.filters.tags.forEach(tag => {
      tags.push({ type: 'tag', value: tag, label: tag });
    });
    
    // 时间
    if (this.data.filters.timeRange) {
      const timeLabels = {
        today: '今天',
        yesterday: '昨天',
        week: '本周',
        month: '本月',
        last7: '最近7天',
        last30: '最近30天',
        custom: '自定义时间'
      };
      const label = timeLabels[this.data.filters.timeRange.type] || '时间筛选';
      tags.push({ type: 'time', value: 'time', label });
    }
    
    // 来源
    this.data.filters.sources.forEach(source => {
      tags.push({ type: 'source', value: source, label: source });
    });
    
    if (tags.length === 0) {
      container.classList.add('hidden');
      this.elements.clearFiltersBtn.classList.add('hidden');
      return;
    }
    
    container.classList.remove('hidden');
    this.elements.clearFiltersBtn.classList.remove('hidden');
    
    container.innerHTML = tags.map(tag => `
      <span class="filter-tag" data-type="${tag.type}" data-value="${tag.value}">
        ${tag.label}
        <span class="remove-filter">×</span>
      </span>
    `).join('');
    
    // 添加移除事件
    container.querySelectorAll('.remove-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tagEl = e.target.closest('.filter-tag');
        const type = tagEl.dataset.type;
        const value = tagEl.dataset.value;
        this.removeFilter(type, value);
      });
    });
  },
  
  // 移除单个筛选条件
  removeFilter(type, value) {
    if (type === 'tag') {
      this.data.filters.tags = this.data.filters.tags.filter(t => t !== value);
    } else if (type === 'time') {
      this.data.filters.timeRange = null;
    } else if (type === 'source') {
      this.data.filters.sources = this.data.filters.sources.filter(s => s !== value);
    }
    this.applyFilters();
  },
  
  // 清除所有筛选
  clearAllFilters() {
    this.data.filters.tags = [];
    this.data.filters.timeRange = null;
    this.data.filters.sources = [];
    this.applyFilters();
  },
  
  // 更新筛选按钮状态
  updateFilterButtons() {
    const hasFilters = this.data.filters.tags.length > 0 
                    || this.data.filters.timeRange 
                    || this.data.filters.sources.length > 0;
    
    this.elements.filterTagsBtn.classList.toggle('active', this.data.filters.tags.length > 0);
    this.elements.filterTimeBtn.classList.toggle('active', !!this.data.filters.timeRange);
    this.elements.filterSourceBtn.classList.toggle('active', this.data.filters.sources.length > 0);
  }
```

---

### Task 7: 更新搜索逻辑

**Files:**
- Modify: `d:\CodeAICo\mindful-words\popup.js`

- [ ] **Step 1: 修改 searchNotes 方法使用 applyFilters**

找到 `searchNotes` 方法，修改为：

```javascript
  // 搜索笔记
  searchNotes(query) {
    this.data.searchQuery = query.trim();
    this.applyFilters();
  }
```

---

### Task 8: 更新 renderNotes 方法

**Files:**
- Modify: `d:\CodeAICo\mindful-words\popup.js`

- [ ] **Step 1: 修改 renderNotes 使用 filteredNotes**

找到 `renderNotes` 方法开头，修改为：

```javascript
  // 渲染笔记列表
  renderNotes(notes) {
    if (!this.elements.notesList) return;
    
    // 如果没有传入 notes，使用 filteredNotes 或应用筛选
    let notesToRender = notes;
    if (!notesToRender) {
      if (this.data.searchQuery || this.hasActiveFilters()) {
        notesToRender = this.data.filteredNotes;
      } else {
        notesToRender = this.data.notes;
      }
    }
    
    // ... 后续代码保持不变
```

- [ ] **Step 2: 添加 hasActiveFilters 方法**

在 `updateFilterButtons` 方法之后添加：

```javascript
,
  
  // 检查是否有活跃的筛选条件
  hasActiveFilters() {
    return this.data.filters.tags.length > 0 
        || this.data.filters.timeRange !== null 
        || this.data.filters.sources.length > 0;
  }
```

---

## Chunk 3: 测试与验证

### Task 9: 验证功能

- [ ] **Step 1: 在浏览器中加载扩展测试**

1. 打开 Chrome 扩展管理页面 `chrome://extensions/`
2. 加载已解压的扩展程序
3. 打开侧边栏，验证筛选栏显示正确

- [ ] **Step 2: 测试标签筛选**

1. 点击「标签」按钮
2. 选择一个或多个标签
3. 点击「确定」
4. 验证笔记列表正确筛选
5. 验证已选条件显示正确

- [ ] **Step 3: 测试时间筛选**

1. 点击「时间」按钮
2. 选择「本周」
3. 点击「确定」
4. 验证笔记列表正确筛选

- [ ] **Step 4: 测试来源筛选**

1. 点击「来源」按钮
2. 选择一个或多个来源
3. 点击「确定」
4. 验证笔记列表正确筛选

- [ ] **Step 5: 测试组合筛选**

1. 同时设置标签、时间、来源筛选
2. 验证 AND 逻辑正确
3. 验证已选条件全部显示

- [ ] **Step 6: 测试移除筛选**

1. 点击已选条件的 × 按钮
2. 验证单个条件移除正确
3. 点击「清除筛选」
4. 验证所有筛选清除

- [ ] **Step 7: 测试筛选 + 搜索组合**

1. 设置筛选条件
2. 输入搜索关键词
3. 验证两者组合正确

- [ ] **Step 8: 测试选择模式**

1. 设置筛选条件
2. 点击「选择」按钮
3. 选择笔记
4. 复制/导出验证正确

---

## 文件变更汇总

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| popup.html | 修改 | 添加筛选栏 HTML 结构 |
| popup.css | 修改 | 添加筛选栏样式 |
| popup.js | 修改 | 添加筛选逻辑、状态、方法 |
