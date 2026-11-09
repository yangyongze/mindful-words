import '../core/mw.js';

const { MW } = globalThis;
const { CMD, STORE, LIMITS, i18n, store, notes, ui } = MW;

const ELEMENT_IDS = {
  themeSelect: 'theme',
  languageSelect: 'language',
  saveSettingsBtn: 'save-settings',
  tagList: 'tag-list',
  tagCount: 'tag-count',
  exportDataBtn: 'export-data-btn',
  importDataBtn: 'import-data-btn',
  importFileInput: 'import-file-input',
  clearDataBtn: 'clear-data-btn',
  storageSize: 'storage-size',
  storageProgress: 'storage-progress',
  totalNotes: 'total-notes',
  totalTags: 'total-tags',
  totalSources: 'total-sources',
  aboutVersion: 'about-version'
};

const elements = Object.fromEntries(
  Object.entries(ELEMENT_IDS).map(([name, id]) => [name, document.getElementById(id)])
);
elements.navItems = document.querySelectorAll('.nav-item');
elements.contentSections = document.querySelectorAll('.content-section');

const state = {
  notes: [],
  settings: null
};

async function loadAll() {
  const [list, settings] = await Promise.all([
    notes.repo.all(),
    store.get(STORE.SETTINGS)
  ]);
  state.notes = list;
  state.settings = MW.applyPreferences(settings);

  elements.themeSelect.value = state.settings.theme;
  elements.languageSelect.value = state.settings.language || i18n.language;
  elements.aboutVersion.textContent = `v${ui.version()}`;

  renderTags();
  renderStats();
  await renderStorage();
}

function renderTags() {
  const tags = notes.allTags(state.notes);
  elements.tagCount.textContent = i18n.get('tagCount', tags.length);

  if (!tags.length) {
    elements.tagList.innerHTML = `<div class="tag-empty">${ui.escapeHtml(i18n.get('noTagsYet'))}</div>`;
    return;
  }

  elements.tagList.innerHTML = tags.map(tag => `
    <div class="tag-item">
      <span>${ui.escapeHtml(tag)}</span>
      <span class="tag-remove" data-tag="${ui.escapeHtml(tag)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </span>
    </div>`).join('');
}

function renderStats() {
  const stats = notes.stats(state.notes);
  elements.totalNotes.textContent = stats.count;
  elements.totalTags.textContent = stats.tags;
  elements.totalSources.textContent = stats.sources;
}

async function renderStorage() {
  try {
    const bytes = await store.bytesInUse();
    const quota = globalThis.chrome?.storage?.local?.QUOTA_BYTES || LIMITS.STORAGE_QUOTA;
    const percentage = (bytes / quota) * 100;
    elements.storageSize.textContent = `${(bytes / 1024 / 1024).toFixed(2)} MB / ${(quota / 1024 / 1024).toFixed(0)} MB`;
    elements.storageProgress.style.width = `${percentage.toFixed(1)}%`;
    elements.storageProgress.style.backgroundColor = percentage > 80
      ? 'var(--error-color)'
      : percentage > 60 ? 'var(--warning-color)' : '';
  } catch (error) {
    console.error('[Mindful Words] Storage usage unavailable:', error);
    elements.storageSize.textContent = i18n.get('storageUnavailable');
  }
}

async function saveSettings() {
  const settings = {
    theme: elements.themeSelect.value,
    language: elements.languageSelect.value
  };
  try {
    await store.set(STORE.SETTINGS, settings);
    state.settings = MW.applyPreferences(settings);
    ui.notify(i18n.get('settingsSaved'), { placement: 'corner' });
  } catch (error) {
    console.error('[Mindful Words] Saving settings failed:', error);
    ui.notify(i18n.get('settingsSaveFailed'), { type: 'error', placement: 'corner' });
  }
}

async function deleteTag(tag) {
  if (!confirm(i18n.get('confirmDeleteTag', tag))) return;
  try {
    await notes.run(CMD.REMOVE_TAG, { tag });
    await loadAll();
    ui.notify(i18n.get('tagDeleted'), { placement: 'corner' });
  } catch (error) {
    console.error('[Mindful Words] Removing tag failed:', error);
    ui.notify(i18n.get('operationFailed'), { type: 'error', placement: 'corner' });
  }
}

function exportData() {
  const filename = `mindful-words-backup-${new Date().toISOString().split('T')[0]}.json`;
  const blob = new Blob(
    [JSON.stringify(MW.backup.create(state.notes, state.settings), null, 2)],
    { type: 'application/json' }
  );
  ui.download(blob, filename);
  ui.notify(i18n.get('dataExported'), { placement: 'corner' });
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    let backup;
    try {
      backup = MW.backup.parse(await file.text());
    } catch (error) {
      console.error('[Mindful Words] Invalid backup file:', error);
      ui.notify(i18n.get('invalidDataFormat'), { type: 'error', placement: 'corner' });
      return;
    }
    if (!confirm(i18n.get('importConfirm', backup.notes.length))) {
      ui.notify(i18n.get('importCancelled'), { type: 'error', placement: 'corner' });
      return;
    }
    const result = await notes.run(CMD.IMPORT, {
      notes: backup.notes,
      settings: backup.settings
    });
    await loadAll();
    ui.notify(i18n.get('importedNotes', result.imported), { placement: 'corner' });
  } catch (error) {
    console.error('[Mindful Words] Import failed:', error);
    ui.notify(i18n.get('importFailed'), { type: 'error', placement: 'corner' });
  } finally {
    elements.importFileInput.value = '';
  }
}

async function clearAllData() {
  const answer = prompt(i18n.get('clearConfirm'));
  if (answer !== 'DELETE') {
    if (answer !== null) {
      ui.notify(i18n.get('clearCancelled'), { type: 'error', placement: 'corner' });
    }
    return;
  }
  try {
    await notes.run(CMD.CLEAR, {});
    await loadAll();
    ui.notify(i18n.get('allDataCleared'), { placement: 'corner' });
  } catch (error) {
    console.error('[Mindful Words] Clearing data failed:', error);
    ui.notify(i18n.get('clearFailed'), { type: 'error', placement: 'corner' });
  }
}

function switchSection(sectionId) {
  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });
  elements.contentSections.forEach(section => {
    section.classList.toggle('active', section.id === `section-${sectionId}`);
  });
}

function bindEvents() {
  elements.themeSelect.addEventListener('change', saveSettings);
  elements.languageSelect.addEventListener('change', saveSettings);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);

  elements.navItems.forEach(item => {
    item.addEventListener('click', () => switchSection(item.dataset.section));
  });

  elements.tagList.addEventListener('click', event => {
    const button = event.target.closest('.tag-remove');
    if (button) deleteTag(button.dataset.tag);
  });

  elements.exportDataBtn.addEventListener('click', exportData);
  elements.importDataBtn.addEventListener('click', () => elements.importFileInput.click());
  elements.importFileInput.addEventListener('change', importData);
  elements.clearDataBtn.addEventListener('click', clearAllData);

  store.onChanged(changes => {
    if (!changes[STORE.NOTES] && !changes[STORE.SETTINGS]) return;
    loadAll().catch(error => console.error('[Mindful Words] Reloading options failed:', error));
  });
}

async function init() {
  bindEvents();
  try {
    await loadAll();
  } catch (error) {
    console.error('[Mindful Words] Loading options failed:', error);
    ui.notify(i18n.get('loadFailed'), { type: 'error', placement: 'corner' });
  }
}

init();
