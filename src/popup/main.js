import '../core/mw.js';
import { createNotesView } from './notes-view.js';
import { createFilters, selectNotes } from './filters.js';
import { createExporter } from './exporter.js';
import { createAnki } from './anki.js';

const { MW } = globalThis;
const { CMD, STORE, i18n, store, notes, ui } = MW;

const ELEMENT_IDS = {
  notesContainer: 'notes-container',
  notesList: 'notes-list',
  settingsBtn: 'settings-btn',
  selectBtn: 'select-btn',
  searchInput: 'search-input',
  clearSearchBtn: 'clear-search',
  editModal: 'edit-modal',
  editContent: 'edit-content',
  editNote: 'edit-note',
  editTags: 'edit-tags',
  closeModal: 'close-modal',
  cancelEdit: 'cancel-edit',
  saveEdit: 'save-edit',
  confirmModal: 'confirm-modal',
  confirmTitle: 'confirm-title',
  confirmMessage: 'confirm-message',
  confirmCancel: 'confirm-cancel',
  confirmOk: 'confirm-ok',
  selectionBar: 'selection-bar',
  selectAllCheckbox: 'select-all-checkbox',
  selectionCount: 'selection-count',
  copySelectedBtn: 'copy-selected-btn',
  exportSelectedBtn: 'export-selected-btn',
  deleteSelectedBtn: 'delete-selected-btn',
  cancelSelectionBtn: 'cancel-selection-btn',
  filterTagsBtn: 'filter-tags-btn',
  filterTimeBtn: 'filter-time-btn',
  filterSourceBtn: 'filter-source-btn',
  clearFiltersBtn: 'clear-filters-btn',
  workspace: 'workspace',
  resultsCount: 'results-count'
};

const elements = Object.fromEntries(
  Object.entries(ELEMENT_IDS).map(([name, id]) => [name, document.getElementById(id)])
);

const state = {
  notes: [],
  searchQuery: '',
  selectionMode: false,
  selected: new Set(),
  editing: null,
  confirmCallback: null,
  filters: { tags: [], timeRange: null, sources: [] }
};

const view = createNotesView({ MW, state, elements });
const filters = createFilters({ MW, state, elements, onChange: renderVisible });
const anki = createAnki({ MW });
const exporter = createExporter({ MW, state, anki });

function visibleNotes() {
  return selectNotes(state.notes, state.searchQuery, state.filters, MW);
}

function renderVisible() {
  const visible = visibleNotes();
  view.render(visible);
  filters.updateActive();
  elements.resultsCount.textContent = visible.length === 1
    ? i18n.get('notesCountOne')
    : i18n.get('notesCount', visible.length);
  elements.clearSearchBtn.classList.toggle('hidden', !elements.searchInput.value);
  updateSelectionUI();
}

async function refresh({ showAdded = false } = {}) {
  const previousCount = state.notes.length;
  try {
    state.notes = await notes.repo.all();
  } catch (error) {
    console.error('[Mindful Words] Loading notes failed:', error);
    ui.notify(i18n.get('loadFailed'), { type: 'error' });
  }
  renderVisible();
  if (showAdded && state.notes.length > previousCount) {
    ui.notify(i18n.get('newNoteAdded'), { placement: 'top' });
  }
}

function toggleSelectionMode() {
  if (state.selectionMode) {
    exitSelectionMode();
    return;
  }
  state.selectionMode = true;
  state.selected.clear();
  elements.workspace.classList.add('hidden');
  elements.selectionBar.classList.remove('hidden');
  elements.selectBtn.classList.add('active');
  renderVisible();
}

function exitSelectionMode() {
  state.selectionMode = false;
  state.selected.clear();
  elements.workspace.classList.remove('hidden');
  elements.selectionBar.classList.add('hidden');
  elements.selectBtn.classList.remove('active');
  elements.selectAllCheckbox.checked = false;
  renderVisible();
}

function toggleSelectAll(checked) {
  state.selected.clear();
  if (checked) visibleNotes().forEach(note => state.selected.add(note.id));
  renderVisible();
}

