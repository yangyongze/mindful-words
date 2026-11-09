import '../core/mw.js';

const { MW } = globalThis;
const { CMD, LIMITS, CONTEXT_MENU_ID, STORE, i18n, store, notes } = MW;
const repo = notes.repo;

let queue = Promise.resolve();

function serialize(task) {
  const result = queue.then(task);
  queue = result.catch(error => console.error('[Mindful Words] Queued command failed:', error));
  return result;
}

async function withNotes(transform) {
  const current = await repo.all();
  const { list, result } = transform(current);
  await repo.save(list);
  return result;
}

function importedTimestamp(value) {
  if (value === undefined || value === null || value === '') return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
}

function normalizeImportedNote(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const content = String(raw.content ?? '').trim();
  if (!content) return null;
  const timestamp = importedTimestamp(raw.createdAt);
  return notes.create({
    id: raw.id ?? Date.now() + index,
    content,
    note: raw.note,
    title: raw.title,
    url: raw.url,
    tags: raw.tags,
    timestamp
  });
}

const commands = {
  [CMD.SAVE](payload) {
    const content = String(payload?.content ?? '').trim();
    if (!content) throw new Error(i18n.get('contentCannotBeEmpty'));
    if (content.length > LIMITS.CONTENT_MAX) {
      throw new Error(i18n.get('contentTooLong', LIMITS.CONTENT_MAX));
    }
    const note = notes.create({
      content,
      title: payload.title,
      url: payload.url,
      tags: payload.tags
    });
    return withNotes(list => ({ list: [...list, note], result: note }));
  },

  [CMD.DELETE](payload) {
    const targets = new Set(payload.ids);
    return withNotes(list => {
      const next = list.filter(note => !targets.has(note.id));
      if (next.length === list.length) throw new Error(i18n.get('noteNotFound'));
      return { list: next, result: { deleted: list.length - next.length } };
    });
  },

  [CMD.UPDATE](payload) {
    return withNotes(list => {
      const index = list.findIndex(note => note.id === payload.id);
      if (index === -1) throw new Error(i18n.get('noteNotFound'));
      const updated = notes.patch(list[index], payload.patch);
      const next = [...list];
      next[index] = updated;
      return { list: next, result: updated };
    });
  },

  [CMD.REMOVE_TAG](payload) {
    return withNotes(list => ({
      list: list.map(note => note.tags?.includes(payload.tag)
        ? notes.patch(note, { tags: note.tags.filter(tag => tag !== payload.tag) })
        : note),
      result: null
    }));
  },

  async [CMD.IMPORT](payload) {
    if (!Array.isArray(payload.notes)) throw new Error(i18n.get('invalidDataFormat'));
    const current = await repo.all();
    const known = new Set(current.map(note => note.id));
    const fresh = payload.notes
      .map(normalizeImportedNote)
      .filter(Boolean)
      .filter(note => {
        if (known.has(note.id)) return false;
        known.add(note.id);
        return true;
      });
    const items = { [STORE.NOTES]: [...current, ...fresh] };
    if (payload.settings) {
      items[STORE.SETTINGS] = MW.normalizeSettings(payload.settings);
    }
    await store.setMany(items);
    return { imported: fresh.length };
  },

  [CMD.CLEAR]() {
    return store.clear();
  }
};

function dispatch(name, payload) {
  return serialize(() => {
    const command = commands[name];
    if (!command) throw new Error(`Unknown command: ${name}`);
    return command(payload);
  });
}

MW.bus.serve(dispatch);

async function seedDefaultNotes() {
  if ((await repo.all()).length > 0) return;

  const timestamp = new Date().toISOString();
  const samples = [
    {
      content: i18n.get('defaultNote1Content'),
      note: i18n.get('defaultNote1Note'),
      title: i18n.get('defaultNote1Title'),
      tags: [i18n.get('welcomeTag'), i18n.get('inspirationTag')]
    },
    {
      content: i18n.get('defaultNote2Content'),
      note: i18n.get('defaultNote2Note'),
      title: i18n.get('defaultNote2Title'),
      tags: [i18n.get('tutorialTag'), i18n.get('howToTag')]
    }
  ];

  await repo.save(samples.map((sample, index) => notes.create({
    ...sample,
    id: Date.now() + index,
    timestamp
  })));
}

function resetContextMenu() {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: i18n.get('saveSelection'),
        contexts: ['selection']
      }, () => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else resolve();
      });
    });
  });
}

chrome.action.onClicked.addListener(tab => {
  chrome.sidePanel.open({ tabId: tab.id });
});

async function syncStoredLanguage() {
  try {
    i18n.setLanguage((await store.get(STORE.SETTINGS))?.language);
  } catch (error) {
    console.error('[Mindful Words] Loading language failed:', error);
  }
}

chrome.runtime.onInstalled.addListener(async details => {
  try {
    await syncStoredLanguage();
    await resetContextMenu();
    if (details.reason === 'install') await seedDefaultNotes();
  } catch (error) {
    console.error('[Mindful Words] Installation setup failed:', error);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) return;
  dispatch(CMD.SAVE, {
    content: info.selectionText,
    title: tab?.title,
    url: tab?.url,
    tags: []
  }).catch(error => console.error('[Mindful Words] Context menu save failed:', error));
});

syncStoredLanguage();

store.onChanged(changes => {
  if (!changes[STORE.SETTINGS]) return;
  i18n.setLanguage(changes[STORE.SETTINGS].newValue?.language);
  resetContextMenu().catch(error => console.error('[Mindful Words] Context menu not updated:', error));
});
