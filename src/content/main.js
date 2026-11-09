(function () {
  'use strict';

  const { MW } = globalThis;
  const { CMD, LIMITS, i18n, ui } = MW;
  const state = { saving: false, lastSaveAt: 0, selectedText: '' };
  let contextWarning = null;

  function hasContext() {
    return Boolean(globalThis.chrome?.runtime?.id);
  }

  function showContextWarning() {
    if (contextWarning) return;

    const warning = document.createElement('div');
    warning.id = 'mindful-words-context-warning';
    warning.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center; gap: 12px;
      padding: 12px 20px; background: #f44336; color: white;
      font: 14px Arial, sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;

    const label = document.createElement('span');
    label.textContent = `Mindful Words: ${i18n.get('contextInvalidWarning')}`;

    const button = document.createElement('button');
    button.textContent = i18n.get('refresh');
    button.style.cssText = `
      background: white; color: #f44336; border: none; padding: 6px 16px;
      border-radius: 4px; cursor: pointer; font-weight: bold;
    `;
    button.addEventListener('click', () => window.location.reload());

    warning.append(label, button);
    document.body.appendChild(warning);
    contextWarning = warning;
  }

  function refreshSelectedText() {
    state.selectedText = window.getSelection()?.toString().trim() || '';
  }

  async function capture() {
    if (state.saving || Date.now() - state.lastSaveAt < LIMITS.SAVE_THROTTLE_MS) return;
    if (!hasContext()) {
      showContextWarning();
      return;
    }

    const text = window.getSelection()?.toString().trim() || state.selectedText;
    if (!text) return;

    state.selectedText = '';
    state.saving = true;
    const pending = ui.notify(i18n.get('saving'), {
      type: 'pending',
      placement: 'corner',
      duration: 0
    });

    try {
      await MW.notes.run(CMD.SAVE, {
        content: text,
        title: document.title,
        url: window.location.href,
        tags: []
      });
      pending.dismiss();
      ui.notify(i18n.get('saveSuccess'), { placement: 'corner' });
    } catch (error) {
      pending.dismiss();
      ui.notify(i18n.get('saveFailed', error.message), { type: 'error', placement: 'corner' });
    } finally {
      state.saving = false;
      state.lastSaveAt = Date.now();
    }
  }

  document.addEventListener('selectionchange', refreshSelectedText, true);

  document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      capture();
    }
  }, true);

  document.addEventListener('click', event => {
    if (!event.ctrlKey || !state.selectedText) return;
    event.preventDefault();
    event.stopPropagation();
    capture();
  }, true);

  const contextCheck = setInterval(() => {
    if (hasContext()) return;
    clearInterval(contextCheck);
    showContextWarning();
  }, 5000);
})();
