const noteCapture = {
  VERSION: '2024.03.14.v4',
  
  status: {
    isSaving: false,
    lastSaveTime: 0,
    feedbackElement: null,
    lastSelectedText: '',
    lastSelectionRange: null,
    ctrlKeyPressed: false,
    contextValid: true
  },

  i18n(key) {
    return chrome.i18n.getMessage(key) || key;
  },
  
  initialize() {
    console.log(`[Mindful Words] Content script v${this.VERSION} loading...`);
    console.log('[Mindful Words] Chrome runtime available:', !!chrome?.runtime);
    console.log('[Mindful Words] Chrome runtime.id:', chrome?.runtime?.id || 'N/A');
    
    this.setupEventListeners();
    this.startContextCheck();
    console.log(`[Mindful Words] Content script v${this.VERSION} loaded successfully`);
  },
  
  // Check if extension context is valid
  isExtensionContextValid() {
    try {
      const valid = !!(chrome && chrome.runtime && chrome.runtime.id);
      if (!valid) {
        console.warn('[Mindful Words] Extension context check failed');
      }
      return valid;
    } catch (e) {
      console.error('[Mindful Words] Extension context check error:', e);
      return false;
    }
  },
  
  // Periodically check extension context
  startContextCheck() {
    const checkInterval = setInterval(() => {
      if (!this.isExtensionContextValid()) {
        this.status.contextValid = false;
        clearInterval(checkInterval);
        this.showContextInvalidWarning();
      }
    }, 5000); // Check every 5 seconds
  },
  
  showContextInvalidWarning() {
    if (this.status.feedbackElement) {
      this.status.feedbackElement.remove();
    }
    
    const warning = document.createElement('div');
    warning.id = 'mindful-words-context-warning';
    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f44336;
      color: white;
      padding: 12px 20px;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    warning.innerHTML = `
      <strong>Mindful Words:</strong> ${this.i18n('contextInvalidWarning')}
      <button id="mindful-words-refresh-btn" style="
        background: white;
        color: #f44336;
        border: none;
        padding: 6px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 12px;
        font-weight: bold;
      ">${this.i18n('refresh')}</button>
    `;
    
    document.body.appendChild(warning);
    
    document.getElementById('mindful-words-refresh-btn').addEventListener('click', () => {
      window.location.reload();
    });
  },
  
  // 设置事件监听器
  setupEventListeners() {
    const self = this;
    
    // Track Ctrl key state
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey) {
        self.status.ctrlKeyPressed = true;
      }
      // Ctrl+Shift+S shortcut
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        self.captureSelectedText();
      }
    }, true);
    
    document.addEventListener('keyup', (event) => {
      if (!event.ctrlKey) {
        self.status.ctrlKeyPressed = false;
      }
    }, true);
    
    // Track text selection - use capture phase for better reliability
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      if (text.length > 0) {
        self.status.lastSelectedText = text;
        // Store selection range for potential restoration
        try {
          self.status.lastSelectionRange = selection.getRangeAt(0).cloneRange();
        } catch (e) {
          self.status.lastSelectionRange = null;
        }
      }
    }, true);
    
    // Capture on Ctrl+mouseup - use capture phase
    document.addEventListener('mouseup', (event) => {
      if (event.ctrlKey) {
        // Small delay to ensure selection is captured
        setTimeout(() => {
          if (self.status.lastSelectedText.length > 0) {
            self.captureSelectedText();
          }
        }, 10);
      }
    }, true);
    
    // Also support Ctrl+click via click event for better reliability
    document.addEventListener('click', (event) => {
      if (event.ctrlKey && self.status.lastSelectedText.length > 0) {
        // Prevent default only if we have selection
        event.preventDefault();
        event.stopPropagation();
        self.captureSelectedText();
      }
    }, true);
    
    // Add context menu support for saving selected text
    document.addEventListener('contextmenu', () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      if (text.length > 0) {
        self.status.lastSelectedText = text;
        try {
          self.status.lastSelectionRange = selection.getRangeAt(0).cloneRange();
        } catch (e) {
          self.status.lastSelectionRange = null;
        }
      }
    }, true);
  },
  
  // Capture selected text
  async captureSelectedText() {
    // Check extension context first
    if (!this.isExtensionContextValid()) {
      console.warn('[Mindful Words] Extension context invalidated, please refresh the page');
      this.showSaveFeedback('Please refresh the page and try again', 'error');
      return;
    }
    
    try {
      // Prevent duplicate saves
      if (this.status.isSaving) return;
      if (Date.now() - this.status.lastSaveTime < 1000) return;
      
      // Get selected text from current selection or stored selection
      const selection = window.getSelection();
      let selectedText = selection.toString().trim();
      
      // Fallback to stored selection if current selection is empty
      if (selectedText.length === 0 && this.status.lastSelectedText.length > 0) {
        selectedText = this.status.lastSelectedText;
      }
      
      if (selectedText.length === 0) {
        console.log('[Mindful Words] No text selected');
        return;
      }
      
      // Clear stored selection after capturing
      const textToSave = selectedText;
      this.status.lastSelectedText = '';
      this.status.lastSelectionRange = null;
      
      this.status.isSaving = true;
      
      // Get page info
      const pageTitle = document.title;
      const pageUrl = window.location.href;
      
      console.log('[Mindful Words] Saving note:', textToSave.substring(0, 50) + '...');
      
      // Show saving feedback
      this.showSaveFeedback('Saving...', 'pending');
      
      // Send message to background script
      const response = await this.sendMessageToBackground({
        type: 'save_note',
        content: textToSave,
        title: pageTitle,
        url: pageUrl,
        tags: []
      });
      
      if (response && response.status === 'success') {
        this.showSaveFeedback('Note saved!', 'success');
        console.log('[Mindful Words] Note saved successfully');
      } else {
        throw new Error(response?.message || 'Save failed');
      }
    } catch (error) {
      console.error('[Mindful Words] Error saving note:', error);
      this.showSaveFeedback(`Save failed: ${error.message}`, 'error');
    } finally {
      this.status.isSaving = false;
      this.status.lastSaveTime = Date.now();
    }
  },
  
  // Send message to background script
  sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      if (!chrome?.runtime?.sendMessage) {
        reject(new Error('Extension context invalidated. Please refresh the page and try again.'));
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
  
  // Show operation feedback
  showSaveFeedback(message, type = 'success') {
    // Remove existing feedback element
    if (this.status.feedbackElement) {
      this.status.feedbackElement.remove();
      this.status.feedbackElement = null;
    }
    
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.right = '20px';
    feedback.style.padding = '12px 16px';
    feedback.style.borderRadius = '4px';
    feedback.style.zIndex = '9999';
    feedback.style.fontFamily = 'Arial, sans-serif';
    feedback.style.fontSize = '14px';
    feedback.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    feedback.style.transition = 'opacity 0.3s ease-in-out';
    feedback.style.display = 'flex';
    feedback.style.alignItems = 'center';
    feedback.style.gap = '8px';
    
    // Set style based on type
    switch (type) {
      case 'success':
        feedback.style.backgroundColor = '#4CAF50';
        feedback.style.color = 'white';
        feedback.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          ${message}
        `;
        break;
      case 'error':
        feedback.style.backgroundColor = '#F44336';
        feedback.style.color = 'white';
        feedback.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          ${message}
        `;
        break;
      case 'pending':
        feedback.style.backgroundColor = '#2196F3';
        feedback.style.color = 'white';
        feedback.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="spinner">
            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          ${message}
        `;
        // Add spin animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner {
            animation: spin 1.5s linear infinite;
          }
        `;
        document.head.appendChild(style);
        break;
    }
    
    document.body.appendChild(feedback);
    this.status.feedbackElement = feedback;
    
    // Auto-remove for non-pending states
    if (type !== 'pending') {
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.style.opacity = '0';
          setTimeout(() => {
            if (feedback.parentNode) {
              feedback.remove();
              if (this.status.feedbackElement === feedback) {
                this.status.feedbackElement = null;
              }
            }
          }, 300);
        }
      }, 2000);
    }
  }
};

// 初始化
noteCapture.initialize();