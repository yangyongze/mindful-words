export function createAnki({ MW }) {
  const { LIMITS, i18n, ui } = MW;

  async function call(action, params) {
    const body = { action, version: LIMITS.ANKI_VERSION };
    if (params) body.params = params;
    const response = await fetch(LIMITS.ANKI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  }

  function backContent(note) {
    const parts = [];
    if (note.note?.trim()) {
      parts.push(`${i18n.get('personalNote')}: ${ui.escapeHtml(note.note)}`);
    }
    if (note.title || note.url) {
      const source = note.title || i18n.get('webpage');
      parts.push(`${i18n.get('source')}: ${ui.escapeHtml(source)} - ${ui.escapeHtml(note.url)}`);
    }
    if (note.tags?.length) {
      parts.push(`${i18n.get('filterTags')}: ${ui.escapeHtml(note.tags.join(', '))}`);
    }
    if (note.createdAt) {
      parts.push(`${i18n.get('time')}: ${new Date(note.createdAt).toLocaleDateString()}`);
    }
    return parts.join('<br>');
  }

  async function addNotes(notes, deckName, modelName) {
    const fields = await call('modelFieldNames', { modelName });
    if (!fields?.length) throw new Error('Model has no fields');

    const front = fields[0];
    const back = fields[1];
    const payload = notes.map(note => ({
      deckName,
      modelName,
      fields: back
        ? { [front]: ui.escapeHtml(note.content), [back]: backContent(note) }
        : { [front]: `${ui.escapeHtml(note.content)}<br>${backContent(note)}` },
      tags: [LIMITS.ANKI_TAG, ...(note.tags || [])]
    }));

    const canAdd = await call('canAddNotes', { notes: payload });
    const fresh = payload.filter((_, index) => canAdd[index] === true);
    if (!fresh.length) {
      ui.notify(i18n.get('allDuplicatesError'), { type: 'error' });
      return;
    }

    let sent = 0;
    let skipped = payload.length - fresh.length;
    for (const note of fresh) {
      try {
        const id = await call('addNote', { note });
        if (id) sent += 1;
        else skipped += 1;
      } catch (error) {
        console.error('[Mindful Words] Anki note rejected:', error);
        skipped += 1;
      }
    }

    if (sent === 0) {
      ui.notify(i18n.get('allDuplicatesError'), { type: 'error' });
    } else if (skipped > 0) {
      ui.notify(i18n.get('sendSuccessWithSkipped', sent, skipped));
    } else {
      ui.notify(i18n.get('sendSuccess', sent));
    }
  }

  function openDialog(notes, decks) {
    document.querySelector('.deck-selection-dialog')?.remove();
    document.querySelector('.deck-selection-backdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'deck-selection-backdrop';
    const dialog = document.createElement('div');
    dialog.className = 'deck-selection-dialog';
    dialog.innerHTML = `
      <div class="deck-selection-header">${ui.escapeHtml(i18n.get('sendToAnki'))}</div>
      <div class="deck-selection-body">
        <div class="deck-selection-label">${ui.escapeHtml(i18n.get('selectDeck'))}</div>
        <select class="deck-selection-dropdown" id="deck-select">
          ${decks.map(deck => `<option value="${ui.escapeHtml(deck)}">${ui.escapeHtml(deck)}</option>`).join('')}
        </select>
        <div class="deck-selection-label" style="margin-top: 12px;">${ui.escapeHtml(i18n.get('selectModel'))}</div>
        <select class="deck-selection-dropdown" id="model-select">
          <option value="">${ui.escapeHtml(i18n.get('loading'))}</option>
        </select>
        <div class="deck-selection-count">${ui.escapeHtml(i18n.get('willSendNotes', notes.length))}</div>
      </div>
      <div class="deck-selection-footer">
        <button class="deck-selection-cancel">${ui.escapeHtml(i18n.get('cancel'))}</button>
        <button class="deck-selection-send">${ui.escapeHtml(i18n.get('send'))}</button>
      </div>`;
    document.body.append(backdrop, dialog);

    const close = () => {
      dialog.remove();
      backdrop.remove();
    };

    call('modelNames').then(models => {
      const select = dialog.querySelector('#model-select');
      if (!models?.length) {
        select.innerHTML = `<option value="">${ui.escapeHtml(i18n.get('noModelsFound'))}</option>`;
        dialog.querySelector('.deck-selection-send').disabled = true;
        return;
      }
      const preferred = models.find(name => name === LIMITS.ANKI_PREFERRED_MODEL) || models[0];
      select.innerHTML = models.map(name => `
        <option value="${ui.escapeHtml(name)}" ${name === preferred ? 'selected' : ''}>${ui.escapeHtml(name)}</option>
      `).join('');
    }).catch(error => {
      console.error('[Mindful Words] Anki models unavailable:', error);
      ui.notify(i18n.get('ankiConnectError'), { type: 'error' });
    });

    dialog.querySelector('.deck-selection-cancel').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    dialog.querySelector('.deck-selection-send').addEventListener('click', async () => {
      const deck = dialog.querySelector('#deck-select').value;
      const model = dialog.querySelector('#model-select').value;
      if (!model) {
        ui.notify(i18n.get('noModelsFound'), { type: 'error' });
        return;
      }
      close();
      try {
        await addNotes(notes, deck, model);
      } catch (error) {
        console.error('[Mindful Words] Anki export failed:', error);
        ui.notify(i18n.get('ankiConnectError'), { type: 'error' });
      }
    });
  }

  async function send(notes) {
    let decks;
    try {
      await call('version');
      decks = await call('deckNames');
    } catch (error) {
      console.error('[Mindful Words] AnkiConnect unavailable:', error);
      ui.notify(i18n.get('ankiConnectNotRunning'), { type: 'error' });
      return;
    }
    if (!decks?.length) {
      ui.notify(i18n.get('ankiConnectError'), { type: 'error' });
      return;
    }
    openDialog(notes, decks);
  }

  return { send };
}
