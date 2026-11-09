const TIME_SHORTCUTS = [
  { type: 'today', label: 'today', range: (now, midnight) => ({ start: midnight, end: now }) },
  {
    type: 'yesterday',
    label: 'yesterday',
    range: (_now, midnight, daysBack) => ({ start: daysBack(1), end: new Date(midnight.getTime() - 1) })
  },
  {
    type: 'week',
    label: 'thisWeek',
    range: (now, midnight, daysBack) => ({ start: daysBack(midnight.getDay()), end: now })
  },
  {
    type: 'month',
    label: 'thisMonth',
    range: now => ({ start: new Date(now.getFullYear(), now.getMonth(), 1), end: now })
  },
  { type: 'last7', label: 'last7Days', range: (now, _midnight, daysBack) => ({ start: daysBack(6), end: now }) },
  { type: 'last30', label: 'last30Days', range: (now, _midnight, daysBack) => ({ start: daysBack(29), end: now }) },
  { type: 'custom', label: 'custom', range: null }
];

function timeRange(type) {
  const shortcut = TIME_SHORTCUTS.find(item => item.type === type);
  if (!shortcut?.range) return null;
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysBack = count => new Date(
    midnight.getFullYear(),
    midnight.getMonth(),
    midnight.getDate() - count
  );
  return { type, ...shortcut.range(now, midnight, daysBack) };
}

function timeLabel(type) {
  return TIME_SHORTCUTS.find(item => item.type === type)?.label || 'filterTime';
}

