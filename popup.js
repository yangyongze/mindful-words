// 弹出窗口管理对象
const PopupManager = {
  // DOM元素引用
  elements: {
    notesList: null,
    settingsBtn: null,
    exportBtn: null
  },
  
  // 数据存储
  data: {
    notes: [],
    settings: {
      theme: 'light'
    }
  },
  
  // 初始化
  initialize() {
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeElements();
      this.setupEventListeners();
      this.loadSettings();
      this.loadNotes();
    });
  },
  
  // 初始化DOM元素引用
  initializeElements() {
    this.elements.notesList = document.getElementById('notes-list');
    this.elements.settingsBtn = document.getElementById('settings-btn');
    this.elements.exportBtn = document.getElementById('export-btn');
  },
  
  // 设置事件监听器
  setupEventListeners() {
    // 设置按钮点击事件
    this.elements.settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    // 导出按钮点击事件
    this.elements.exportBtn.addEventListener('click', () => {
      this.showExportOptions();
    });
    
    // 笔记列表操作事件代理
    document.addEventListener('click', (e) => {
      // 删除笔记
      if (e.target.classList.contains('delete-note')) {
        const noteId = parseInt(e.target.dataset.id);
        this.deleteNote(noteId);
      } 
      // 编辑标签
      else if (e.target.classList.contains('edit-tags')) {
        const noteId = parseInt(e.target.dataset.id);
        this.editNoteTags(noteId);
      }
    });
    
    // 监听主题变更消息
    chrome.runtime.onMessage.addListener((request) => {
      if (request.type === 'update_theme') {
        this.applyTheme(request.theme);
      }
    });
  },
  
  // 从存储加载设置
  loadSettings() {
    chrome.storage.local.get(['settings'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('加载设置失败:', chrome.runtime.lastError);
        return;
      }
      
      if (result.settings) {
        this.data.settings = result.settings;
        this.applyTheme(this.data.settings.theme || 'light');
      }
    });
  },
  
  // 应用主题设置
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.data.settings.theme = theme;
  },
  
  // 从存储加载笔记
  loadNotes() {
    this.loadDataWithRetry('notes', (loadedNotes) => {
      if (loadedNotes && Array.isArray(loadedNotes)) {
        this.data.notes = loadedNotes;
        this.renderNotes(loadedNotes);
      } else {
        this.elements.notesList.innerHTML = '<p style="text-align: center; padding: 20px;">暂无笔记</p>';
      }
    });
  },
  
  // 带重试功能的数据加载
  loadDataWithRetry(key, callback, attempt = 1) {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        console.error(`存储获取失败(尝试 ${attempt}):`, chrome.runtime.lastError);
        if (attempt < 3) {
          setTimeout(() => this.loadDataWithRetry(key, callback, attempt + 1), 500);
        } else {
          // 最后一次失败后尝试从chrome.storage.sync加载
          chrome.storage.sync.get([key], (syncResult) => {
            if (chrome.runtime.lastError) {
              console.error('同步存储加载也失败:', chrome.runtime.lastError);
              this.elements.notesList.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">笔记加载失败，请检查扩展权限或刷新页面</p>';
            } else {
              callback(syncResult[key]);
            }
          });
        }
        return;
      }
      
      callback(result[key]);
    });
  },
  
  // 渲染笔记列表
  renderNotes(notes) {
    if (!this.elements.notesList) return;
    
    if (!notes || notes.length === 0) {
      this.elements.notesList.innerHTML = `
        <div class="hint-text">
          <p>还没有保存任何笔记</p>
          <p>在网页上按住Ctrl并选择文本即可保存</p>
        </div>
      `;
      return;
    }
    
    // 按时间排序，最新的在前面
    const sortedNotes = [...notes].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    let html = '';
    sortedNotes.forEach(note => {
      // 格式化日期为 YYYY-MM-DD
      const formattedDate = this.formatDate(note.createdAt);
      
      // 处理标签显示
      let tagsHtml = '';
      if (note.tags && note.tags.length > 0) {
        tagsHtml = `<div class="note-tags">
          ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>`;
      }
      
      // 精简网址显示，只保留域名部分
      let displayUrl = '';
      try {
        const url = new URL(note.url);
        displayUrl = url.hostname.replace('www.', '');
      } catch (e) {
        displayUrl = '网页';
      }
      
      // 构建笔记HTML
      html += `
        <div class="note-item" data-id="${note.id}">
          <div class="note-content">${this.formatContent(note.content)}</div>
          ${tagsHtml}
          <div class="note-meta">
            ${formattedDate} · 
            <a href="${note.url}" target="_blank" class="note-url" title="${note.url}">${displayUrl}</a>
            <span class="spacer"></span>
            <span class="edit-tags" data-id="${note.id}" title="编辑标签">标签</span>
            <span class="delete-note" data-id="${note.id}" title="删除笔记">删除</span>
          </div>
        </div>
      `;
    });
    
    this.elements.notesList.innerHTML = html;
  },
  
  // 格式化日期为 YYYY-MM-DD
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  // 格式化笔记内容
  formatContent(content) {
    // 检测内容长度，超过一定长度将截断
    const MAX_LENGTH = 280;
    if (content.length > MAX_LENGTH) {
      return content.substring(0, MAX_LENGTH) + '...';
    }
    return content;
  },
  
  // 删除笔记
  deleteNote(noteId) {
    if (confirm('确定要删除这条笔记吗？')) {
      chrome.runtime.sendMessage({
        type: 'delete_note',
        id: noteId
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('删除请求失败:', chrome.runtime.lastError);
          alert('删除失败，请刷新页面后重试');
          return;
        }
        
        if (response && response.status === 'success') {
          // 更新本地数据
          this.data.notes = this.data.notes.filter(n => n.id !== noteId);
          this.renderNotes(this.data.notes);
        } else {
          alert(response?.message || '删除失败，请重试');
        }
      });
    }
  },
  
  // 编辑笔记标签
  editNoteTags(noteId) {
    const note = this.data.notes.find(n => n.id === noteId);
    if (!note) {
      alert('找不到指定笔记');
      return;
    }
    
    // 显示标签编辑对话框
    const tagsInput = prompt('编辑标签(用逗号分隔)', note.tags ? note.tags.join(', ') : '');
    if (tagsInput === null) return; // 用户取消
    
    // 处理标签输入
    const newTags = tagsInput.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    // 更新笔记
    chrome.runtime.sendMessage({
      type: 'update_tags',
      id: noteId,
      tags: newTags
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('更新标签请求失败:', chrome.runtime.lastError);
        alert('更新标签失败，请刷新页面后重试');
        return;
      }
      
      if (response && response.status === 'success') {
        // 更新本地数据
        const noteIndex = this.data.notes.findIndex(n => n.id === noteId);
        if (noteIndex !== -1) {
          this.data.notes[noteIndex].tags = newTags;
          this.renderNotes(this.data.notes);
        }
      } else {
        alert(response?.message || '标签更新失败');
      }
    });
  },
  
  // 显示导出选项
  showExportOptions() {
    if (!this.data.notes || this.data.notes.length === 0) {
      alert('没有可导出的笔记');
      return;
    }
    
    // 移除可能已存在的导出菜单
    const existingMenu = document.querySelector('.export-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // 创建导出菜单
    const exportMenu = document.createElement('div');
    exportMenu.className = 'export-menu';
    exportMenu.innerHTML = `
      <div class="export-menu-header">导出选项</div>
      <div class="export-options">
        <div class="export-option" data-format="json">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M12 18v-6"></path>
            <path d="M8 18v-1"></path>
            <path d="M16 18v-3"></path>
          </svg>
          <div class="option-content">
            <span class="option-label">JSON 格式</span>
            <span class="option-desc">导出完整数据结构</span>
          </div>
        </div>
        <div class="export-option" data-format="csv">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
          </svg>
          <div class="option-content">
            <span class="option-label">CSV 格式</span>
            <span class="option-desc">适用于电子表格软件</span>
          </div>
        </div>
        <div class="export-option" data-format="txt">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <div class="option-content">
            <span class="option-label">TXT 格式</span>
            <span class="option-desc">纯文本，适用于任何环境</span>
          </div>
        </div>
      </div>
    `;
    
    // 添加菜单样式
    const style = document.createElement('style');
    style.textContent = `
      .export-menu {
        position: absolute;
        top: 64px;
        right: 20px;
        background: var(--bg-color);
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
        z-index: 1000;
        overflow: hidden;
        width: 280px;
        animation: fadeIn 0.2s ease-out;
        border: 1px solid var(--border-color);
      }
      
      .export-menu-header {
        padding: 14px 16px;
        font-size: 15px;
        font-weight: 500;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-color);
      }
      
      .export-options {
        padding: 8px 0;
      }
      
      .export-option {
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        color: var(--text-color);
        transition: all 0.2s ease;
      }
      
      .export-option:hover {
        background-color: var(--hover-bg-color);
      }
      
      .export-option svg {
        color: var(--accent-color);
        opacity: 0.9;
      }
      
      .option-content {
        display: flex;
        flex-direction: column;
      }
      
      .option-label {
        font-size: 14px;
        font-weight: 500;
      }
      
      .option-desc {
        font-size: 12px;
        color: var(--secondary-text);
        margin-top: 2px;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .export-menu-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999;
        background-color: rgba(0, 0, 0, 0.06);
        backdrop-filter: blur(2px);
        animation: fadeBackdrop 0.2s ease-out;
      }
      
      @keyframes fadeBackdrop {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // 创建背景遮罩（用于捕获点击事件关闭菜单）
    const backdrop = document.createElement('div');
    backdrop.className = 'export-menu-backdrop';
    document.body.appendChild(backdrop);
    document.body.appendChild(exportMenu);
    
    // 处理导出选项点击
    exportMenu.querySelectorAll('.export-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const format = e.currentTarget.dataset.format;
        
        if (format === 'json') {
          this.exportNotesAsJSON(this.data.notes);
        } else if (format === 'csv') {
          this.exportNotesAsCSV(this.data.notes);
        } else if (format === 'txt') {
          this.exportNotesAsTXT(this.data.notes);
        }
        
        // 关闭菜单
        exportMenu.remove();
        backdrop.remove();
        style.remove();
      });
    });
    
    // 点击背景关闭菜单
    backdrop.addEventListener('click', () => {
      exportMenu.remove();
      backdrop.remove();
      style.remove();
    });
  },
  
  // 导出笔记为JSON
  exportNotesAsJSON(notes) {
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    this.downloadFile(blob, 'mindful_notes.json');
  },
  
  // 导出笔记为CSV
  exportNotesAsCSV(notes) {
    const headers = ['内容', '标题', '来源URL', '标签', '创建时间', '更新时间'];
    const csvRows = [];
    
    // 添加表头
    csvRows.push(headers.join(','));
    
    // 添加数据行
    notes.forEach(note => {
      const tags = note.tags ? note.tags.join(';') : '';
      const row = [
        `"${note.content.replace(/"/g, '""')}"`,
        `"${note.title.replace(/"/g, '""')}"`,
        `"${note.url}"`,
        `"${tags}"`,
        `"${note.createdAt}"`,
        `"${note.updatedAt}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, 'mindful_notes.csv');
  },
  
  // 导出笔记为TXT
  exportNotesAsTXT(notes) {
    let txtContent = '';
    
    notes.forEach((note, index) => {
      const tags = note.tags && note.tags.length > 0 ? `[${note.tags.join(', ')}]` : '';
      
      txtContent += `--- 笔记 ${index + 1} ---\n`;
      txtContent += `${note.content}\n\n`;
      txtContent += `标签: ${tags}\n`;
      txtContent += `来源: ${note.url}\n`;
      txtContent += `时间: ${new Date(note.createdAt).toLocaleString()}\n`;
      txtContent += `\n\n`;
    });
    
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    this.downloadFile(blob, 'mindful_notes.txt');
  },
  
  // 下载文件
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
};

// 初始化弹出窗口
PopupManager.initialize();