function toggleNoteSelection(id) {
  if (state.selected.has(id)) state.selected.delete(id);
  else state.selected.add(id);

  const isSelected = state.selected.has(id);
  for (const item of elements.notesList.querySelectorAll('.note-item')) {
    if (item.dataset.id === String(id)) item.classList.toggle('selected', isSelected);
  }
  const checkbox = [...elements.notesList.querySelectorAll('.note-checkbox')]
    .find(input => input.dataset.id === String(id));
  if (checkbox) checkbox.checked = isSelected;
  updateSelectionUI();
}

function updateSelectionUI() {
  const count = state.selected.size;
  elements.selectionCount.textContent = i18n.get('selectedCount', count);
  elements.selectAllCheckbox.checked = count === visibleNotes().length && count > 0;
  [elements.copySelectedBtn, elements.exportSelectedBtn, elements.deleteSelectedBtn]
    .forEach(button => { button.disabled = count === 0; });
}

function formatNotesForCopy(list) {
  return list.map(note => {
    const parts = [note.content];
    if (note.note?.trim()) parts.push(`${i18n.get('personalNote')}: ${note.note}`);
    if (note.tags?.length) parts.push(`${i18n.get('filterTags')}: ${note.tags.join(', ')}`);
    return parts.join('\n\n');
  }).join('\n\n---\n\n');
}

async function copySelectedNotes() {
  const selected = state.notes.filter(note => state.selected.has(note.id));
  if (!selected.length) {
    ui.notify(i18n.get('selectNotesFirst'), { type: 'error' });
    return;
  }
  try {
    await navigator.clipboard.writeText(formatNotesForCopy(selected));
    ui.notify(i18n.get('copySuccess'));
  } catch (error) {
    console.error('[Mindful Words] Copy failed:', error);
    ui.notify(i18n.get('copyFailed'), { type: 'error' });
  }
}

async function removeNotes(ids) {
  try {
    await notes.run(CMD.DELETE, { ids });
    state.notes = state.notes.filter(note => !ids.includes(note.id));
    ids.forEach(id => state.selected.delete(id));
    renderVisible();
    ui.notify(i18n.get('deleted', ids.length));
  } catch (error) {
    console.error('[Mindful Words] Delete failed:', error);
    ui.notify(i18n.get('deleteFailed'), { type: 'error' });
  }
}

function deleteNote(id) {
  showConfirm(
    i18n.get('confirmDelete'),
    i18n.get('confirmDeleteMessage'),
    () => removeNotes([id])
  );
}

function deleteSelectedNotes() {
  const ids = [...state.selected];
  if (!ids.length) {
    ui.notify(i18n.get('selectNotesFirst'), { type: 'error' });
    return;
  }
  showConfirm(
    i18n.get('confirmDelete'),
    i18n.get('confirmBatchDeleteMessage', ids.length),
    async () => {
      await removeNotes(ids);
      exitSelectionMode();
    }
  );
}

function openEditModal(id) {
  const note = state.notes.find(item => item.id === id);
  if (!note) return;
  state.editing = note;
  elements.editContent.value = note.content;
  elements.editNote.value = note.note || '';
  elements.editTags.value = (note.tags || []).join(', ');
  elements.editModal.style.display = 'flex';
  elements.editContent.focus();
}

function closeEditModal() {
  elements.editModal.style.display = 'none';
  state.editing = null;
  elements.editContent.value = '';
  elements.editNote.value = '';
  elements.editTags.value = '';
}

async function saveNoteEdit() {
  if (!state.editing) return;
  const content = elements.editContent.value.trim();
  if (!content) {
    ui.notify(i18n.get('contentCannotBeEmpty'), { type: 'error' });
    return;
  }
  const patch = {
    content,
    note: elements.editNote.value.trim(),
    tags: notes.normalizeTags(elements.editTags.value.split(','))
  };
  try {
    const updated = await notes.run(CMD.UPDATE, { id: state.editing.id, patch });
    const index = state.notes.findIndex(note => note.id === state.editing.id);
    if (index !== -1) state.notes[index] = updated;
    closeEditModal();
    renderVisible();
  } catch (error) {
    console.error('[Mindful Words] Update failed:', error);
    ui.notify(i18n.get('updateFailed'), { type: 'error' });
  }
}

