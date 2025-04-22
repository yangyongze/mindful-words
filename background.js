// 存储笔记数据
let notes = [];

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 检查扩展上下文是否有效
  if (!chrome.runtime?.id) {
    console.error('扩展上下文已失效');
    sendResponse({ status: 'error', message: '扩展上下文已失效，请刷新页面后重试' });
    return false;
  }
  
  if (request.type === 'delete_note') {
    // 删除笔记逻辑
    const initialNotesLength = notes.length;
    notes = notes.filter(note => note.id !== request.id);
    
    // 检查是否真的删除了笔记
    if (notes.length === initialNotesLength) {
      console.error('未找到要删除的笔记:', request.id);
      sendResponse({ status: 'error', message: '未找到要删除的笔记' });
      return true;
    }
    
    // 保存到chrome.storage
    const saveWithRetry = (attempt = 1) => {
      chrome.storage.local.set({ notes }, () => {
        if (chrome.runtime.lastError) {
          console.error(`笔记删除失败(尝试 ${attempt}):`, chrome.runtime.lastError);
          if (attempt < 3) {
            setTimeout(() => saveWithRetry(attempt + 1), 500);
          } else {
            // 最后一次失败后尝试使用chrome.storage.sync作为备用
            chrome.storage.sync.set({ notes }, () => {
              if (chrome.runtime.lastError) {
                console.error('同步存储也失败:', chrome.runtime.lastError);
                sendResponse({ status: 'error', message: '存储保存失败' });
              } else {
                console.log('Note deleted from sync storage:', request.id);
                sendResponse({ status: 'success' });
              }
            });
          }
          return;
        }
        console.log('Note deleted:', request.id);
        sendResponse({ status: 'success' });
      });
    };
    
    saveWithRetry();
    return true;
  } else if (request.type === 'update_theme') {
    // 更新主题逻辑
    chrome.storage.local.set({ settings: { theme: request.theme } }, () => {
      if (chrome.runtime.lastError) {
        console.error('主题保存失败:', chrome.runtime.lastError);
      } else {
        console.log('主题已更新:', request.theme);
      }
    });
    return true;
  } else if (request.type === 'update_tags') {
    // 更新标签逻辑
    const noteIndex = notes.findIndex(note => note.id === request.id);
    if (noteIndex === -1) {
      console.error('未找到要更新标签的笔记:', request.id);
      sendResponse({ status: 'error', message: '未找到笔记' });
      return true;
    }
    
    // 更新笔记标签
    notes[noteIndex].tags = request.tags;
    notes[noteIndex].updatedAt = new Date().toISOString();
    
    // 保存到chrome.storage
    const saveWithRetry = (attempt = 1) => {
      chrome.storage.local.set({ notes }, () => {
        if (chrome.runtime.lastError) {
          console.error(`标签更新失败(尝试 ${attempt}):`, chrome.runtime.lastError);
          if (attempt < 3) {
            setTimeout(() => saveWithRetry(attempt + 1), 500);
          } else {
            // 最后一次失败后尝试使用chrome.storage.sync作为备用
            chrome.storage.sync.set({ notes }, () => {
              if (chrome.runtime.lastError) {
                console.error('同步存储也失败:', chrome.runtime.lastError);
                sendResponse({ status: 'error', message: '存储保存失败' });
              } else {
                console.log('Tags updated in sync storage:', request.id);
                sendResponse({ status: 'success' });
              }
            });
          }
          return;
        }
        console.log('Tags updated:', request.id);
        sendResponse({ status: 'success' });
      });
    };
    
    saveWithRetry();
    return true;
  }
  if (request.type === 'save_note') {
    // 创建新笔记
    // 处理标签 - 去重和验证
    const processedTags = [];
    if (request.tags && request.tags.length > 0) {
      request.tags.forEach(tag => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !processedTags.includes(trimmedTag)) {
          processedTags.push(trimmedTag);
        }
      });
    }
    
    const newNote = {
      id: Date.now(),
      content: request.content,
      title: request.title,
      url: request.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: processedTags
    };
    
    // 添加到笔记列表
    notes.push(newNote);
    
    // 保存到chrome.storage
    const saveWithRetry = (attempt = 1) => {
      chrome.storage.local.set({ notes }, () => {
        if (chrome.runtime.lastError) {
          console.error(`笔记保存失败(尝试 ${attempt}):`, chrome.runtime.lastError);
          if (attempt < 3) {
            setTimeout(() => saveWithRetry(attempt + 1), 500);
          } else {
            // 最后一次失败后尝试使用chrome.storage.sync作为备用
            chrome.storage.sync.set({ notes }, () => {
              if (chrome.runtime.lastError) {
                console.error('同步存储也失败:', chrome.runtime.lastError);
              } else {
                console.log('Note saved to sync storage:', newNote);
              }
            });
          }
          return;
        }
        console.log('Note saved:', newNote);
      });
    };
    
    saveWithRetry();
    
    sendResponse({ status: 'success' });
  }
  
  return true; // 保持消息通道开放
});

// 初始化从storage加载笔记
const loadWithRetry = (attempt = 1) => {
  chrome.storage.local.get(['notes'], (result) => {
    if (chrome.runtime.lastError) {
      console.error(`笔记加载失败(尝试 ${attempt}):`, chrome.runtime.lastError);
      if (attempt < 3) {
        setTimeout(() => loadWithRetry(attempt + 1), 500);
      } else {
        // 最后一次失败后尝试从chrome.storage.sync加载
        chrome.storage.sync.get(['notes'], (syncResult) => {
          if (chrome.runtime.lastError) {
            console.error('同步存储加载也失败:', chrome.runtime.lastError);
          } else if (syncResult.notes) {
            notes = syncResult.notes;
            console.log('从同步存储加载笔记成功:', notes.length);
          }
        });
      }
      return;
    }
    
    if (result.notes) {
      notes = result.notes;
      console.log('笔记加载成功:', notes.length);
    }
  });
};

loadWithRetry();