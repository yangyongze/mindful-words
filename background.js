
let notes = [];

// 统一的存储API，处理所有数据保存和读取操作
const storageAPI = {
  // 保存数据到存储
  async saveData(key, data) {
    return new Promise((resolve, reject) => {
      const saveWithRetry = (attempt = 1) => {
        chrome.storage.local.set({ [key]: data }, () => {
          if (chrome.runtime.lastError) {
            console.error(`保存失败(尝试 ${attempt}):`, chrome.runtime.lastError);
            if (attempt < 3) {
              setTimeout(() => saveWithRetry(attempt + 1), 500);
            } else {
              // 最后一次失败后尝试使用chrome.storage.sync作为备用
              chrome.storage.sync.set({ [key]: data }, () => {
                if (chrome.runtime.lastError) {
                  console.error('同步存储也失败:', chrome.runtime.lastError);
                  reject(new Error('存储保存失败'));
                } else {
                  console.log(`数据已保存到sync存储: ${key}`);
                  resolve();
                }
              });
            }
            return;
          }
          console.log(`数据已保存: ${key}`);
          resolve();
        });
      };
      
      saveWithRetry();
    });
  },
  
  // 从存储加载数据
  async loadData(key) {
    return new Promise((resolve, reject) => {
      const loadWithRetry = (attempt = 1) => {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            console.error(`加载失败(尝试 ${attempt}):`, chrome.runtime.lastError);
            if (attempt < 3) {
              setTimeout(() => loadWithRetry(attempt + 1), 500);
            } else {
              // 最后一次失败后尝试从chrome.storage.sync加载
              chrome.storage.sync.get([key], (syncResult) => {
                if (chrome.runtime.lastError) {
                  console.error('同步存储加载也失败:', chrome.runtime.lastError);
                  reject(new Error('存储加载失败'));
                } else {
                  console.log(`从sync存储加载数据: ${key}`);
                  resolve(syncResult[key]);
                }
              });
            }
            return;
          }
          resolve(result[key]);
        });
      };
      
      loadWithRetry();
    });
  }
};

// 统一的消息响应处理
async function handleMessage(request, sender) {
  if (!chrome.runtime?.id) {
    throw new Error('扩展上下文已失效，请刷新页面后重试');
  }
  
  switch (request.type) {
    case 'delete_note':
      return deleteNote(request.id);
    case 'delete_notes':
      return deleteNotes(request.ids);
    case 'update_theme':
      return updateTheme(request.theme);
    case 'update_tags':
      return updateNoteTags(request.id, request.tags);
    case 'update_note':
      return updateNote(request.id, request.noteData);
    case 'save_note':
      return saveNote(request);
    default:
      throw new Error(`未知的请求类型: ${request.type}`);
  }
}

// 删除笔记
async function deleteNote(noteId) {
  try {
    // 首先从存储中加载最新的笔记数据
    const latestNotes = await storageAPI.loadData('notes') || [];
    
    // 确保我们操作的是数组
    notes = Array.isArray(latestNotes) ? latestNotes : [];
    
    const initialNotesLength = notes.length;
    notes = notes.filter(note => note.id !== noteId);
    
    if (notes.length === initialNotesLength) {
      throw new Error('未找到要删除的笔记');
    }
    
    await storageAPI.saveData('notes', notes);
    console.log(`已删除笔记，当前剩余${notes.length}条笔记`);
    return { status: 'success' };
  } catch (error) {
    console.error('删除笔记失败:', error);
    throw error;
  }
}

// 批量删除笔记
async function deleteNotes(noteIds) {
  try {
    const latestNotes = await storageAPI.loadData('notes') || [];
    notes = Array.isArray(latestNotes) ? latestNotes : [];
    
    const idsSet = new Set(noteIds);
    const initialLength = notes.length;
    notes = notes.filter(note => !idsSet.has(note.id));
    
    const deletedCount = initialLength - notes.length;
    if (deletedCount === 0) {
      throw new Error('未找到要删除的笔记');
    }
    
    await storageAPI.saveData('notes', notes);
    console.log(`已批量删除 ${deletedCount} 条笔记，当前剩余${notes.length}条笔记`);
    return { status: 'success', deletedCount };
  } catch (error) {
    console.error('批量删除笔记失败:', error);
    throw error;
  }
}

// 更新主题
async function updateTheme(theme) {
  try {
    const settings = await storageAPI.loadData('settings') || {};
    settings.theme = theme;
    await storageAPI.saveData('settings', settings);
    return { status: 'success' };
  } catch (error) {
    console.error('主题更新失败:', error);
    throw error;
  }
}

// 更新笔记标签
async function updateNoteTags(noteId, tags) {
  try {
    // 首先从存储中加载最新的笔记数据
    const latestNotes = await storageAPI.loadData('notes') || [];
    
    // 确保我们操作的是数组
    notes = Array.isArray(latestNotes) ? latestNotes : [];
    
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      throw new Error('未找到要更新标签的笔记');
    }
    
    notes[noteIndex].tags = tags;
    notes[noteIndex].updatedAt = new Date().toISOString();
    
    await storageAPI.saveData('notes', notes);
    console.log(`已更新笔记标签，笔记ID: ${noteId}`);
    return { status: 'success' };
  } catch (error) {
    console.error('更新笔记标签失败:', error);
    throw error;
  }
}