function dateInputValue(date) {
  if (!date) return '';
  const value = new Date(date);
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function dateFromInput(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function selectNotes(list, query, filters, MW) {
  const text = query.trim().toLowerCase();
  return list.filter(note => {
    if (filters.tags.length && !(note.tags || []).some(tag => filters.tags.includes(tag))) {
      return false;
    }
    if (filters.timeRange) {
      const created = new Date(note.createdAt);
      if (created < filters.timeRange.start || created > filters.timeRange.end) return false;
    }
    if (filters.sources.length && !filters.sources.includes(MW.notes.hostname(note.url))) return false;
    if (text && ![note.content, note.title, note.note]
      .some(value => String(value ?? '').toLowerCase().includes(text))) {
      return false;
    }
    return true;
  });
}

export function createFilters({ MW, state, elements, onChange }) {
  const { i18n, ui, notes } = MW;
  let outsideHandler = null;

  function close() {
    if (outsideHandler) {
      document.removeEventListener('click', outsideHandler);
      outsideHandler = null;
    }
    document.querySelectorAll('.filter-dropdown').forEach(element => element.remove());
    [elements.filterTagsBtn, elements.filterTimeBtn, elements.filterSourceBtn]
      .forEach(button => button.classList.remove('active'));
  }

  function checkboxes(tags, selected, emptyKey) {
    if (!tags.length) {
      return `<div class="filter-option" style="color: var(--secondary-text); padding: 12px 16px;">${ui.escapeHtml(i18n.get(emptyKey))}</div>`;
    }
    return tags.map((tag, index) => `
      <div class="filter-option">
        <input type="checkbox" id="filter-option-${index}" value="${ui.escapeHtml(tag)}" ${selected.includes(tag) ? 'checked' : ''}>
        <label for="filter-option-${index}">${ui.escapeHtml(tag)}</label>
      </div>`).join('');
  }

  const panels = {
    tags: {
      title: () => i18n.get('selectTags'),
      body: () => checkboxes(notes.allTags(state.notes), state.filters.tags, 'noTags'),
      apply: dropdown => {
        state.filters.tags = [...dropdown.querySelectorAll('input:checked')].map(input => input.value);
      }
    },
    time: {
      title: () => i18n.get('selectTimeRange'),
      body: () => {
        const current = state.filters.timeRange?.type;
        const radios = TIME_SHORTCUTS.map(({ type, label }) => `
          <label><input type="radio" name="time-shortcut" value="${type}" ${current === type ? 'checked' : ''}> ${ui.escapeHtml(i18n.get(label))}</label>
        `).join('');
        return `
          <div class="time-shortcuts">${radios}</div>
          <div class="time-custom ${current === 'custom' ? '' : 'hidden'}">
            <label>${ui.escapeHtml(i18n.get('startDate'))}</label>
            <input type="date" id="time-start" value="${dateInputValue(state.filters.timeRange?.start)}">
            <label>${ui.escapeHtml(i18n.get('endDate'))}</label>
            <input type="date" id="time-end" value="${dateInputValue(state.filters.timeRange?.end)}">
          </div>`;
      },
      wire: dropdown => {
        const custom = dropdown.querySelector('.time-custom');
        dropdown.querySelectorAll('input[name="time-shortcut"]').forEach(radio => {
          radio.addEventListener('change', () => {
            custom.classList.toggle('hidden', radio.value !== 'custom');
          });
        });
      },
      apply: dropdown => {
        const selected = dropdown.querySelector('input[name="time-shortcut"]:checked');
        if (!selected) {
          state.filters.timeRange = null;
        } else if (selected.value === 'custom') {
          const start = dropdown.querySelector('#time-start').value;
          const end = dropdown.querySelector('#time-end').value;
          if (!start || !end) {
            state.filters.timeRange = null;
          } else {
            const endDate = dateFromInput(end);
            endDate.setHours(23, 59, 59, 999);
            state.filters.timeRange = {
              type: 'custom',
              start: dateFromInput(start),
              end: endDate
            };
          }
        } else {
          state.filters.timeRange = timeRange(selected.value);
        }
      }
    },
    source: {
      title: () => i18n.get('selectSource'),
      body: () => checkboxes(notes.allSources(state.notes), state.filters.sources, 'noSources'),
      apply: dropdown => {
        state.filters.sources = [...dropdown.querySelectorAll('input:checked')].map(input => input.value);
      }
    }
  };

  function open(type, button) {
    close();
    const panel = panels[type];
    const rect = button.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.className = 'filter-dropdown';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.innerHTML = `
      <div class="filter-dropdown-header">${ui.escapeHtml(panel.title())}</div>
      <div class="filter-dropdown-content">${panel.body()}</div>
      <div class="filter-dropdown-footer">
        <button class="btn-cancel">${ui.escapeHtml(i18n.get('btnCancel'))}</button>
        <button class="btn-confirm">${ui.escapeHtml(i18n.get('confirm'))}</button>
      </div>`;

    document.body.appendChild(dropdown);
    button.classList.add('active');
    panel.wire?.(dropdown);

    dropdown.querySelector('.btn-cancel').addEventListener('click', close);
    dropdown.querySelector('.btn-confirm').addEventListener('click', () => {
      panel.apply(dropdown);
      close();
      onChange();
    });

    outsideHandler = event => {
      if (!dropdown.contains(event.target) && event.target !== button) close();
    };
    document.addEventListener('click', outsideHandler);
  }

  function updateActive() {
    const chips = [
      ...state.filters.tags.map(tag => ({ type: 'tag', value: tag, label: tag })),
      ...(state.filters.timeRange
        ? [{ type: 'time', value: 'time', label: i18n.get(timeLabel(state.filters.timeRange.type)) }]
        : []),
      ...state.filters.sources.map(source => ({ type: 'source', value: source, label: source }))
    ];

    const hidden = chips.length === 0;
    elements.activeFilters.classList.toggle('hidden', hidden);
    elements.clearFiltersBtn.classList.toggle('hidden', hidden);
    if (hidden) {
      elements.activeFilters.innerHTML = '';
      return;
    }

    elements.activeFilters.innerHTML = chips.map(chip => `
      <span class="filter-tag" data-type="${chip.type}" data-value="${ui.escapeHtml(chip.value)}">
        ${ui.escapeHtml(chip.label)}
        <span class="remove-filter">×</span>
      </span>`).join('');

    elements.activeFilters.querySelectorAll('.remove-filter').forEach(button => {
      button.addEventListener('click', event => {
        const chip = event.target.closest('.filter-tag');
        const removals = {
          tag: value => {
            state.filters.tags = state.filters.tags.filter(tag => tag !== value);
          },
          time: () => {
            state.filters.timeRange = null;
          },
          source: value => {
            state.filters.sources = state.filters.sources.filter(source => source !== value);
          }
        };
        removals[chip.dataset.type]?.(chip.dataset.value);
        onChange();
      });
    });
  }

  function updateButtons() {
    elements.filterTagsBtn.classList.toggle('active', state.filters.tags.length > 0);
    elements.filterTimeBtn.classList.toggle('active', Boolean(state.filters.timeRange));
    elements.filterSourceBtn.classList.toggle('active', state.filters.sources.length > 0);
  }

  function clearAll() {
    state.filters.tags = [];
    state.filters.timeRange = null;
    state.filters.sources = [];
    onChange();
  }

  return { open, clearAll, updateActive, updateButtons };
}
