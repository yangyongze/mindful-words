export function createNotesView({ MW, state, elements }) {
  const { i18n, ui, notes } = MW;

  function emptyMarkup() {
    const searching = Boolean(state.searchQuery.trim());
    const filtering = state.filters.tags.length > 0
      || state.filters.sources.length > 0
      || Boolean(state.filters.timeRange);
    const title = filtering ? 'noFilteredNotes' : searching ? 'noMatchingNotes' : 'noNotes';
    const hint = filtering ? 'adjustFilters' : searching ? 'tryOtherKeywords' : 'noNotesHint';

    return `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <p class="empty-title">${ui.escapeHtml(i18n.get(title))}</p>
        <p class="empty-hint">${ui.escapeHtml(i18n.get(hint))}</p>
      </div>`;
  }

  function markup(note) {
    const id = ui.escapeHtml(note.id);
    const selected = state.selected.has(note.id);
    const tags = note.tags || [];
    const personal = note.note?.trim()
      ? `<div class="note-personal-note">${ui.preview(note.note)}</div>`
      : '';
    const tagsHtml = tags.length
      ? `<div class="note-tags">${tags.map(tag => `<span class="tag">${ui.escapeHtml(tag)}</span>`).join('')}</div>`
      : '';
    const checkbox = state.selectionMode
      ? `<input type="checkbox" class="note-checkbox" ${selected ? 'checked' : ''} data-id="${id}">`
      : '';
    const deleteButton = state.selectionMode
      ? ''
      : `<span class="action-btn delete-btn" data-id="${id}" title="${ui.escapeHtml(i18n.get('deleteNote'))}">${ui.escapeHtml(i18n.get('btnDelete'))}</span>`;
    const source = notes.hostname(note.url);
    const href = ui.escapeHtml(ui.safeHref(note.url));

    return `
      <div class="note-item ${state.selectionMode ? 'has-checkbox' : ''} ${selected ? 'selected' : ''}" data-id="${id}">
        ${checkbox}
        <div class="note-content">${ui.preview(note.content)}</div>
        ${personal}
        ${tagsHtml}
        <div class="note-meta">
          ${ui.formatDate(note.createdAt)} ·
          <a href="${href}" target="_blank" class="note-url" title="${href}">${ui.escapeHtml(source || i18n.get('webpage'))}</a>
          <span class="spacer"></span>
          ${deleteButton}
        </div>
      </div>`;
  }

  return {
    render(list) {
      const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      elements.notesList.innerHTML = sorted.length
        ? sorted.map(markup).join('')
        : emptyMarkup();
    }
  };
}