// 更新笔记内容
async function updateNote(noteId, noteData) {
  try {
    // 首先从存储中加载最新的笔记数据
    const latestNotes = await storageAPI.loadData('notes') || [];
    
    // 确保我们操作的是数组
    notes = Array.isArray(latestNotes) ? latestNotes : [];
    
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      throw new Error('未找到要更新的笔记');
    }
    
    // 更新笔记数据
    notes[noteIndex] = {
      ...notes[noteIndex],
      ...noteData,
      id: noteId, // 确保ID不被覆盖
      updatedAt: new Date().toISOString()
    };
    
    await storageAPI.saveData('notes', notes);
    console.log(`已更新笔记，笔记ID: ${noteId}`);
    return { status: 'success' };
  } catch (error) {
    console.error('更新笔记失败:', error);
    throw error;
  }
}

// 保存新笔记
async function saveNote(request) {
  // 输入验证
  if (!request.content || typeof request.content !== 'string') {
    throw new Error('Content is required and must be a string');
  }
  
  const trimmedContent = request.content.trim();
  if (trimmedContent.length === 0) {
    throw new Error('Content cannot be empty');
  }
  
  if (trimmedContent.length > 10000) {
    throw new Error('Content exceeds maximum length of 10000 characters');
  }
  
  // URL 验证
  if (request.url && typeof request.url !== 'string') {
    throw new Error('URL must be a string');
  }
  
  try {
    // 首先从存储中加载最新的笔记数据，确保不会丢失旧笔记
    const latestNotes = await storageAPI.loadData('notes') || [];
    
    // 确保我们操作的是数组
    notes = Array.isArray(latestNotes) ? latestNotes : [];
    
    // 标签处理
    const processedTags = [];
    if (request.tags && Array.isArray(request.tags)) {
      request.tags.forEach(tag => {
        const trimmedTag = String(tag).trim();
        if (trimmedTag && !processedTags.includes(trimmedTag)) {
          processedTags.push(trimmedTag);
        }
      });
    }
    
    // 笔记对象创建
    const newNote = {
      id: Date.now(),
      content: trimmedContent,
      note: '',
      title: request.title || trimmedContent.substring(0, 30) + '...',
      url: request.url || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: processedTags
    };
    
    // 添加新笔记
    notes.push(newNote);
    
    // 保存更新后的笔记数组
    await storageAPI.saveData('notes', notes);
    
    console.log(`已保存新笔记，当前共有${notes.length}条笔记`);
    
    // Notify popup (ignore if not open)
    chrome.runtime.sendMessage({ type: 'note_saved', note: newNote }).catch(() => {});
    
    return { status: 'success', note: newNote };
  } catch (error) {
    console.error('保存笔记失败:', error);
    throw new Error('保存笔记失败，请重试');
  }
}

// 消息监听器
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('处理消息时出错:', error);
      sendResponse({ 
        status: 'error', 
        message: error.message || '操作失败，请重试' 
      });
    });
  return true; // 表示会异步发送响应
});

// 初始化加载笔记
async function initialize() {
  try {
    const loadedNotes = await storageAPI.loadData('notes');
    if (loadedNotes && Array.isArray(loadedNotes)) {
      notes = loadedNotes;
      console.log(`已加载 ${notes.length} 条笔记`);
    }
  } catch (error) {
    console.error('初始化加载笔记失败:', error);
  }
}

// 启动扩展时初始化
initialize();

// 点击扩展图标时打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Create context menu for saving selected text
chrome.runtime.onInstalled.addListener(async (details) => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save to Mindful Words',
    contexts: ['selection']
  });
  
  // Add default notes for new installations
  if (details.reason === 'install') {
    await createDefaultNotes();
  }
});

async function createDefaultNotes() {
  try {
    const existingNotes = await storageAPI.loadData('notes');
    
    if (existingNotes && existingNotes.length > 0) {
      return;
    }
    
    const now = new Date().toISOString();
    const defaultNotes = [
      {
        id: Date.now(),
        content: chrome.i18n.getMessage('defaultNote1Content'),
        note: chrome.i18n.getMessage('defaultNote1Note'),
        title: 'Welcome to Mindful Words',
        url: 'chrome-extension://mindful-words',
        createdAt: now,
        updatedAt: now,
        tags: [chrome.i18n.getMessage('welcomeTag'), chrome.i18n.getMessage('inspirationTag')]
      },
      {
        id: Date.now() + 1,
        content: chrome.i18n.getMessage('defaultNote2Content'),
        note: chrome.i18n.getMessage('defaultNote2Note'),
        title: 'How to Use Mindful Words',
        url: 'chrome-extension://mindful-words',
        createdAt: now,
        updatedAt: now,
        tags: [chrome.i18n.getMessage('tutorialTag'), chrome.i18n.getMessage('howToTag')]
      }
    ];
    
    notes = defaultNotes;
    await storageAPI.saveData('notes', defaultNotes);
    console.log('[Mindful Words] Default welcome notes created');
  } catch (error) {
    console.error('[Mindful Words] Failed to create default notes:', error);
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-selection' && info.selectionText) {
    saveNoteFromContextMenu(info.selectionText, tab);
  }
});

// Save note from context menu
async function saveNoteFromContextMenu(selectedText, tab) {
  try {
    const latestNotes = await storageAPI.loadData('notes') || [];
    notes = Array.isArray(latestNotes) ? latestNotes : [];
    
    const newNote = {
      id: Date.now(),
      content: selectedText.trim(),
      note: '',
      title: tab?.title || selectedText.substring(0, 30) + '...',
      url: tab?.url || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    };
    
    notes.push(newNote);
    await storageAPI.saveData('notes', notes);
    
    console.log(`[Mindful Words] Note saved from context menu, total: ${notes.length}`);
    
    // Notify popup about the new note
    try {
      chrome.runtime.sendMessage({ type: 'note_saved', note: newNote }).catch(() => {});
    } catch (e) {}
    
  } catch (error) {
    console.error('[Mindful Words] Failed to save note from context menu:', error);
  }
}