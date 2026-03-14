const OptionsManager = {
  elements: {
    themeSelect: null,
    languageSelect: null,
    saveSettingsBtn: null,
    tagInput: null,
    addTagBtn: null,
    tagList: null,
    tagCount: null,
    exportDataBtn: null,
    importDataBtn: null,
    importFileInput: null,
    clearDataBtn: null,
    storageSize: null,
    storageProgress: null,
    totalNotes: null,
    totalTags: null,
    totalSources: null,
    navItems: null,
    contentSections: null
  },

  data: {
    settings: {
      theme: 'light',
      language: null
    },
    tags: [],
    notes: []
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
        this.loadTags();
        this.loadStats();
        this.calculateStorage();
        this.applyTheme();
        this.applyTranslations();
      });
    });
  },

  initializeElements() {
    this.elements.themeSelect = document.getElementById('theme');
    this.elements.languageSelect = document.getElementById('language');
    this.elements.saveSettingsBtn = document.getElementById('save-settings');
    this.elements.tagInput = document.getElementById('new-tag-input');
    this.elements.addTagBtn = document.getElementById('add-tag-btn');
    this.elements.tagList = document.getElementById('tag-list');
    this.elements.tagCount = document.getElementById('tag-count');
    this.elements.exportDataBtn = document.getElementById('export-data-btn');
    this.elements.importDataBtn = document.getElementById('import-data-btn');
    this.elements.importFileInput = document.getElementById('import-file-input');
    this.elements.clearDataBtn = document.getElementById('clear-data-btn');
    this.elements.storageSize = document.getElementById('storage-size');
    this.elements.storageProgress = document.getElementById('storage-progress');
    this.elements.totalNotes = document.getElementById('total-notes');
    this.elements.totalTags = document.getElementById('total-tags');
    this.elements.totalSources = document.getElementById('total-sources');
    this.elements.navItems = document.querySelectorAll('.nav-item');
    this.elements.contentSections = document.querySelectorAll('.content-section');
  },

  setupEventListeners() {
    this.elements.saveSettingsBtn.addEventListener('click', () => {
      this.saveSettings();
    });

    this.elements.addTagBtn.addEventListener('click', () => {
      this.addNewTag(this.elements.tagInput.value);
    });

    this.elements.tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addNewTag(this.elements.tagInput.value);
      }
    });

    this.elements.exportDataBtn.addEventListener('click', () => {
      this.exportData();
    });

    this.elements.importDataBtn.addEventListener('click', () => {
      this.elements.importFileInput.click();
    });

    this.elements.importFileInput.addEventListener('change', (e) => {
      this.importData(e);
    });

    this.elements.clearDataBtn.addEventListener('click', () => {
      this.clearAllData();
    });

    this.elements.themeSelect.addEventListener('change', () => {
      this.applyTheme();
    });

    this.elements.languageSelect.addEventListener('change', () => {
      this.saveLanguagePreference();
    });

    this.elements.navItems.forEach(item => {
      item.addEventListener('click', () => {
        this.switchSection(item.dataset.section);
      });
    });
  },

  switchSection(sectionId) {
    this.elements.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.section === sectionId);
    });

    this.elements.contentSections.forEach(section => {
      section.classList.toggle('active', section.id === `section-${sectionId}`);
    });
  },

  applyTheme() {
    const theme = this.elements.themeSelect.value;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  },

  loadSettings() {
    if (!chrome?.storage?.local) {
      console.error('Chrome storage API not available');
      return;
    }
    chrome.storage.local.get(['settings'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Load settings failed:', chrome.runtime.lastError);
        return;
      }

      if (result.settings) {
        this.data.settings = { ...this.data.settings, ...result.settings };
        this.elements.themeSelect.value = this.data.settings.theme || 'light';
        if (this.data.settings.language) {
          this.elements.languageSelect.value = this.data.settings.language;
        }
        this.applyTheme();
      }
    });
  },

  saveLanguagePreference() {
    const language = this.elements.languageSelect.value;
    this.data.settings.language = language;
    I18n.setLanguage(language);
    
    if (!chrome?.storage?.local) {
      this.showNotification(this.i18n('extensionContextInvalid'), 'error');
      return;
    }
    
    chrome.storage.local.set({ settings: this.data.settings }, () => {
      this.applyTranslations();
      this.showNotification(this.i18n('languageChangeNote'), 'success');
    });
  },

  saveSettings() {
    if (!chrome?.storage?.local) {
      this.showNotification(this.i18n('extensionContextInvalid'), 'error');
      return;
    }
    try {
      const theme = this.elements.themeSelect.value;
      const language = this.elements.languageSelect.value;
      
      this.data.settings.theme = theme;
      this.data.settings.language = language;
      I18n.setLanguage(language);
      
      chrome.storage.local.set({ settings: this.data.settings }, () => {
        if (chrome.runtime.lastError) {
          console.error('Save settings failed:', chrome.runtime.lastError);
          this.showNotification(this.i18n('settingsSaveFailed'), 'error');
          return;
        }
        
        if (chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'update_theme',
            theme: theme
          });
        }
        
        this.applyTheme();
        this.applyTranslations();
        this.showNotification(this.i18n('settingsSaved'), 'success');
      });
    } catch (error) {
      console.error('Save settings error:', error);
      this.showNotification(this.i18n('settingsSaveFailed'), 'error');
    }
  },

  loadTags() {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(['notes'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Load notes failed:', chrome.runtime.lastError);
        return;
      }

      if (result.notes && Array.isArray(result.notes)) {
        this.data.notes = result.notes;
        const allTags = new Set();
        result.notes.forEach(note => {
          if (note.tags && Array.isArray(note.tags)) {
            note.tags.forEach(tag => allTags.add(tag));
          }
        });
        
        this.data.tags = Array.from(allTags).sort();
        this.renderTagList();
      }
    });
  },

  renderTagList() {
    if (!this.elements.tagList) return;
    
    this.elements.tagList.innerHTML = '';
    this.elements.tagCount.textContent = this.i18n('tagCount', [this.data.tags.length.toString()]);
    
    if (this.data.tags.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'tag-empty';
      emptyMessage.textContent = this.i18n('noTagsYet');
      this.elements.tagList.appendChild(emptyMessage);
      return;
    }
    
    this.data.tags.forEach(tag => {
      const tagItem = document.createElement('div');
      tagItem.className = 'tag-item';
      tagItem.innerHTML = `
        <span>${tag}</span>
        <span class="tag-remove" data-tag="${tag}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
      `;
      
      const removeBtn = tagItem.querySelector('.tag-remove');
      removeBtn.addEventListener('click', () => {
        this.deleteTag(tag);
      });
      
      this.elements.tagList.appendChild(tagItem);
    });
  },

  addNewTag(tagName) {
    const trimmedTag = tagName.trim();
    
    if (!trimmedTag) {
      this.showNotification(this.i18n('tagEmpty'), 'error');
      return;
    }
    
    if (this.data.tags.includes(trimmedTag)) {
      this.showNotification(this.i18n('tagExists'), 'error');
      return;
    }
    
    this.data.tags.push(trimmedTag);
    this.data.tags.sort();
    
    this.renderTagList();
    this.elements.tagInput.value = '';
    this.showNotification(this.i18n('tagAdded'), 'success');
  },

  deleteTag(tag) {
    if (!confirm(this.i18n('confirmDeleteTag', [tag]))) return;
    
    const index = this.data.tags.indexOf(tag);
    if (index !== -1) {
      this.data.tags.splice(index, 1);
    }
    
    this.removeTagFromNotes(tag);
    this.renderTagList();
    this.showNotification(this.i18n('tagDeleted'), 'success');
  },

  removeTagFromNotes(tagToRemove) {
    if (!chrome?.storage?.local) return;
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
        this.data.notes = updatedNotes;
        this.loadStats();
      }
    });
  },

  loadStats() {
    if (!chrome?.storage?.local) {
      this.elements.totalNotes.textContent = '0';
      this.elements.totalTags.textContent = '0';
      this.elements.totalSources.textContent = '0';
      return;
    }
    chrome.storage.local.get(['notes'], (result) => {
      if (chrome.runtime.lastError || !result.notes) {
        this.elements.totalNotes.textContent = '0';
        this.elements.totalTags.textContent = '0';
        this.elements.totalSources.textContent = '0';
        return;
      }
      
      const notes = result.notes;
      const allTags = new Set();
      const allSources = new Set();
      
      notes.forEach(note => {
        if (note.tags && Array.isArray(note.tags)) {
          note.tags.forEach(tag => allTags.add(tag));
        }
        if (note.url) {
          try {
            const url = new URL(note.url);
            allSources.add(url.hostname);
          } catch (e) {
            allSources.add(note.url);
          }
        }
      });
      
      this.elements.totalNotes.textContent = notes.length;
      this.elements.totalTags.textContent = allTags.size;
      this.elements.totalSources.textContent = allSources.size;
    });
  },

  calculateStorage() {
    if (!chrome?.storage?.local) {
      this.elements.storageSize.textContent = 'N/A';
      return;
    }
    chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
      const totalBytes = chrome.storage.local.QUOTA_BYTES || 5242880;
      const usedMB = (bytesInUse / 1024 / 1024).toFixed(2);
      const totalMB = (totalBytes / 1024 / 1024).toFixed(0);
      const percentage = ((bytesInUse / totalBytes) * 100).toFixed(1);
      
      this.elements.storageSize.textContent = `${usedMB} MB / ${totalMB} MB`;
      this.elements.storageProgress.style.width = `${percentage}%`;
      
      if (percentage > 80) {
        this.elements.storageProgress.style.backgroundColor = 'var(--error-color)';
      } else if (percentage > 60) {
        this.elements.storageProgress.style.backgroundColor = '#ff9500';
      }
    });
  },

  exportData() {
    if (!chrome?.storage?.local) {
      this.showNotification(this.i18n('extensionContextInvalid'), 'error');
      return;
    }
    chrome.storage.local.get(['notes', 'settings'], (result) => {
      if (chrome.runtime.lastError) {
        this.showNotification(this.i18n('dataExportFailed'), 'error');
        return;
      }
      
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        notes: result.notes || [],
        settings: result.settings || {}
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindful-words-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showNotification(this.i18n('dataExported'), 'success');
    });
  },

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!chrome?.storage?.local) {
      this.showNotification(this.i18n('extensionContextInvalid'), 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.notes || !Array.isArray(importedData.notes)) {
          throw new Error(this.i18n('invalidDataFormat'));
        }
        
        const confirmMsg = this.i18n('importConfirm', [importedData.notes.length.toString()]);
        
        if (!confirm(confirmMsg)) {
          this.elements.importFileInput.value = '';
          return;
        }
        
        chrome.storage.local.get(['notes'], (result) => {
          const existingNotes = result.notes || [];
          const existingIds = new Set(existingNotes.map(n => n.id));
          
          const newNotes = importedData.notes.filter(n => !existingIds.has(n.id));
          const mergedNotes = [...existingNotes, ...newNotes];
          
          chrome.storage.local.set({ 
            notes: mergedNotes,
            settings: importedData.settings || result.settings
          }, () => {
            if (chrome.runtime.lastError) {
              this.showNotification(this.i18n('importFailed'), 'error');
              return;
            }
            
            this.data.notes = mergedNotes;
            this.loadTags();
            this.loadStats();
            this.calculateStorage();
            this.showNotification(this.i18n('importedNotes', [newNotes.length.toString()]), 'success');
          });
        });
      } catch (error) {
        console.error('Import parse error:', error);
        this.showNotification(this.i18n('invalidDataFormat'), 'error');
      }
    };
    
    reader.readAsText(file);
    this.elements.importFileInput.value = '';
  },

  clearAllData() {
    const confirmMsg = this.i18n('clearConfirm');
    const userInput = prompt(confirmMsg);
    
    if (userInput !== 'DELETE') {
      if (userInput !== null) {
        this.showNotification(this.i18n('clearCancelled'), 'error');
      }
      return;
    }
    
    if (!chrome?.storage?.local) {
      this.showNotification(this.i18n('extensionContextInvalid'), 'error');
      return;
    }
    
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        this.showNotification(this.i18n('clearFailed'), 'error');
        return;
      }
      
      this.data.notes = [];
      this.data.tags = [];
      this.data.settings = { theme: 'light', language: null };
      
      this.elements.themeSelect.value = 'light';
      this.applyTheme();
      this.renderTagList();
      this.loadStats();
      this.calculateStorage();
      
      this.showNotification(this.i18n('allDataCleared'), 'success');
    });
  },

  showNotification(message, type) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fadeout');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 200);
    }, 3000);
  }
};

OptionsManager.initialize();
