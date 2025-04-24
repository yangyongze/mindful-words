// 选项页面管理器
const OptionsManager = {
  // DOM元素
  elements: {
    themeSelect: null,
    saveSettingsBtn: null,
    tagManager: null
  },

  // 数据
  data: {
    settings: {
      theme: 'light'
    },
    tags: []
  },

  // 初始化
  initialize() {
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeElements();
      this.setupEventListeners();
      this.loadSettings();
      this.loadTags();
    });
  },

  // 初始化DOM元素引用
  initializeElements() {
    this.elements.themeSelect = document.getElementById('theme');
    this.elements.saveSettingsBtn = document.getElementById('save-settings');
    this.elements.tagManager = document.getElementById('tag-manager');
  },

  // 设置事件监听器
  setupEventListeners() {
    // 保存设置按钮
    this.elements.saveSettingsBtn.addEventListener('click', () => {
      this.saveSettings();
    });
  },

  // 从存储加载设置
  loadSettings() {
    chrome.storage.local.get(['settings'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('加载设置失败:', chrome.runtime.lastError);
        this.showNotification('设置加载失败，请刷新页面重试', 'error');
        return;
      }

      if (result.settings) {
        this.data.settings = result.settings;
        this.elements.themeSelect.value = this.data.settings.theme || 'light';
      }
    });
  },

  // 保存设置
  saveSettings() {
    try {
      const theme = this.elements.themeSelect.value;
      
      // 更新本地数据
      this.data.settings.theme = theme;
      
      // 保存到存储
      chrome.storage.local.set({ settings: this.data.settings }, () => {
        if (chrome.runtime.lastError) {
          console.error('保存设置失败:', chrome.runtime.lastError);
          this.showNotification('设置保存失败，请重试', 'error');
          return;
        }
        
        // 发送主题更新消息
        chrome.runtime.sendMessage({
          type: 'update_theme',
          theme: theme
        });
        
        this.showNotification('设置已保存', 'success');
      });
    } catch (error) {
      console.error('保存设置时出错:', error);
      this.showNotification('保存设置时出错: ' + error.message, 'error');
    }
  },

  // 加载标签数据
  loadTags() {
    try {
      chrome.storage.local.get(['notes'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('加载笔记失败:', chrome.runtime.lastError);
          return;
        }

        if (result.notes && Array.isArray(result.notes)) {
          // 提取所有唯一标签
          const allTags = new Set();
          result.notes.forEach(note => {
            if (note.tags && Array.isArray(note.tags)) {
              note.tags.forEach(tag => allTags.add(tag));
            }
          });
          
          this.data.tags = Array.from(allTags).sort();
          this.renderTagManager();
        }
      });
    } catch (error) {
      console.error('加载标签时出错:', error);
    }
  },

  // 渲染标签管理器
  renderTagManager() {
    if (!this.elements.tagManager) return;
    
    this.elements.tagManager.innerHTML = '';
    
    // 创建标签管理容器
    const container = document.createElement('div');
    container.className = 'tag-manager-container';
    
    // 标题
    const title = document.createElement('h3');
    title.textContent = '标签管理';
    container.appendChild(title);
    
    // 添加标签输入区域
    const inputContainer = document.createElement('div');
    inputContainer.className = 'tag-input-container';
    inputContainer.innerHTML = `
      <input type="text" id="new-tag-input" placeholder="输入新标签">
      <button id="add-tag-btn" class="button">添加</button>
    `;
    container.appendChild(inputContainer);
    
    // 标签列表
    const tagListContainer = document.createElement('div');
    tagListContainer.className = 'tag-list-container';
    
    if (this.data.tags.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = '暂无标签';
      emptyMessage.className = 'empty-message';
      tagListContainer.appendChild(emptyMessage);
    } else {
      const tagList = document.createElement('ul');
      tagList.className = 'tag-list';
      
      this.data.tags.forEach(tag => {
        const tagItem = document.createElement('li');
        tagItem.className = 'tag-item';
        
        const tagText = document.createElement('span');
        tagText.className = 'tag-text';
        tagText.textContent = tag;
        
        const tagActions = document.createElement('div');
        tagActions.className = 'tag-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'tag-edit-btn';
        editBtn.textContent = '编辑';
        editBtn.addEventListener('click', () => this.editTag(tag));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'tag-delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => this.deleteTag(tag));
        
        tagActions.appendChild(editBtn);
        tagActions.appendChild(deleteBtn);
        
        tagItem.appendChild(tagText);
        tagItem.appendChild(tagActions);
        tagList.appendChild(tagItem);
      });
      
      tagListContainer.appendChild(tagList);
    }
    
    container.appendChild(tagListContainer);
    this.elements.tagManager.appendChild(container);
    
    // 添加标签按钮事件
    const addTagBtn = document.getElementById('add-tag-btn');
    const newTagInput = document.getElementById('new-tag-input');
    
    if (addTagBtn && newTagInput) {
      addTagBtn.addEventListener('click', () => {
        this.addNewTag(newTagInput.value);
      });
      
      newTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addNewTag(newTagInput.value);
        }
      });
    }
  },

  // 添加新标签
  addNewTag(tagName) {
    const trimmedTag = tagName.trim();
    
    if (!trimmedTag) {
      this.showNotification('标签不能为空', 'error');
      return;
    }
    
    if (this.data.tags.includes(trimmedTag)) {
      this.showNotification('标签已存在', 'error');
      return;
    }
    
    this.data.tags.push(trimmedTag);
    this.data.tags.sort();
    
    this.renderTagManager();
    document.getElementById('new-tag-input').value = '';
    this.showNotification('标签已添加', 'success');
  },

  // 编辑标签
  editTag(oldTag) {
    const newTag = prompt('编辑标签:', oldTag);
    
    if (newTag === null) return; // 用户取消
    
    const trimmedTag = newTag.trim();
    
    if (!trimmedTag) {
      this.showNotification('标签不能为空', 'error');
      return;
    }
    
    if (trimmedTag === oldTag) return; // 没有变化
    
    if (this.data.tags.includes(trimmedTag)) {
      this.showNotification('标签已存在', 'error');
      return;
    }
    
    // 更新标签列表
    const index = this.data.tags.indexOf(oldTag);
    if (index !== -1) {
      this.data.tags[index] = trimmedTag;
      this.data.tags.sort();
    }
    
    // 更新所有笔记中的标签
    this.updateTagsInNotes(oldTag, trimmedTag);
    
    this.renderTagManager();
    this.showNotification('标签已更新', 'success');
  },

  // 删除标签
  deleteTag(tag) {
    if (!confirm(`确定要删除标签 "${tag}"?`)) return;
    
    // 从标签列表中删除
    const index = this.data.tags.indexOf(tag);
    if (index !== -1) {
      this.data.tags.splice(index, 1);
    }
    
    // 从所有笔记中删除该标签
    this.removeTagFromNotes(tag);
    
    this.renderTagManager();
    this.showNotification('标签已删除', 'success');
  },

  // 更新所有笔记中的标签
  updateTagsInNotes(oldTag, newTag) {
    chrome.storage.local.get(['notes'], (result) => {
      if (chrome.runtime.lastError || !result.notes) return;
      
      let updated = false;
      
      const updatedNotes = result.notes.map(note => {
        if (note.tags && Array.isArray(note.tags)) {
          const tagIndex = note.tags.indexOf(oldTag);
          if (tagIndex !== -1) {
            updated = true;
            const newTags = [...note.tags];
            newTags[tagIndex] = newTag;
            return { ...note, tags: newTags, updatedAt: new Date().toISOString() };
          }
        }
        return note;
      });
      
      if (updated) {
        chrome.storage.local.set({ notes: updatedNotes });
      }
    });
  },

  // 从所有笔记中删除标签
  removeTagFromNotes(tagToRemove) {
    chrome.storage.local.get(['notes'], (result) => {
      if (chrome.runtime.lastError || !result.notes) return;
      
      let updated = false;
      
      const updatedNotes = result.notes.map(note => {
        if (note.tags && Array.isArray(note.tags)) {
          const tagIndex = note.tags.indexOf(tagToRemove);
          if (tagIndex !== -1) {
            updated = true;
            const newTags = note.tags.filter(tag => tag !== tagToRemove);
            return { ...note, tags: newTags, updatedAt: new Date().toISOString() };
          }
        }
        return note;
      });
      
      if (updated) {
        chrome.storage.local.set({ notes: updatedNotes });
      }
    });
  },
  
  // 显示通知
  showNotification(message, type) {
    // 移除可能存在的通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 自动关闭
    setTimeout(() => {
      notification.classList.add('fadeout');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }
};

// 添加样式
const style = document.createElement('style');
style.textContent = `
  .tag-manager-container {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .tag-input-container {
    display: flex;
    margin-bottom: 15px;
  }
  
  .tag-input-container input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
  }
  
  .tag-input-container button {
    padding: 8px 12px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
  }
  
  .tag-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .tag-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }
  
  .tag-text {
    flex: 1;
  }
  
  .tag-actions {
    display: flex;
    gap: 5px;
  }
  
  .tag-actions button {
    padding: 4px 8px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 3px;
    cursor: pointer;
  }
  
  .tag-edit-btn:hover {
    background-color: #e0e0e0;
  }
  
  .tag-delete-btn:hover {
    background-color: #ffebee;
  }
  
  .empty-message {
    color: #757575;
    font-style: italic;
  }
  
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    border-radius: 4px;
    color: white;
    z-index: 1000;
    transition: opacity 0.3s;
  }
  
  .notification.success {
    background-color: #4CAF50;
  }
  
  .notification.error {
    background-color: #F44336;
  }
  
  .notification.fadeout {
    opacity: 0;
  }
`;
document.head.appendChild(style);

// 初始化选项页面
OptionsManager.initialize();