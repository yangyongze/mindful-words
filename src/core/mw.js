/*
 * The shared contract. The content script loads this as a classic script; the
 * extension pages and service worker load it as a module. It must stay free of
 * import/export syntax so both contexts can evaluate the same file.
 */
(function (global) {
  'use strict';

  const STRINGS = {
  "en": {
    "about": "About",
    "aboutDesc": "Learn about Mindful Words",
    "aboutText": "A clean and elegant web content collection tool that helps you save and manage valuable web content.",
    "aboutTitle": "About",
    "adjustFilters": "Try adjusting filter conditions",
    "allDataCleared": "All data has been cleared",
    "allDuplicatesError": "All notes are duplicates and already exist in Anki",
    "ankiConnectError": "Failed to connect to AnkiConnect",
    "ankiConnectNotRunning": "AnkiConnect is not running. Please ensure Anki is running with AnkiConnect addon installed.",
    "appearanceDesc": "Customize the look and feel of the app",
    "appearanceSettings": "Appearance",
    "appearanceTitle": "Appearance Settings",
    "btnCancel": "Cancel",
    "btnClear": "Clear",
    "btnCopy": "Copy",
    "btnDelete": "Delete",
    "btnExport": "Export",
    "btnExportAction": "Export",
    "btnImportAction": "Import",
    "btnSave": "Save",
    "btnSelect": "Select notes",
    "btnSettings": "Settings",
    "cancel": "Cancel",
    "clearAllData": "Clear all data",
    "clearAllDataDesc": "Delete all notes and settings, this cannot be undone",
    "clearCancelled": "Clear operation cancelled",
    "clearConfirm": "Are you sure you want to clear all data?\n\nThis will delete all notes and settings and cannot be undone!\n\nType \"DELETE\" to confirm:",
    "clearFailed": "Clear failed, please try again",
    "clearFilters": "Clear filters",
    "clearSearch": "Clear search",
    "confirm": "Confirm",
    "confirmBatchDeleteMessage": "Are you sure you want to delete $1$ selected notes? This action cannot be undone.",
    "confirmDelete": "Confirm deletion",
    "confirmDeleteMessage": "Are you sure you want to delete this note?",
    "confirmDeleteTag": "Are you sure you want to delete tag \"$1$\"?\nThis tag will be removed from all notes.",
    "contentCannotBeEmpty": "Content cannot be empty",
    "contentLabel": "Content:",
    "contentPlaceholder": "Enter note content...",
    "contentTooLong": "Content exceeds $1$ characters",
    "contextInvalidWarning": "Extension updated. Please refresh the page to continue saving notes.",
    "copyFailed": "Copy failed, please try again",
    "copySuccess": "Copied to clipboard",
    "custom": "Custom",
    "dataDesc": "Export, import and clear your data",
    "dataExported": "Data exported successfully",
    "dataManagement": "Data",
    "dataTitle": "Data Management",
    "defaultNote1Content": "Mindful Words are seeds, action makes them grow. Try, fail, learn, then you'll truly know.",
    "defaultNote1Note": "Welcome to Mindful Words! This is your first note. You can add personal notes to any saved content.",
    "defaultNote1Title": "Welcome to Mindful Words",
    "defaultNote2Content": "How to save content: Select any text on a webpage, then press and hold Ctrl + Left Click to save it instantly. Your notes will include the content, source URL, timestamp, and tags.",
    "defaultNote2Note": "Tips: You can also use Ctrl+Shift+S shortcut, or right-click menu to save selected text.",
    "defaultNote2Title": "How to Use Mindful Words",
    "deleteFailed": "Delete failed, please try again",
    "deleteNote": "Delete note",
    "deleted": "Deleted $1$ notes",
    "editNote": "Edit note",
    "endDate": "End date",
    "existingTags": "Existing tags",
    "exportCSV": "CSV format",
    "exportCSVDesc": "Suitable for spreadsheet software",
    "exportData": "Export data",
    "exportDataDesc": "Export all notes as JSON file",
    "exportJSON": "JSON format",
    "exportJSONDesc": "Export complete data structure",
    "exportOptions": "Export options",
    "exportTXT": "TXT format",
    "exportTXTDesc": "Plain text, works anywhere",
    "extDescription": "are seeds, action makes them grow. Try, fail, learn, then you'll truly know.",
    "filterSource": "Source",
    "filterTags": "Tags",
    "filterTime": "Time",
    "howToTag": "how-to",
    "importCancelled": "Import cancelled",
    "importConfirm": "Import $1$ notes?\n\nClick OK to merge with existing data\nClick Cancel to abort",
    "importData": "Import data",
    "importDataDesc": "Import notes from JSON file",
    "importFailed": "Import failed, please try again",
    "importedNotes": "Successfully imported $1$ new notes",
    "inspirationTag": "inspiration",
    "invalidDataFormat": "Invalid data format",
    "languageDesc": "Choose display language",
    "languageEn": "English",
    "languageLabel": "Language",
    "languageZhCN": "简体中文",
    "last30Days": "Last 30 days",
    "last7Days": "Last 7 days",
    "loadFailed": "Failed to load notes, please refresh",
    "loading": "Loading...",
    "newNoteAdded": "New note added!",
    "noFilteredNotes": "No notes match the filters",
    "noMatchingNotes": "No matching notes found",
    "noModelsFound": "No models found",
    "noNotes": "No notes yet",
    "noNotesHint": "Select text on a webpage and press Ctrl + Left Click to save",
    "noSources": "No sources",
    "noTags": "No tags",
    "noTagsYet": "No tags yet, tags will be created automatically when you add notes",
    "note": "Note",
    "noteNotFound": "Note not found",
    "operationFailed": "Operation failed, please try again",
    "personalNote": "Personal note",
    "personalNoteLabel": "Personal note:",
    "personalNotePlaceholder": "Add your thoughts or remarks...",
    "refresh": "Refresh",
    "saveFailed": "Failed to save note: $1$",
    "saveSelection": "Save to Mindful Words",
    "saveSettings": "Save settings",
    "saveSuccess": "Note saved successfully!",
    "saving": "Saving...",
    "searchPlaceholder": "Search notes...",
    "selectAll": "Select all",
    "selectDeck": "Select Deck",
    "selectModel": "Select Model",
    "selectNotesFirst": "Please select notes first",
    "selectSource": "Select source",
    "selectTags": "Select tags",
    "selectTimeRange": "Select time range",
    "selectedCount": "Selected $1$ items",
    "send": "Send",
    "sendSuccess": "Successfully sent $1$ notes to Anki",
    "sendSuccessWithSkipped": "Sent $1$ notes to Anki, skipped $2$ duplicates",
    "sendToAnki": "Send to Anki",
    "sendToAnkiDesc": "Send selected notes to Anki via AnkiConnect",
    "settingsSaveFailed": "Failed to save settings, please try again",
    "settingsSaved": "Settings saved",
    "settingsTitle": "Settings",
    "source": "Source",
    "startDate": "Start date",
    "storageUnavailable": "Unavailable",
    "storageUsage": "Storage usage",
    "tagCount": "$1$ tags",
    "tagDeleted": "Tag deleted",
    "tagsDesc": "Manage tags used in notes",
    "tagsLabel": "Tags:",
    "tagsManagement": "Tags",
    "tagsPlaceholder": "Enter tags, separated by commas...",
    "tagsTitle": "Tag Management",
    "themeDark": "Dark",
    "themeLight": "Light",
    "themeMode": "Theme mode",
    "themeModeDesc": "Choose light or dark theme, or follow system settings",
    "themeSystem": "Follow system",
    "thisMonth": "This month",
    "thisWeek": "This week",
    "time": "Time",
    "today": "Today",
    "totalNotes": "Total notes",
    "totalSources": "Source sites",
    "totalTagsStat": "Total tags",
    "tryOtherKeywords": "Try different keywords",
    "tutorialTag": "tutorial",
    "updateFailed": "Update failed, please try again",
    "usageStats": "Usage Statistics",
    "webpage": "Webpage",
    "welcomeTag": "welcome",
    "willSendNotes": "Will send $1$ notes",
    "yesterday": "Yesterday"
  },
  "zh_CN": {
    "about": "关于",
    "aboutDesc": "了解 Mindful Words",
    "aboutText": "一款简洁优雅的网页内容收藏工具，帮助您保存和管理有价值的网络内容。",
    "aboutTitle": "关于",
    "adjustFilters": "尝试调整筛选条件",
    "allDataCleared": "所有数据已清除",
    "allDuplicatesError": "所有笔记都是重复的，已存在于 Anki 中",
    "ankiConnectError": "连接 AnkiConnect 失败",
    "ankiConnectNotRunning": "AnkiConnect 未运行。请确保 Anki 已运行并安装了 AnkiConnect 插件。",
    "appearanceDesc": "自定义应用的外观和显示方式",
    "appearanceSettings": "外观",
    "appearanceTitle": "外观设置",
    "btnCancel": "取消",
    "btnClear": "清除",
    "btnCopy": "复制",
    "btnDelete": "删除",
    "btnExport": "导出",
    "btnExportAction": "导出",
    "btnImportAction": "导入",
    "btnSave": "保存",
    "btnSelect": "选择笔记",
    "btnSettings": "设置",
    "cancel": "取消",
    "clearAllData": "清除所有数据",
    "clearAllDataDesc": "删除所有笔记和设置，此操作不可撤销",
    "clearCancelled": "已取消清除操作",
    "clearConfirm": "确定要清除所有数据吗？\n\n此操作将删除所有笔记和设置，且不可撤销！\n\n请输入 \"DELETE\" 确认删除：",
    "clearFailed": "清除失败，请重试",
    "clearFilters": "清除筛选",
    "clearSearch": "清除搜索",
    "confirm": "确定",
    "confirmBatchDeleteMessage": "确定要删除选中的 $1$ 条笔记吗？此操作不可撤销。",
    "confirmDelete": "删除笔记",
    "confirmDeleteMessage": "确定要删除这条笔记吗？",
    "confirmDeleteTag": "确定要删除标签 \"$1$\" 吗？\n该标签将从所有笔记中移除。",
    "contentCannotBeEmpty": "笔记内容不能为空",
    "contentLabel": "内容:",
    "contentPlaceholder": "输入笔记内容...",
    "contentTooLong": "内容超过 $1$ 个字符",
    "contextInvalidWarning": "扩展已更新。请刷新页面以继续保存笔记。",
    "copyFailed": "复制失败，请重试",
    "copySuccess": "已复制到剪贴板",
    "custom": "自定义",
    "dataDesc": "导出、导入和清理您的数据",
    "dataExported": "数据导出成功",
    "dataManagement": "数据",
    "dataTitle": "数据管理",
    "defaultNote1Content": "Mindful Words are seeds, action makes them grow. Try, fail, learn, then you'll truly know.",
    "defaultNote1Note": "欢迎使用 Mindful Words！这是你的第一条笔记。你可以为任何保存的内容添加个人笔记。",
    "defaultNote1Title": "欢迎使用 Mindful Words",
    "defaultNote2Content": "如何保存内容：在网页上选择任意文本，然后按住 Ctrl + 左键点击即可立即保存。你的笔记将包含内容、来源 URL、时间戳和标签。",
    "defaultNote2Note": "提示：你也可以使用 Ctrl+Shift+S 快捷键，或右键菜单保存选中的文本。",
    "defaultNote2Title": "如何使用 Mindful Words",
    "deleteFailed": "删除失败，请重试",
    "deleteNote": "删除笔记",
    "deleted": "已删除 $1$ 条笔记",
    "editNote": "编辑笔记",
    "endDate": "结束日期",
    "existingTags": "现有标签",
    "exportCSV": "CSV 格式",
    "exportCSVDesc": "适用于电子表格软件",
    "exportData": "导出数据",
    "exportDataDesc": "将所有笔记导出为 JSON 文件",
    "exportJSON": "JSON 格式",
    "exportJSONDesc": "导出完整数据结构",
    "exportOptions": "导出选项",
    "exportTXT": "TXT 格式",
    "exportTXTDesc": "纯文本，适用于任何环境",
    "extDescription": "are seeds, action makes them grow. Try, fail, learn, then you'll truly know.",
    "filterSource": "来源",
    "filterTags": "标签",
    "filterTime": "时间",
    "howToTag": "how-to",
    "importCancelled": "已取消导入操作",
    "importConfirm": "即将导入 $1$ 条笔记。\n是否与现有数据合并？\n\n点击\"确定\"合并数据\n点击\"取消\"放弃导入",
    "importData": "导入数据",
    "importDataDesc": "从 JSON 文件导入笔记数据",
    "importFailed": "导入失败，请重试",
    "importedNotes": "成功导入 $1$ 条新笔记",
    "inspirationTag": "inspiration",
    "invalidDataFormat": "无效的数据格式",
    "languageDesc": "选择显示语言",
    "languageEn": "English",
    "languageLabel": "语言",
    "languageZhCN": "简体中文",
    "last30Days": "最近30天",
    "last7Days": "最近7天",
    "loadFailed": "笔记加载失败，请刷新页面",
    "loading": "加载中...",
    "newNoteAdded": "新笔记已添加！",
    "noFilteredNotes": "没有符合筛选条件的笔记",
    "noMatchingNotes": "没有找到匹配的笔记",
    "noModelsFound": "未找到模板",
    "noNotes": "还没有保存任何笔记",
    "noNotesHint": "在网页上按住 Ctrl 并选择文本即可保存",
    "noSources": "暂无来源",
    "noTags": "暂无标签",
    "noTagsYet": "暂无标签，添加笔记后会自动生成标签",
    "note": "笔记",
    "noteNotFound": "找不到指定笔记",
    "operationFailed": "操作失败，请重试",
    "personalNote": "个人笔记",
    "personalNoteLabel": "个人笔记:",
    "personalNotePlaceholder": "添加你的想法或备注...",
    "refresh": "刷新",
    "saveFailed": "保存笔记失败: $1$",
    "saveSelection": "保存到 Mindful Words",
    "saveSettings": "保存设置",
    "saveSuccess": "笔记保存成功！",
    "saving": "保存中...",
    "searchPlaceholder": "搜索笔记...",
    "selectAll": "全选",
    "selectDeck": "选择牌组",
    "selectModel": "选择模板",
    "selectNotesFirst": "请先选择要操作的笔记",
    "selectSource": "选择来源",
    "selectTags": "选择标签",
    "selectTimeRange": "选择时间范围",
    "selectedCount": "已选择 $1$ 条",
    "send": "发送",
    "sendSuccess": "成功发送 $1$ 条笔记到 Anki",
    "sendSuccessWithSkipped": "发送 $1$ 条笔记到 Anki，跳过 $2$ 条重复笔记",
    "sendToAnki": "发送到 Anki",
    "sendToAnkiDesc": "通过 AnkiConnect 发送选中的笔记到 Anki",
    "settingsSaveFailed": "设置保存失败，请重试",
    "settingsSaved": "设置已保存",
    "settingsTitle": "设置",
    "source": "来源",
    "startDate": "开始日期",
    "storageUnavailable": "不可用",
    "storageUsage": "存储使用情况",
    "tagCount": "$1$ 个",
    "tagDeleted": "标签已删除",
    "tagsDesc": "管理笔记中使用的标签",
    "tagsLabel": "标签:",
    "tagsManagement": "标签",
    "tagsPlaceholder": "输入标签，用逗号分隔...",
    "tagsTitle": "标签管理",
    "themeDark": "深色",
    "themeLight": "浅色",
    "themeMode": "主题模式",
    "themeModeDesc": "选择浅色或深色主题，或跟随系统设置",
    "themeSystem": "跟随系统",
    "thisMonth": "本月",
    "thisWeek": "本周",
    "time": "时间",
    "today": "今天",
    "totalNotes": "笔记总数",
    "totalSources": "来源网站",
    "totalTagsStat": "标签数量",
    "tryOtherKeywords": "尝试其他关键词",
    "tutorialTag": "tutorial",
    "updateFailed": "更新失败，请重试",
    "usageStats": "使用统计",
    "webpage": "网页",
    "welcomeTag": "welcome",
    "willSendNotes": "将发送 $1$ 条笔记",
    "yesterday": "昨天"
  }
};

  const MSG = Object.freeze({ COMMAND: 'mw:command' });
  const CMD = Object.freeze({
    SAVE: 'save',
    DELETE: 'delete',
    UPDATE: 'update',
    REMOVE_TAG: 'removeTag',
    IMPORT: 'import',
    CLEAR: 'clear'
  });
  const STORE = Object.freeze({
    NOTES: 'notes',
    SETTINGS: 'settings',
    SCROLL: 'popup_scroll_position'
  });
  const LIMITS = Object.freeze({
    CONTENT_MAX: 10000,
    PREVIEW_MAX: 280,
    SAVE_THROTTLE_MS: 1000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 500,
    STORAGE_QUOTA: 5242880,
    ANKI_URL: 'http://127.0.0.1:8765',
    ANKI_VERSION: 5,
    ANKI_TAG: 'mindful-words',
    ANKI_PREFERRED_MODEL: 'Basic',
    TOAST_MS: 2500
  });
  const DEFAULT_SETTINGS = Object.freeze({ theme: 'light', language: null });
  const CONTEXT_MENU_ID = 'save-selection';

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function detectLanguage() {
    const tag = (typeof navigator !== 'undefined' && navigator.language) || 'en';
    const prefix = tag.toLowerCase().split(/[-_]/)[0];
    return Object.keys(STRINGS).find(name => name.toLowerCase().startsWith(prefix)) || 'en';
  }

  let currentLanguage = detectLanguage();

  const i18n = {
    get language() {
      return currentLanguage;
    },
    setLanguage(name) {
      currentLanguage = STRINGS[name] ? name : detectLanguage();
    },
    get(key, ...values) {
      const table = STRINGS[currentLanguage] || STRINGS.en;
      const message = table[key] ?? STRINGS.en[key] ?? key;
      return message.replace(/\$(\d+)\$/g, (_, position) =>
        String(values[Number(position) - 1] ?? '')
      );
    },
    applyToDocument() {
      const attributes = {
        'data-i18n': 'textContent',
        'data-i18n-placeholder': 'placeholder',
        'data-i18n-title': 'title'
      };
      Object.entries(attributes).forEach(([attribute, property]) => {
        document.querySelectorAll(`[${attribute}]`).forEach(element => {
          element[property] = i18n.get(element.getAttribute(attribute));
        });
      });
    }
  };

  function readLocal(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, result => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    });
  }

  function writeLocal(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve();
      });
    });
  }

  async function retry(operation) {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (attempt >= LIMITS.RETRY_ATTEMPTS) throw error;
        await sleep(LIMITS.RETRY_DELAY_MS);
      }
    }
  }

  function read(keys) {
    return retry(() => readLocal(keys));
  }

  const store = {
    async get(key) {
      const result = await read([key]);
      return result[key];
    },
    setMany(items) {
      return retry(() => writeLocal(items));
    },
    set(key, value) {
      return store.setMany({ [key]: value });
    },
    clear() {
      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          const error = chrome.runtime.lastError;
          if (error) reject(new Error(error.message));
          else resolve();
        });
      });
    },
    bytesInUse() {
      return new Promise((resolve, reject) => {
        chrome.storage.local.getBytesInUse(null, bytes => {
          const error = chrome.runtime.lastError;
          if (error) reject(new Error(error.message));
          else resolve(bytes);
        });
      });
    },
    onChanged(listener) {
      chrome.storage.onChanged.addListener(listener);
    }
  };

  function normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    return [...new Set(tags.map(tag => String(tag).trim()).filter(Boolean))];
  }

  function hostname(url) {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  }

  function allTags(list) {
    return [...new Set(list.flatMap(note => normalizeTags(note.tags)))].sort();
  }

  function allSources(list) {
    return [...new Set(list.map(note => hostname(note.url)).filter(Boolean))].sort();
  }

  function createNote(fields) {
    const content = String(fields.content ?? '').trim();
    return {
      id: fields.id ?? Date.now(),
      content,
      note: fields.note ?? '',
      title: fields.title || `${content.slice(0, 30)}...`,
      url: fields.url ?? '',
      createdAt: fields.timestamp ?? new Date().toISOString(),
      updatedAt: fields.timestamp ?? new Date().toISOString(),
      tags: normalizeTags(fields.tags)
    };
  }

  function patchNote(note, changes) {
    return {
      ...note,
      ...changes,
      id: note.id,
      updatedAt: new Date().toISOString()
    };
  }

  const notes = {
    create: createNote,
    patch: patchNote,
    normalizeTags,
    hostname,
    allTags,
    allSources,
    stats(list) {
      return { count: list.length, tags: allTags(list).length, sources: allSources(list).length };
    },
    repo: {
      async all() {
        const value = await store.get(STORE.NOTES);
        return Array.isArray(value) ? value : [];
      },
      save(list) {
        return store.set(STORE.NOTES, list);
      }
    },
    async run(name, payload) {
      const response = await bus.send({ type: MSG.COMMAND, name, payload });
      if (!response || response.status !== 'success') {
        throw new Error(response?.message || i18n.get('operationFailed'));
      }
      return response.result;
    }
  };

  const bus = {
    send(message) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, response => {
          const error = chrome.runtime.lastError;
          if (error) reject(new Error(error.message));
          else resolve(response);
        });
      });
    },
    serve(dispatch) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (!request || request.type !== MSG.COMMAND) return false;
        Promise.resolve()
          .then(() => dispatch(request.name, request.payload))
          .then(result => sendResponse({ status: 'success', result }))
          .catch(error => sendResponse({
            status: 'error',
            message: error?.message || i18n.get('operationFailed')
          }));
        return true;
      });
    }
  };

  const TOAST_CSS = `
.mw-toast {
  position: fixed;
  z-index: 2147483647;
  box-sizing: border-box;
  max-width: min(420px, calc(100vw - 32px));
  padding: 10px 16px;
  border-radius: 8px;
  color: #fff;
  font: 14px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  opacity: 1;
  transition: opacity 200ms ease;
}
.mw-toast--bottom { bottom: 24px; left: 50%; transform: translateX(-50%); }
.mw-toast--top { top: 12px; left: 50%; transform: translateX(-50%); }
.mw-toast--corner { bottom: 20px; right: 20px; }
.mw-toast--success { background-color: #34c759; }
.mw-toast--error { background-color: #ff3b30; }
.mw-toast--info, .mw-toast--pending { background-color: #2196f3; }
.mw-toast--out { opacity: 0; }
.mw-toast--pending::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  vertical-align: -2px;
  animation: mw-spin 1s linear infinite;
}
@keyframes mw-spin { to { transform: rotate(360deg); } }
`;

  function notify(message, options = {}) {
    const { type = 'success', placement = 'bottom', duration = LIMITS.TOAST_MS } = options;
    if (!document.getElementById('mw-toast-style')) {
      const style = document.createElement('style');
      style.id = 'mw-toast-style';
      style.textContent = TOAST_CSS;
      (document.head || document.documentElement).appendChild(style);
    }
    document.querySelectorAll('.mw-toast').forEach(element => element.remove());

    const toast = document.createElement('div');
    toast.className = `mw-toast mw-toast--${type} mw-toast--${placement}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    const timer = duration > 0 ? setTimeout(() => dismiss(), duration) : null;
    function dismiss() {
      if (timer) clearTimeout(timer);
      toast.classList.add('mw-toast--out');
      setTimeout(() => toast.remove(), 200);
    }
    return { dismiss };
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 100);
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHref(url) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
    } catch (error) {
      return '#';
    }
  }

  function formatDate(value) {
    const date = new Date(value);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function preview(content) {
    const escaped = escapeHtml(content);
    return escaped.length > LIMITS.PREVIEW_MAX
      ? `${escaped.slice(0, LIMITS.PREVIEW_MAX)}...`
      : escaped;
  }

  function applyTheme(value) {
    const resolved = value === 'system'
      ? (global.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light')
      : (value || DEFAULT_SETTINGS.theme);
    document.documentElement.setAttribute('data-theme', resolved);
  }

  function version() {
    return global.chrome?.runtime?.getManifest?.()?.version || '';
  }

  function normalizeSettings(value) {
    const settings = value && typeof value === 'object' ? value : {};
    return {
      theme: ['light', 'dark', 'system'].includes(settings.theme)
        ? settings.theme
        : DEFAULT_SETTINGS.theme,
      language: Object.hasOwn(STRINGS, settings.language)
        ? settings.language
        : DEFAULT_SETTINGS.language
    };
  }

  function applyPreferences(value) {
    const settings = normalizeSettings(value);
    i18n.setLanguage(settings.language);
    i18n.applyToDocument();
    applyTheme(settings.theme);
    return settings;
  }

  const backup = {
    create(list, settings) {
      return {
        version: version(),
        exportDate: new Date().toISOString(),
        notes: list,
        settings
      };
    },
    parse(text) {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.notes)) throw new Error('Invalid backup');
      return { notes: data.notes, settings: data.settings || null };
    }
  };

  const ui = {
    notify, download, escapeHtml, safeHref, formatDate, preview,
    theme: applyTheme, version
  };

  global.MW = Object.freeze({
    STRINGS,
    MSG,
    CMD,
    STORE,
    LIMITS,
    CONTEXT_MENU_ID,
    i18n,
    store,
    notes,
    bus,
    ui,
    backup,
    applyPreferences,
    normalizeSettings
  });
})(globalThis);
