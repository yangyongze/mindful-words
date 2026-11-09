const ICON_EXPORT = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>`;

const ICON_DOCUMENT = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>`;

const FORMATS = [
  { id: 'ai', label: 'sendToAnki', desc: 'sendToAnkiDesc', icon: ICON_EXPORT },
  { id: 'json', label: 'exportJSON', desc: 'exportJSONDesc', icon: ICON_DOCUMENT },
  { id: 'csv', label: 'exportCSV', desc: 'exportCSVDesc', icon: ICON_DOCUMENT },
  { id: 'txt', label: 'exportTXT', desc: 'exportTXTDesc', icon: ICON_DOCUMENT }
];

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function createExporter({ MW, state, anki }) {
  const { i18n, ui } = MW;

  const handlers = {
    ai: notes => anki.send(notes),
    json: notes => ui.download(
      new Blob([JSON.stringify(MW.backup.create(notes), null, 2)], { type: 'application/json' }),
      'mindful_notes.json'
    ),
    csv: notes => {
      const headers = ['Content', 'Personal Note', 'Title', 'Source URL', 'Tags', 'Created', 'Updated'];
      const rows = notes.map(note => [
        note.content,
        note.note,
        note.title,
        note.url,
        (note.tags || []).join(';'),
        note.createdAt,
        note.updatedAt
      ].map(csvCell).join(','));
      ui.download(
        new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' }),
        'mindful_notes.csv'
      );
    },
    txt: notes => {
      const text = notes.map((note, index) => [
        `--- ${i18n.get('note')} ${index + 1} ---`,
        note.content,
        '',
        ...(note.note?.trim() ? [`${i18n.get('personalNote')}: ${note.note}`, ''] : []),
        `${i18n.get('filterTags')}: ${note.tags?.length ? `[${note.tags.join(', ')}]` : ''}`,
        `${i18n.get('source')}: ${note.url}`,
        `${i18n.get('time')}: ${new Date(note.createdAt).toLocaleString()}`,
        ''
      ].join('\n')).join('\n');
      ui.download(new Blob([text], { type: 'text/plain;charset=utf-8;' }), 'mindful_notes.txt');
    }
  };

  function open() {
    const notes = state.notes.filter(note => state.selected.has(note.id));
    if (!notes.length) {
      ui.notify(i18n.get('selectNotesFirst'), { type: 'error' });
      return;
    }

    document.querySelector('.export-menu')?.remove();
    document.querySelector('.export-menu-backdrop')?.remove();

    const menu = document.createElement('div');
    menu.className = 'export-menu';
    menu.innerHTML = `
      <div class="export-menu-header">${ui.escapeHtml(i18n.get('exportOptions'))}</div>
      <div class="export-options">
        ${FORMATS.map(format => `
          <div class="export-option export-option-${format.id}" data-format="${format.id}">
            ${format.icon}
            <div class="option-content">
              <span class="option-label">${ui.escapeHtml(i18n.get(format.label))}</span>
              <span class="option-desc">${ui.escapeHtml(i18n.get(format.desc))}</span>
            </div>
          </div>`).join('')}
      </div>`;

    const backdrop = document.createElement('div');
    backdrop.className = 'export-menu-backdrop';
    document.body.append(backdrop, menu);

    const close = () => {
      menu.remove();
      backdrop.remove();
    };

    menu.querySelectorAll('.export-option').forEach(option => {
      option.addEventListener('click', () => {
        handlers[option.dataset.format](notes);
        close();
      });
    });
    backdrop.addEventListener('click', close);
  }

  return { open };
}