function showConfirm(title, message, callback) {
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  state.confirmCallback = callback;
  elements.confirmModal.style.display = 'flex';
}

function closeConfirmModal() {
  elements.confirmModal.style.display = 'none';
  state.confirmCallback = null;
}

function bindEvents() {
  const modalActions = [
    { modal: elements.editModal, close: closeEditModal },
    { modal: elements.confirmModal, close: closeConfirmModal }
  ];

  elements.settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

  document.addEventListener('click', event => {
    if (event.target.classList.contains('note-checkbox')) {
      event.stopPropagation();
      toggleNoteSelection(Number(event.target.dataset.id));
      return;
    }
    if (event.target.classList.contains('delete-btn')) {
      event.stopPropagation();
      deleteNote(Number(event.target.dataset.id));
      return;
    }
    if (event.target.classList.contains('note-url')) return;

    const item = event.target.closest('.note-item');
    if (!item) return;
    const id = Number(item.dataset.id);
    if (state.selectionMode) toggleNoteSelection(id);
    else if (!event.target.classList.contains('action-btn')) openEditModal(id);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const visible = modalActions.find(entry => entry.modal.style.display === 'flex');
    visible?.close();
  });

  modalActions.forEach(({ modal, close }) => {
    modal.addEventListener('click', event => {
      if (event.target === modal) close();
    });
  });

  elements.closeModal.addEventListener('click', closeEditModal);
  elements.cancelEdit.addEventListener('click', closeEditModal);
  elements.saveEdit.addEventListener('click', saveNoteEdit);
  elements.confirmCancel.addEventListener('click', closeConfirmModal);
  elements.confirmOk.addEventListener('click', () => {
    const callback = state.confirmCallback;
    closeConfirmModal();
    callback?.();
  });

  elements.searchInput.addEventListener('input', event => {
    state.searchQuery = event.target.value.trim();
    renderVisible();
  });
  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    renderVisible();
  });

  const filterButtons = [
    ['tags', elements.filterTagsBtn],
    ['time', elements.filterTimeBtn],
    ['source', elements.filterSourceBtn]
  ];
  filterButtons.forEach(([type, button]) => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      filters.open(type, button);
    });
  });
  elements.clearFiltersBtn.addEventListener('click', filters.clearAll);

  elements.selectBtn.addEventListener('click', toggleSelectionMode);
  elements.selectAllCheckbox.addEventListener('change', event => toggleSelectAll(event.target.checked));
  elements.copySelectedBtn.addEventListener('click', copySelectedNotes);
  elements.exportSelectedBtn.addEventListener('click', exporter.open);
  elements.deleteSelectedBtn.addEventListener('click', deleteSelectedNotes);
  elements.cancelSelectionBtn.addEventListener('click', exitSelectionMode);

  let scrollTimer;
  elements.notesContainer.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      store.set(STORE.SCROLL, elements.notesContainer.scrollTop)
        .catch(error => console.error('[Mindful Words] Scroll position not saved:', error));
    }, 300);
  });

  store.onChanged(changes => {
    if (changes[STORE.NOTES]) refresh({ showAdded: true });
    if (changes[STORE.SETTINGS]) {
      MW.applyPreferences(changes[STORE.SETTINGS].newValue);
      renderVisible();
    }
  });
}

async function restoreScrollPosition() {
  try {
    const position = await store.get(STORE.SCROLL);
    if (typeof position === 'number') elements.notesContainer.scrollTop = position;
  } catch (error) {
    console.error('[Mindful Words] Scroll position not restored:', error);
  }
}

async function init() {
  try {
    MW.applyPreferences(await store.get(STORE.SETTINGS));
  } catch (error) {
    console.error('[Mindful Words] Loading settings failed:', error);
    MW.applyPreferences(null);
  }
  bindEvents();
  await refresh();
  await restoreScrollPosition();
}

init();
