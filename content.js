// 文本选择和保存功能封装
const noteCapture = {
  // 状态跟踪
  status: {
    isSaving: false,
    lastSaveTime: 0,
    feedbackElement: null
  },
  
  // 初始化
  initialize() {
    this.setupEventListeners();
    console.log('Mindful Words 内容脚本已加载');
  },
  
  // 设置事件监听器
  setupEventListeners() {
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    // 添加快捷键支持
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+S 快捷键
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        this.captureSelectedText();
      }
    });
  },
  
  // 处理文本选择事件
  async handleTextSelection(event) {
    if (event.ctrlKey) {
      await this.captureSelectedText();
    }
  },
  
  // 捕获选中文本
  async captureSelectedText() {
    try {
      // 防止重复保存和快速点击
      if (this.status.isSaving) return;
      if (Date.now() - this.status.lastSaveTime < 1000) return;
      
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText.length === 0) return;
      
      this.status.isSaving = true;
      
      // 获取网页信息
      const pageTitle = document.title;
      const pageUrl = window.location.href;
      
      // 显示保存中反馈
      this.showSaveFeedback('保存中...', 'pending');
      
      // 发送消息给背景脚本
      const response = await this.sendMessageToBackground({
        type: 'save_note',
        content: selectedText,
        title: pageTitle,
        url: pageUrl,
        tags: []
      });
      
      if (response && response.status === 'success') {
        this.showSaveFeedback('笔记已保存!', 'success');
      } else {
        throw new Error(response?.message || '保存失败');
      }
    } catch (error) {
      console.error('保存笔记时出错:', error);
      this.showSaveFeedback(`保存失败: ${error.message}`, 'error');
    } finally {
      this.status.isSaving = false;
      this.status.lastSaveTime = Date.now();
    }
  },
  
  // 发送消息到背景脚本
  sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || '扩展通信错误'));
        } else {
          resolve(response);
        }
      });
    });
  },
  
  // 显示操作反馈
  showSaveFeedback(message, type = 'success') {
    // 先移除可能存在的反馈元素
    if (this.status.feedbackElement) {
      this.status.feedbackElement.remove();
      this.status.feedbackElement = null;
    }
    
    // 创建反馈元素
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
    
    // 根据类型设置样式
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
        // 添加旋转动画
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
    
    // 非pending状态自动移除
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