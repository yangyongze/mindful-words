// 弹出窗口管理对象
const PopupManager = {
  elements: {
    notesList: null,
    settingsBtn: null,
    selectBtn: null,
    searchInput: null,
    clearSearchBtn: null,
    editModal: null,
    editContent: null,
    editNote: null,
    editTags: null,
    closeModal: null,
    cancelEdit: null,
    saveEdit: null,
    confirmModal: null,
    confirmTitle: null,
    confirmMessage: null,
    confirmCancel: null,
    confirmOk: null,
    tagsModal: null,
    tagsInput: null,
    closeTagsModal: null,
    cancelTags: null,
    saveTags: null,
    selectionBar: null,
    selectAllCheckbox: null,
    selectionCount: null,
    copySelectedBtn: null,
    exportSelectedBtn: null,
    deleteSelectedBtn: null,
    cancelSelectionBtn: null,
    filterTagsBtn: null,
    filterTimeBtn: null,
    filterSourceBtn: null,
    clearFiltersBtn: null,
    activeFilters: null
  },
  
  data: {
    notes: [],
    filteredNotes: [],
    currentEditingNote: null,
    searchQuery: '',
    confirmCallback: null,
    editingTagsNoteId: null,
    selectionMode: false,
    selectedNoteIds: new Set(),
    filters: {
      tags: [],
      timeRange: null,
      sources: []
    },
    settings: {
      theme: 'light'
    }
  },

  i18n(key, substitutions) {
    return I18n.get(key, substitutions);
  },

  applyTranslations() {
    I18n.applyToDocument();
  },
  
  initialize() {
    document.addEventListener('DOMContentLoaded', () => {
      I18n.init(() => {
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
        this.loadNotes();
        this.restoreScrollPosition();
        this.applyTranslations();
      });
    });
  },
  
  // 初始化DOM元素引用
  initializeElements() {
    this.elements.notesList = document.getElementById('notes-list');
    this.elements.settingsBtn = document.getElementById('settings-btn');
    this.elements.selectBtn = document.getElementById('select-btn');
    this.elements.searchInput = document.getElementById('search-input');
    this.elements.clearSearchBtn = document.getElementById('clear-search');
    this.elements.editModal = document.getElementById('edit-modal');
    this.elements.editContent = document.getElementById('edit-content');
    this.elements.editNote = document.getElementById('edit-note');
    this.elements.editTags = document.getElementById('edit-tags');
    this.elements.closeModal = document.getElementById('close-modal');
    this.elements.cancelEdit = document.getElementById('cancel-edit');
    this.elements.saveEdit = document.getElementById('save-edit');
    this.elements.confirmModal = document.getElementById('confirm-modal');
    this.elements.confirmTitle = document.getElementById('confirm-title');
    this.elements.confirmMessage = document.getElementById('confirm-message');
    this.elements.confirmCancel = document.getElementById('confirm-cancel');
    this.elements.confirmOk = document.getElementById('confirm-ok');
    this.elements.tagsModal = document.getElementById('tags-modal');
    this.elements.tagsInput = document.getElementById('tags-input');
    this.elements.closeTagsModal = document.getElementById('close-tags-modal');
    this.elements.cancelTags = document.getElementById('cancel-tags');
    this.elements.saveTags = document.getElementById('save-tags');
    this.elements.selectionBar = document.getElementById('selection-bar');
    this.elements.selectAllCheckbox = document.getElementById('select-all-checkbox');
    this.elements.selectionCount = document.getElementById('selection-count');
    this.elements.copySelectedBtn = document.getElementById('copy-selected-btn');
    this.elements.exportSelectedBtn = document.getElementById('export-selected-btn');
    this.elements.deleteSelectedBtn = document.getElementById('delete-selected-btn');
    this.elements.cancelSelectionBtn = document.getElementById('cancel-selection-btn');
    this.elements.filterTagsBtn = document.getElementById('filter-tags-btn');
    this.elements.filterTimeBtn = document.getElementById('filter-time-btn');
    this.elements.filterSourceBtn = document.getElementById('filter-source-btn');
    this.elements.clearFiltersBtn = document.getElementById('clear-filters-btn');
    this.elements.activeFilters = document.getElementById('active-filters');
  },
  
  // 设置事件监听器
  setupEventListeners() {
    // 设置按钮点击事件
    this.elements.settingsBtn.addEventListener('click', () => {
      if (chrome?.runtime?.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
    });
    
    // 选择模式事件监听
    document.addEventListener('click', (e) => {
      // 点击复选框
      if (e.target.classList.contains('note-checkbox')) {
        e.stopPropagation();
        const noteId = parseInt(e.target.dataset.id);
        this.toggleNoteSelection(noteId);
        return;
      }
      
      // 点击删除按钮
      if (e.target.classList.contains('delete-btn')) {
        e.stopPropagation();
        const noteId = parseInt(e.target.dataset.id);
        this.deleteNote(noteId);
        return;
      }
      
      // 选择模式下点击笔记卡片
      if (this.data.selectionMode) {
        const noteItem = e.target.closest('.note-item');
        if (noteItem) {
          const noteId = parseInt(noteItem.dataset.id);
          this.toggleNoteSelection(noteId);
        }
        return;
      }
      
      // 点击链接不触发编辑
      if (e.target.classList.contains('note-url')) {
        return;
      }
      
      // 点击笔记卡片打开编辑
      const noteItem = e.target.closest('.note-item');
      if (noteItem && !e.target.classList.contains('action-btn')) {
        const noteId = parseInt(noteItem.dataset.id);
        this.openEditModal(noteId);
      }
    });
    
    // 监听主题变更消息
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((request) => {
        if (request.type === 'update_theme') {
          this.applyTheme(request.theme);
        }
        // Listen for new note saved from content script
        if (request.type === 'note_saved') {
          this.refreshNotesList();
        }
      });
    }
    
    // Listen for storage changes to update notes in real-time
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.notes) {
          const newNotes = changes.notes.newValue;
          const oldNotes = changes.notes.oldValue || [];
          
          // Check if a new note was added
          if (newNotes && newNotes.length > oldNotes.length) {
            console.log('[Mindful Words] New note detected, refreshing list');
            this.data.notes = newNotes;
            this.renderNotes(newNotes);
            this.showNewNoteIndicator();
          }
        }
      });
    }
    
    // 监听滚动事件，保存滚动位置
    let scrollTimeout;
    this.elements.notesList.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.saveScrollPosition();
      }, 300); // 防抖，300ms后保存
    });
    
    // 搜索功能事件监听
    this.elements.searchInput.addEventListener('input', (e) => {
      this.searchNotes(e.target.value);
    });
    
    this.elements.clearSearchBtn.addEventListener('click', () => {
      this.elements.searchInput.value = '';
      this.searchNotes('');
    });
    
    // 编辑模态框事件监听
    this.elements.closeModal.addEventListener('click', () => {
      this.closeEditModal();
    });
    
    this.elements.cancelEdit.addEventListener('click', () => {
      this.closeEditModal();
    });
    
    this.elements.saveEdit.addEventListener('click', () => {
      this.saveNoteEdit();
    });
    
    // 点击模态框背景关闭
    this.elements.editModal.addEventListener('click', (e) => {
      if (e.target === this.elements.editModal) {
        this.closeEditModal();
      }
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.elements.editModal.style.display === 'flex') {
          this.closeEditModal();
        } else if (this.elements.confirmModal.style.display === 'flex') {
          this.closeConfirmModal();
        } else if (this.elements.tagsModal.style.display === 'flex') {
          this.closeTagsModal();
        }
      }
    });
    
    // 确认对话框事件监听
    this.elements.confirmCancel.addEventListener('click', () => {
      this.closeConfirmModal();
    });
    
    this.elements.confirmOk.addEventListener('click', () => {
      const callback = this.data.confirmCallback;
      this.closeConfirmModal();
      if (callback) callback();
    });
    
    this.elements.confirmModal.addEventListener('click', (e) => {
      if (e.target === this.elements.confirmModal) {
        this.closeConfirmModal();
      }
    });
    
    // 标签编辑对话框事件监听
    this.elements.closeTagsModal.addEventListener('click', () => {
      this.closeTagsModal();
    });
    
    this.elements.cancelTags.addEventListener('click', () => {
      this.closeTagsModal();
    });
    
    this.elements.saveTags.addEventListener('click', () => {
      this.saveTagsEdit();
    });
    
    this.elements.tagsModal.addEventListener('click', (e) => {
      if (e.target === this.elements.tagsModal) {
        this.closeTagsModal();
      }
    });

    // 选择模式事件监听
    this.elements.selectBtn.addEventListener('click', () => {
      this.toggleSelectionMode();
    });
    
    this.elements.selectAllCheckbox.addEventListener('change', (e) => {
      this.toggleSelectAll(e.target.checked);
    });
    
    this.elements.copySelectedBtn.addEventListener('click', () => {
      this.copySelectedNotes();
    });
    
    this.elements.exportSelectedBtn.addEventListener('click', () => {
      this.showExportOptions();
    });
    
    this.elements.deleteSelectedBtn.addEventListener('click', () => {
      this.deleteSelectedNotes();
    });
    
    this.elements.cancelSelectionBtn.addEventListener('click', () => {
      this.exitSelectionMode();
    });
    
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
  },
  
  // 从存储加载设置
  loadSettings() {
    if (!chrome?.storage?.local) {
      console.error('Chrome storage API not available');
      return;
    }
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
        this.elements.notesList.innerHTML = `<p style="text-align: center; padding: 20px;">${this.i18n('noNotes')}</p>`;
      }
    });
  },
  
  // Refresh notes list (for real-time updates)
  refreshNotesList() {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(['notes'], (result) => {
      if (chrome.runtime.lastError) return;
      if (result.notes && Array.isArray(result.notes)) {
        this.data.notes = result.notes;
        this.renderNotes(result.notes);
        this.showNewNoteIndicator();
      }
    });
  },
  
  // Show indicator when new note is added
  showNewNoteIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'new-note-indicator';
    indicator.textContent = this.i18n('newNoteAdded');
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      animation: fadeInOut 2s ease-in-out forwards;
    `;
    
    // Add animation style if not exists
    if (!document.getElementById('new-note-indicator-style')) {
      const style = document.createElement('style');
      style.id = 'new-note-indicator-style';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0); }
          80% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      indicator.remove();
    }, 2000);
  },
  
  // 带重试功能的数据加载
  loadDataWithRetry(key, callback, attempt = 1) {
    if (!chrome?.storage?.local) {
      this.elements.notesList.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">扩展上下文已失效，请刷新页面</p>';
      return;
    }
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        console.error(`存储获取失败(尝试 ${attempt}):`, chrome.runtime.lastError);
        if (attempt < 3) {
          setTimeout(() => this.loadDataWithRetry(key, callback, attempt + 1), 500);
        } else {
          // 最后一次失败后尝试从chrome.storage.sync加载
          if (chrome?.storage?.sync) {
            chrome.storage.sync.get([key], (syncResult) => {
              if (chrome.runtime.lastError) {
                console.error('同步存储加载也失败:', chrome.runtime.lastError);
                this.elements.notesList.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">${this.i18n('loadFailed')}</p>`;
              } else {
                callback(syncResult[key]);
              }
            });
          } else {
            this.elements.notesList.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">${this.i18n('loadFailed')}</p>`;
          }
        }
        return;
      }
      
      callback(result[key]);
    });
  },
  
  // 渲染笔记列表
  renderNotes(notes) {
    if (!this.elements.notesList) return;
    
    let notesToRender = notes;
    if (!notesToRender) {
      if (this.data.searchQuery || this.hasActiveFilters()) {
        notesToRender = this.data.filteredNotes;
      } else {
        notesToRender = this.data.notes;
      }
    }
    
    if (!notesToRender || notesToRender.length === 0) {
      let message = this.i18n('noNotes');
      let hint = this.i18n('noNotesHint');
      
      if (this.data.searchQuery || this.hasActiveFilters()) {
        message = this.i18n('noMatchingNotes');
        hint = this.i18n('tryOtherKeywords');
      } else {
        message = this.i18n('noFilteredNotes');
        hint = this.i18n('adjustFilters');
      }
      
      this.elements.notesList.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <p class="empty-title">${message}</p>
          <p class="empty-hint">${hint}</p>
        </div>
      `;
      return;
    }
    
    const sortedNotes = [...notesToRender].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    let html = '';
    sortedNotes.forEach(note => {
      const formattedDate = this.formatDate(note.createdAt);
      const escapedId = this.escapeHtml(note.id);
      
      let tagsHtml = '';
      if (note.tags && note.tags.length > 0) {
        tagsHtml = `<div class="note-tags">
          ${note.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>`;
      }
      
      let noteHtml = '';
      if (note.note && note.note.trim()) {
        noteHtml = `<div class="note-personal-note">${this.formatContent(note.note)}</div>`;
      }
      
      let displayUrl = '';
      let safeUrl = '#';
      try {
        if (note.url) {
          const url = new URL(note.url);
          displayUrl = url.hostname.replace('www.', '');
          safeUrl = this.escapeHtml(note.url);
        } else {
          displayUrl = this.i18n('webpage');
        }
      } catch (e) {
        displayUrl = this.i18n('webpage');
      }
      
      const isSelected = this.data.selectedNoteIds.has(note.id);
      const hasCheckboxClass = this.data.selectionMode ? 'has-checkbox' : '';
      const selectedClass = isSelected ? 'selected' : '';
      
      html += `
        <div class="note-item ${hasCheckboxClass} ${selectedClass}" data-id="${escapedId}">
          ${this.data.selectionMode ? `<input type="checkbox" class="note-checkbox" ${isSelected ? 'checked' : ''} data-id="${escapedId}">` : ''}
          <div class="note-content">${this.formatContent(note.content)}</div>
          ${noteHtml}
          ${tagsHtml}
          <div class="note-meta">
            ${formattedDate} · 
            <a href="${safeUrl}" target="_blank" class="note-url" title="${safeUrl}">${this.escapeHtml(displayUrl)}</a>
            <span class="spacer"></span>
            ${!this.data.selectionMode ? `<span class="action-btn delete-btn" data-id="${escapedId}" title="${this.i18n('deleteNote')}">${this.i18n('btnDelete')}</span>` : ''}
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
    const MAX_LENGTH = 280;
    const escaped = this.escapeHtml(content || '');
    if (escaped.length > MAX_LENGTH) {
      return escaped.substring(0, MAX_LENGTH) + '...';
    }
    return escaped;
  },
  
  // HTML 转义函数 - 防止 XSS 攻击
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!chrome?.runtime?.sendMessage) {
        reject(new Error('Extension context invalidated. Please reload the extension.'));
        return;
      }
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'Extension communication error'));
        } else {
          resolve(response);
        }
      });
    });
  },
  
  // 删除笔记
  deleteNote(noteId) {
    this.showConfirm(this.i18n('confirmDelete'), this.i18n('confirmDeleteMessage'), async () => {
      try {
        const response = await this.sendMessage({
          type: 'delete_note',
          id: noteId
        });
        
        if (response && response.status === 'success') {
          this.data.notes = this.data.notes.filter(n => n.id !== noteId);
          this.renderNotes(this.data.notes);
        } else {
          this.showToast(response?.message || this.i18n('deleteFailed'), 'error');
        }
      } catch (error) {
        console.error('Delete request failed:', error);
        this.showToast(this.i18n('deleteFailed'), 'error');
      }
    });
  },
  
  // 编辑笔记标签
  editNoteTags(noteId) {
    const note = this.data.notes.find(n => n.id === noteId);
    if (!note) {
      this.showToast(this.i18n('noteNotFound'), 'error');
      return;
    }
    
    this.data.editingTagsNoteId = noteId;
    this.elements.tagsInput.value = note.tags ? note.tags.join(', ') : '';
    this.elements.tagsModal.style.display = 'flex';
    
    setTimeout(() => {
      this.elements.tagsInput.focus();
    }, 100);
  },
  
  // AnkiConnect integration
  async checkAnkiConnect() {
    try {
      const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'version', version: 5 })
      });
      const data = await response.json();
      return data && !data.error;
    } catch (error) {
      console.error('[Mindful Words] AnkiConnect check failed:', error);
      return false;
    }
  },
  
  async getAnkiDecks() {
    try {
      const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deckNames', version: 5 })
      });
      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('[Mindful Words] Get Anki decks failed:', error);
      return [];
    }
  },
  
  async getAnkiModels() {
    try {
      const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'modelNames', version: 5 })
      });
      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('[Mindful Words] Get Anki models failed:', error);
      return [];
    }
  },
  
  async getAnkiModelFields(modelName) {
    try {
      const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'modelFieldNames', version: 5, params: { modelName } })
      });
      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('[Mindful Words] Get Anki model fields failed:', error);
      return [];
    }
  },
  
  async sendToAnkiConnect(notes) {
    try {
      const connected = await this.checkAnkiConnect();
      if (!connected) {
        this.showToast(this.i18n('ankiConnectNotRunning'), 'error');
        return;
      }
      
      const decks = await this.getAnkiDecks();
      if (!decks || decks.length === 0) {
        this.showToast(this.i18n('ankiConnectError'), 'error');
        return;
      }
      
      this.showDeckSelectionDialog(notes, decks);
    } catch (error) {
      console.error('[Mindful Words] Send to Anki failed:', error);
      this.showToast(this.i18n('ankiConnectError'), 'error');
    }
  },
  
  showDeckSelectionDialog(notes, decks) {
    const existingDialog = document.querySelector('.deck-selection-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }
    
    const existingBackdrop = document.querySelector('.deck-selection-backdrop');
    if (existingBackdrop) {
      existingBackdrop.remove();
    }
    
    const backdrop = document.createElement('div');
    backdrop.className = 'deck-selection-backdrop';
    document.body.appendChild(backdrop);
    
    const dialog = document.createElement('div');
    dialog.className = 'deck-selection-dialog';
    dialog.innerHTML = `
      <div class="deck-selection-header">${this.i18n('sendToAnki')}</div>
      <div class="deck-selection-body">
        <div class="deck-selection-label">${this.i18n('selectDeck')}</div>
        <select class="deck-selection-dropdown" id="deck-select">
          ${decks.map(deck => `<option value="${deck}">${deck}</option>`)}
        </select>
        <div class="deck-selection-label" style="margin-top: 12px;">${this.i18n('selectModel')}</div>
        <select class="deck-selection-dropdown" id="model-select">
          <option value="">${this.i18n('loading')}</option>
        </select>
        <div class="deck-selection-count">${this.i18n('willSendNotes').replace('{count}', notes.length)}</div>
      </div>
      <div class="deck-selection-footer">
        <button class="deck-selection-cancel">${this.i18n('cancel')}</button>
        <button class="deck-selection-send">${this.i18n('send')}</button>
      </div>
    `;
    document.body.appendChild(dialog);
    
    // Load models
    this.getAnkiModels().then(models => {
      const modelSelect = dialog.querySelector('#model-select');
      if (models && models.length > 0) {
        const preferredModel = models.find(m => m === 'Basic') || models.find(m => m.toLowerCase().includes('basic')) || models[0];
        modelSelect.innerHTML = models.map(m => 
          `<option value="${m}" ${m === preferredModel ? 'selected' : ''}>${m}</option>`
        ).join('');
      } else {
        modelSelect.innerHTML = `<option value="">${this.i18n('noModelsFound')}</option>`;
        dialog.querySelector('.deck-selection-send').disabled = true;
      }
    }).catch(err => {
      console.error('[Mindful Words] getAnkiModels error:', err);
    });
    
    dialog.querySelector('.deck-selection-cancel').addEventListener('click', () => {
      dialog.remove();
      backdrop.remove();
    });
    
    dialog.querySelector('.deck-selection-send').addEventListener('click', async () => {
      const selectedDeck = dialog.querySelector('#deck-select').value;
      const selectedModel = dialog.querySelector('#model-select').value;
      
      if (!selectedModel) {
        this.showToast(this.i18n('noModelsFound'), 'error');
        return;
      }
      
      dialog.remove();
      backdrop.remove();
      await this.sendNotesToAnki(notes, selectedDeck, selectedModel);
    });
    
    backdrop.addEventListener('click', () => {
      dialog.remove();
      backdrop.remove();
    });
  },
  
  formatBackContent(note) {
    const parts = [];
    
    if (note.note && note.note.trim()) {
      parts.push(`${this.i18n('personalNote')}: ${note.note}`);
    }
    
    if (note.title || note.url) {
      const source = note.title || this.i18n('webpage');
      parts.push(`${this.i18n('source')}: ${source} - ${note.url}`);
    }
    
    if (note.tags && note.tags.length > 0) {
      parts.push(`${this.i18n('filterTags')}: ${note.tags.join(', ')}`);
    }
    
    if (note.createdAt) {
      const date = new Date(note.createdAt).toLocaleDateString();
      parts.push(`${this.i18n('time')}: ${date}`);
    }
    
    return parts.join('<br>');
  },
  
  // 保存滚动位置
  saveScrollPosition() {
    try {
      const scrollTop = this.elements.notesList.scrollTop;
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ 'popup_scroll_position': scrollTop });
      }
    } catch (error) {
      console.error('保存滚动位置失败:', error);
    }
  },
  
  // 恢复滚动位置
  restoreScrollPosition() {
    try {
      if (!chrome?.storage?.local) return;
      chrome.storage.local.get(['popup_scroll_position'], (result) => {
        if (result.popup_scroll_position !== undefined) {
          // 稍微延迟以确保DOM已渲染
          setTimeout(() => {
            this.elements.notesList.scrollTop = result.popup_scroll_position;
          }, 100);
        }
      });
    } catch (error) {
      console.error('恢复滚动位置失败:', error);
    }
  },
  
  // 搜索笔记
  searchNotes(query) {
    this.data.searchQuery = query.trim();
    this.applyFilters();
  },
  
  // 打开编辑模态框
  openEditModal(noteId) {
    const note = this.data.notes.find(n => n.id === noteId);
    if (!note) {
      console.error('找不到要编辑的笔记');
      return;
    }
    
    this.data.currentEditingNote = note;
    this.elements.editContent.value = note.content;
    this.elements.editNote.value = note.note || '';
    this.elements.editTags.value = note.tags ? note.tags.join(', ') : '';
    this.elements.editModal.style.display = 'flex';
    
    // 聚焦到内容输入框
    setTimeout(() => {
      this.elements.editContent.focus();
    }, 100);
  },
  
  // 关闭编辑模态框
  closeEditModal() {
    this.elements.editModal.style.display = 'none';
    this.data.currentEditingNote = null;
    this.elements.editContent.value = '';
    this.elements.editNote.value = '';
    this.elements.editTags.value = '';
  },
  
  // 保存笔记编辑
  async saveNoteEdit() {
    if (!this.data.currentEditingNote) {
      console.error('没有正在编辑的笔记');
      return;
    }
    
    const content = this.elements.editContent.value.trim();
    if (!content) {
      this.showToast(this.i18n('contentCannotBeEmpty'), 'error');
      return;
    }
    
    const noteText = this.elements.editNote.value.trim();
    const tagsInput = this.elements.editTags.value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // 更新笔记
    const updatedNote = {
      ...this.data.currentEditingNote,
      content: content,
      note: noteText,
      tags: tags,
      updatedAt: new Date().toISOString()
    };
    
    // 发送更新消息到background
    try {
      const response = await this.sendMessage({
        type: 'update_note',
        id: this.data.currentEditingNote.id,
        noteData: updatedNote
      });
      
      if (response && response.status === 'success') {
        // 更新本地数据
        const noteIndex = this.data.notes.findIndex(n => n.id === this.data.currentEditingNote.id);
        if (noteIndex !== -1) {
          this.data.notes[noteIndex] = updatedNote;
        }
        
        // 如果有搜索，更新过滤结果
        if (this.data.searchQuery) {
          this.searchNotes(this.data.searchQuery);
        } else {
          this.renderNotes();
        }
        
        this.closeEditModal();
      } else {
        this.showToast(this.i18n('updateFailed'), 'error');
      }
    } catch (error) {
      console.error('Update note failed:', error);
      this.showToast(this.i18n('updateFailed'), 'error');
    }
  },
  
  // 显示确认对话框
  showConfirm(title, message, callback) {
    this.elements.confirmTitle.textContent = title;
    this.elements.confirmMessage.textContent = message;
    this.data.confirmCallback = callback;
    this.elements.confirmModal.style.display = 'flex';
  },
  
  // 关闭确认对话框
  closeConfirmModal() {
    this.elements.confirmModal.style.display = 'none';
    this.data.confirmCallback = null;
  },
  
  // 关闭标签编辑对话框
  closeTagsModal() {
    this.elements.tagsModal.style.display = 'none';
    this.data.editingTagsNoteId = null;
    this.elements.tagsInput.value = '';
  },
  
  // 保存标签编辑
  async saveTagsEdit() {
    if (!this.data.editingTagsNoteId) {
      console.error('没有正在编辑标签的笔记');
      return;
    }
    
    const tagsInput = this.elements.tagsInput.value.trim();
    const newTags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    try {
      const response = await this.sendMessage({
        type: 'update_tags',
        id: this.data.editingTagsNoteId,
        tags: newTags
      });
      
      if (response && response.status === 'success') {
        const noteIndex = this.data.notes.findIndex(n => n.id === this.data.editingTagsNoteId);
        if (noteIndex !== -1) {
          this.data.notes[noteIndex].tags = newTags;
          this.renderNotes(this.data.notes);
        }
        this.closeTagsModal();
      } else {
        this.showToast(response?.message || '标签更新失败', 'error');
      }
    } catch (error) {
      console.error('更新标签请求失败:', error);
      this.showToast(this.i18n('updateFailed'), 'error');
    }
  },
  
  // 显示提示消息
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `copy-toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  },
  
  // 切换选择模式
  toggleSelectionMode() {
    this.data.selectionMode = !this.data.selectionMode;
    
    if (this.data.selectionMode) {
      this.elements.selectionBar.classList.remove('hidden');
      this.elements.selectBtn.classList.add('active');
      this.data.selectedNoteIds.clear();
    } else {
      this.exitSelectionMode();
    }
    
    this.renderNotes();
    this.updateSelectionUI();
  },
  
  // 退出选择模式
  exitSelectionMode() {
    this.data.selectionMode = false;
    this.data.selectedNoteIds.clear();
    this.elements.selectionBar.classList.add('hidden');
    this.elements.selectBtn.classList.remove('active');
    this.elements.selectAllCheckbox.checked = false;
    this.renderNotes();
    this.updateSelectionUI();
  },
  
  // 切换全选
  toggleSelectAll(checked) {
    if (checked) {
      this.data.notes.forEach(note => {
        this.data.selectedNoteIds.add(note.id);
      });
    } else {
      this.data.selectedNoteIds.clear();
    }
    this.renderNotes();
    this.updateSelectionUI();
  },
  
  // 切换单个笔记选择
  toggleNoteSelection(noteId) {
    if (this.data.selectedNoteIds.has(noteId)) {
      this.data.selectedNoteIds.delete(noteId);
    } else {
      this.data.selectedNoteIds.add(noteId);
    }
    
    // 只更新特定笔记的 UI，而不是重新渲染整个列表
    const noteItem = document.querySelector(`.note-item[data-id="${noteId}"]`);
    const checkbox = document.querySelector(`.note-checkbox[data-id="${noteId}"]`);
    
    if (noteItem) {
      noteItem.classList.toggle('selected', this.data.selectedNoteIds.has(noteId));
    }
    if (checkbox) {
      checkbox.checked = this.data.selectedNoteIds.has(noteId);
    }
    
    this.updateSelectionUI();
  },
  
  // 更新选择UI
  updateSelectionUI() {
    const count = this.data.selectedNoteIds.size;
    this.elements.selectionCount.textContent = this.i18n('selectedCount', [count.toString()]);
    this.elements.selectAllCheckbox.checked = count === this.data.notes.length && count > 0;
    this.elements.copySelectedBtn.disabled = count === 0;
    this.elements.exportSelectedBtn.disabled = count === 0;
    this.elements.deleteSelectedBtn.disabled = count === 0;
  },
  
  // 复制选中的笔记
  copySelectedNotes() {
    const selectedNotes = this.data.notes.filter(note => 
      this.data.selectedNoteIds.has(note.id)
    );
    
    if (selectedNotes.length === 0) {
      this.showToast(this.i18n('selectNotesFirst'), 'error');
      return;
    }
    
    const text = this.formatNotesForCopy(selectedNotes);
    this.copyToClipboard(text);
  },
  
  deleteSelectedNotes() {
    const count = this.data.selectedNoteIds.size;
    if (count === 0) {
      this.showToast(this.i18n('selectNotesFirst'), 'error');
      return;
    }
    
    this.showConfirm(
      this.i18n('confirmDelete'),
      this.i18n('confirmBatchDeleteMessage', [count.toString()]),
      async () => {
        try {
          const selectedIds = Array.from(this.data.selectedNoteIds);
          const response = await this.sendMessage({
            type: 'delete_notes',
            ids: selectedIds
          });
          
          if (response && response.status === 'success') {
            this.data.notes = this.data.notes.filter(n => !this.data.selectedNoteIds.has(n.id));
            this.exitSelectionMode();
            this.renderNotes(this.data.notes);
            this.showToast(this.i18n('deleted', [count.toString()]));
          } else {
            this.showToast(response?.message || this.i18n('deleteFailed'), 'error');
          }
        } catch (error) {
          console.error('Batch delete failed:', error);
          this.showToast(this.i18n('deleteFailed'), 'error');
        }
      }
    );
  },
  
  formatNotesForCopy(notes) {
    return notes.map(note => {
    let text = note.content;
    if (note.note && note.note.trim()) {
      text += `\n\n${this.i18n('personalNote')}: ${note.note}`;
    }
    if (note.tags && note.tags.length > 0) {
      text += `\n${this.i18n('filterTags')}: ${note.tags.join(', ')}`;
    }
    return text;
  }).join('\n\n---\n\n');
  },
  
  // 显示导出选项
  showExportOptions() {
    const notesToExport = this.data.notes.filter(note => 
      this.data.selectedNoteIds.has(note.id)
    );
    
    if (!notesToExport || notesToExport.length === 0) {
      this.showToast(this.i18n('selectNotesFirst'), 'error');
      return;
    }
    
    // 移除可能已存在的导出菜单
    const existingMenu = document.querySelector('.export-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    const existingBackdrop = document.querySelector('.export-menu-backdrop');
    if (existingBackdrop) {
      existingBackdrop.remove();
    }
    
    // 创建导出菜单
    const exportMenu = document.createElement('div');
    exportMenu.className = 'export-menu';
    exportMenu.innerHTML = `
      <div class="export-menu-header">${this.i18n('exportOptions')}</div>
      <div class="export-options">
        <div class="export-option" data-format="ankiconnect">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <div class="option-content">
            <span class="option-label">${this.i18n('sendToAnki')}</span>
            <span class="option-desc">${this.i18n('sendToAnkiDesc')}</span>
          </div>
        </div>
        <div class="export-option" data-format="json">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <div class="option-content">
            <span class="option-label">${this.i18n('exportJSON')}</span>
            <span class="option-desc">${this.i18n('exportJSONDesc')}</span>
          </div>
        </div>
        <div class="export-option" data-format="csv">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <div class="option-content">
            <span class="option-label">${this.i18n('exportCSV')}</span>
            <span class="option-desc">${this.i18n('exportCSVDesc')}</span>
          </div>
        </div>
        <div class="export-option" data-format="txt">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <div class="option-content">
            <span class="option-label">${this.i18n('exportTXT')}</span>
            <span class="option-desc">${this.i18n('exportTXTDesc')}</span>
          </div>
        </div>
      </div>
    `;
    
    // 创建背景遮罩
    const backdrop = document.createElement('div');
    backdrop.className = 'export-menu-backdrop';
    document.body.appendChild(backdrop);
    document.body.appendChild(exportMenu);
    
    // 处理导出选项点击
    exportMenu.querySelectorAll('.export-option').forEach(option => {
      option.addEventListener('click', async (e) => {
        const format = e.currentTarget.dataset.format;
        
        if (format === 'ankiconnect') {
          await this.sendToAnkiConnect(notesToExport);
        } else if (format === 'json') {
          this.exportNotesAsJSON(notesToExport);
        } else if (format === 'csv') {
          this.exportNotesAsCSV(notesToExport);
        } else if (format === 'txt') {
          this.exportNotesAsTXT(notesToExport);
        }
        
        exportMenu.remove();
        backdrop.remove();
      });
    });
    
    // 点击背景关闭菜单
    backdrop.addEventListener('click', () => {
      exportMenu.remove();
      backdrop.remove();
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
    const headers = ['Content', 'Personal Note', 'Title', 'Source URL', 'Tags', 'Created', 'Updated'];
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    notes.forEach(note => {
      const tags = note.tags ? note.tags.join(';') : '';
      const noteText = note.note || '';
      const row = [
        `"${note.content.replace(/"/g, '""')}"`,
        `"${noteText.replace(/"/g, '""')}"`,
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
      
      txtContent += `--- ${this.i18n('note')} ${index + 1} ---\n`;
      txtContent += `${note.content}\n\n`;
      if (note.note && note.note.trim()) {
        txtContent += `${this.i18n('personalNote')}: ${note.note}\n\n`;
      }
      txtContent += `${this.i18n('filterTags')}: ${tags}\n`;
      txtContent += `${this.i18n('source')}: ${note.url}\n`;
      txtContent += `${this.i18n('time')}: ${new Date(note.createdAt).toLocaleString()}\n`;
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
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },
  
  // AnkiConnect integration
  async checkAnkiConnect() {
    try {
      const response = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'version', version: 5 })
      });
      const data = await response.json();
      return data && !data.error;
    } catch (error) {
      console.error('[Mindful Words] AnkiConnect check failed:', error);
      return false;
    }
  },
  
  async sendNotesToAnki(notes, deckName, modelName) {
    const fields = await this.getAnkiModelFields(modelName);
    
    if (!fields || fields.length === 0) {
      console.error('[Mindful Words] No fields found for model:', modelName);
      this.showToast(this.i18n('ankiConnectError'), 'error');
      return;
    }
    
    const frontField = fields[0];
    const backField = fields.length > 1 ? fields[1] : fields[0];
    
    const notesToAdd = notes.map(note => ({
      deckName: deckName,
      modelName: modelName,
      fields: {
        [frontField]: note.content,
        [backField]: this.formatBackContent(note)
      },
      tags: ['mindful-words', ...(note.tags || [])]
    }));
    
    try {
      // First check which notes can be added (filter duplicates)
      const canAddResponse = await fetch('http://127.0.0.1:8765', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'canAddNotes',
          version: 5,
          params: { notes: notesToAdd }
        })
      });
      
      const canAddData = await canAddResponse.json();
      
      if (canAddData.error) {
        this.showToast(this.i18n('ankiConnectError'), 'error');
        return;
      }
      
      const canAddResults = canAddData.result || canAddData;
      
      const filteredNotes = notesToAdd.filter((_, index) => canAddResults[index] === true);
      const duplicateCount = notesToAdd.length - filteredNotes.length;
      
      if (filteredNotes.length === 0) {
        this.showToast(this.i18n('allDuplicatesError'), 'error');
        return;
      }
      
      // Send notes one by one to handle partial failures
      let successCount = 0;
      let failedCount = 0;
      
      for (const note of filteredNotes) {
        try {
          const response = await fetch('http://127.0.0.1:8765', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'addNote',
              version: 5,
              params: { note: note }
            })
          });
          
          const data = await response.json();
          
          if (data.result && data.result !== null) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (e) {
          failedCount++;
        }
      }
      
      const totalSkipped = duplicateCount + failedCount;
      
      if (successCount === 0) {
        this.showToast(this.i18n('allDuplicatesError'), 'error');
        return;
      }
      
      if (totalSkipped > 0) {
        this.showToast(this.i18n('sendSuccessWithSkipped')
          .replace('{success}', successCount)
          .replace('{skipped}', totalSkipped));
      } else {
        this.showToast(this.i18n('sendSuccess').replace('{count}', successCount));
      }
    } catch (error) {
      console.error('[Mindful Words] Send notes to Anki failed:', error);
      this.showToast(this.i18n('ankiConnectError'), 'error');
    }
  },
  
  formatBackContent(note) {
    const parts = [];
    
    if (note.note && note.note.trim()) {
      parts.push(`${this.i18n('personalNote')}: ${note.note}`);
    }
    
    if (note.title || note.url) {
      const source = note.title || this.i18n('webpage');
      parts.push(`${this.i18n('source')}: ${source} - ${note.url}`);
    }
    
    if (note.tags && note.tags.length > 0) {
      parts.push(`${this.i18n('filterTags')}: ${note.tags.join(', ')}`);
    }
    
    if (note.createdAt) {
      const date = new Date(note.createdAt).toLocaleDateString();
      parts.push(`${this.i18n('time')}: ${date}`);
    }
    
    return parts.join('<br>');
  },
  
  // 显示筛选下拉面板
  showFilterDropdown(type) {
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
    
    this._currentFilterCloseHandler = (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        this.closeAllFilterDropdowns();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', this._currentFilterCloseHandler);
    }, 0);
  },
  
  // 关闭所有筛选下拉面板
  closeAllFilterDropdowns() {
    if (this._currentFilterCloseHandler) {
      document.removeEventListener('click', this._currentFilterCloseHandler);
      this._currentFilterCloseHandler = null;
    }
    document.querySelectorAll('.filter-dropdown').forEach(el => el.remove());
    if (this.elements.filterTagsBtn) this.elements.filterTagsBtn.classList.remove('active');
    if (this.elements.filterTimeBtn) this.elements.filterTimeBtn.classList.remove('active');
    if (this.elements.filterSourceBtn) this.elements.filterSourceBtn.classList.remove('active');
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
      optionsHtml = `<div class="filter-option" style="color: var(--secondary-text); padding: 12px 16px;">${this.i18n('noTags')}</div>`;
    }
    
    dropdown.innerHTML = `
      <div class="filter-dropdown-header">${this.i18n('selectTags')}</div>
      <div class="filter-dropdown-content">${optionsHtml}</div>
      <div class="filter-dropdown-footer">
        <button class="btn-cancel">${this.i18n('btnCancel')}</button>
        <button class="btn-confirm">${this.i18n('confirm')}</button>
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
      <div class="filter-dropdown-header">${this.i18n('selectTimeRange')}</div>
      <div class="time-shortcuts">
        <label><input type="radio" name="time-shortcut" value="today"> ${this.i18n('today')}</label>
        <label><input type="radio" name="time-shortcut" value="yesterday"> ${this.i18n('yesterday')}</label>
        <label><input type="radio" name="time-shortcut" value="week"> ${this.i18n('thisWeek')}</label>
        <label><input type="radio" name="time-shortcut" value="month"> ${this.i18n('thisMonth')}</label>
        <label><input type="radio" name="time-shortcut" value="last7"> ${this.i18n('last7Days')}</label>
        <label><input type="radio" name="time-shortcut" value="last30"> ${this.i18n('last30Days')}</label>
        <label><input type="radio" name="time-shortcut" value="custom"> ${this.i18n('custom')}</label>
      </div>
      <div class="time-custom hidden">
        <label>${this.i18n('startDate')}</label>
        <input type="date" id="time-start">
        <label>${this.i18n('endDate')}</label>
        <input type="date" id="time-end">
      </div>
      <div class="filter-dropdown-footer">
        <button class="btn-cancel">${this.i18n('btnCancel')}</button>
        <button class="btn-confirm">${this.i18n('confirm')}</button>
      </div>
    `;
    
    const customSection = dropdown.querySelector('.time-custom');
    const radios = dropdown.querySelectorAll('input[name="time-shortcut"]');
    
    if (this.data.filters.timeRange) {
      const currentType = this.data.filters.timeRange.type;
      const radioToCheck = dropdown.querySelector(`input[value="${currentType}"]`);
      if (radioToCheck) {
        radioToCheck.checked = true;
        if (currentType === 'custom') {
          customSection.classList.remove('hidden');
          const startDate = this.data.filters.timeRange.start;
          const endDate = this.data.filters.timeRange.end;
          if (startDate) {
            dropdown.querySelector('#time-start').value = startDate.toISOString().split('T')[0];
          }
          if (endDate) {
            dropdown.querySelector('#time-end').value = endDate.toISOString().split('T')[0];
          }
        }
      }
    }
    
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
      const safeId = source.replace(/\./g, '-');
      optionsHtml += `
        <div class="filter-option">
          <input type="checkbox" id="source-${safeId}" value="${source}" ${checked}>
          <label for="source-${safeId}">${source}</label>
        </div>
      `;
    });
    
    if (allSources.length === 0) {
      optionsHtml = `<div class="filter-option" style="color: var(--secondary-text); padding: 12px 16px;">${this.i18n('noSources')}</div>`;
    }
    
    dropdown.innerHTML = `
      <div class="filter-dropdown-header">${this.i18n('selectSource')}</div>
      <div class="filter-dropdown-content">${optionsHtml}</div>
      <div class="filter-dropdown-footer">
        <button class="btn-cancel">${this.i18n('btnCancel')}</button>
        <button class="btn-confirm">${this.i18n('confirm')}</button>
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
  },
  
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
    if (!container) return;
    
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
    if (this.elements.filterTagsBtn) {
      this.elements.filterTagsBtn.classList.toggle('active', this.data.filters.tags.length > 0);
    }
    if (this.elements.filterTimeBtn) {
      this.elements.filterTimeBtn.classList.toggle('active', !!this.data.filters.timeRange);
    }
    if (this.elements.filterSourceBtn) {
      this.elements.filterSourceBtn.classList.toggle('active', this.data.filters.sources.length > 0);
    }
  },
  
  // 检查是否有活跃的筛选条件
  hasActiveFilters() {
    return this.data.filters.tags.length > 0 
        || this.data.filters.timeRange !== null 
        || this.data.filters.sources.length > 0;
  }
};

// 初始化弹出窗口
PopupManager.initialize();