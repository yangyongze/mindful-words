/*
 * 欢迎来到Mindful Words的后台脚本世界！
 * 这里就像一个安静的图书管理员，负责管理你保存的所有笔记。
 * 让我们跟随这段代码，看看它是如何工作的...
 */

// 这里是我们的'书架'，用来存放所有笔记
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
    case 'update_theme':
      return updateTheme(request.theme);
    case 'update_tags':
      return updateNoteTags(request.id, request.tags);
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

// 保存新笔记
async function saveNote(request) {
  try {
    // 首先从存储中加载最新的笔记数据，确保不会丢失旧笔记
    const latestNotes = await storageAPI.loadData('notes') || [];
    
    // 确保我们操作的是数组
    notes = Array.isArray(latestNotes) ? latestNotes : [];
    
    // 标签处理
    const processedTags = [];
    if (request.tags && request.tags.length > 0) {
      request.tags.forEach(tag => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !processedTags.includes(trimmedTag)) {
          processedTags.push(trimmedTag);
        }
      });
    }
    
    // 笔记对象创建
    const newNote = {
      id: Date.now(),
      content: request.content,
      title: request.title || request.content.substring(0, 30) + '...',
      url: request.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: processedTags
    };
    
    // 添加新笔记
    notes.push(newNote);
    
    // 保存更新后的笔记数组
    await storageAPI.saveData('notes', notes);
    
    console.log(`已保存新笔记，当前共有${notes.length}条笔记`);
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