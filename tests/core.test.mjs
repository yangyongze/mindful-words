import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../src/core/mw.js';
import { selectNotes } from '../src/popup/filters.js';

const MW = globalThis.MW;

const notes = [
  {
    id: 1,
    content: 'Alpha content',
    note: 'a thought',
    title: 'Alpha',
    url: 'https://www.example.com/a',
    createdAt: '2026-01-02T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    tags: ['work', 'work', ' ideas ']
  },
  {
    id: 2,
    content: 'Beta content',
    note: '',
    title: 'Beta',
    url: 'not a url',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    tags: ['ideas']
  }
];

test('i18n substitutes every placeholder from the same convention', () => {
  MW.i18n.setLanguage('en');
  assert.equal(MW.i18n.get('selectedCount', 3), 'Selected 3 items');
  assert.equal(MW.i18n.get('confirmBatchDeleteMessage', 2),
    'Are you sure you want to delete 2 selected notes? This action cannot be undone.');
  MW.i18n.setLanguage('zh_CN');
  assert.equal(MW.i18n.get('noNotes'), '还没有保存任何笔记');
  MW.i18n.setLanguage('en');
});

test('every locale has the same keys as English', () => {
  const reference = Object.keys(MW.STRINGS.en).sort();
  for (const [language, table] of Object.entries(MW.STRINGS)) {
    assert.deepEqual(Object.keys(table).sort(), reference, language);
    for (const value of Object.values(table)) {
      assert.notEqual(value, '', `${language} has an empty message`);
    }
  }
});

test('no message keeps a legacy placeholder', () => {
  for (const table of Object.values(MW.STRINGS)) {
    for (const value of Object.values(table)) {
      assert.doesNotMatch(value, /\$(COUNT|NUMBER|ERROR|TAG)\$|\{(count|success|skipped)\}/);
    }
  }
});

test('notes model normalizes the shape in one place', () => {
  const note = MW.notes.create({
    content: '  hello  ',
    tags: ['a', 'a', '', ' b '],
    timestamp: '2026-01-01T00:00:00.000Z',
    id: 7
  });
  assert.equal(note.content, 'hello');
  assert.deepEqual(note.tags, ['a', 'b']);
  assert.equal(note.createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal(note.updatedAt, note.createdAt);
  assert.equal(note.title, 'hello...');
  assert.equal(MW.notes.hostname('https://www.example.com/a'), 'example.com');
  assert.equal(MW.notes.hostname('not a url'), '');
  assert.deepEqual(MW.notes.allTags(notes), ['ideas', 'work']);
  assert.deepEqual(MW.notes.allSources(notes), ['example.com']);
  assert.deepEqual(MW.notes.stats(notes), { count: 2, tags: 2, sources: 1 });
});

test('patchNote keeps identity and refreshes the timestamp', () => {
  const patched = MW.notes.patch(notes[0], { content: 'new', id: 999 });
  assert.equal(patched.id, 1);
  assert.equal(patched.content, 'new');
  assert.notEqual(patched.updatedAt, notes[0].updatedAt);
  assert.ok(Number.isFinite(Date.parse(patched.updatedAt)));
});

test('selectNotes combines query, tags, sources and time', () => {
  const filters = { tags: [], timeRange: null, sources: [] };
  assert.equal(selectNotes(notes, '', filters, MW).length, 2);
  assert.deepEqual(selectNotes(notes, 'alpha', filters, MW).map(n => n.id), [1]);
  assert.deepEqual(selectNotes(notes, 'a thought', filters, MW).map(n => n.id), [1]);
  assert.deepEqual(
    selectNotes(notes, '', { ...filters, sources: ['example.com'] }, MW).map(n => n.id),
    [1]
  );
  assert.deepEqual(
    selectNotes(notes, '', { ...filters, tags: ['work'] }, MW).map(n => n.id),
    [1]
  );
  assert.deepEqual(
    selectNotes(notes, '', {
      ...filters,
      timeRange: { start: new Date('2026-01-02T00:00:00Z'), end: new Date('2026-01-03T00:00:00Z') }
    }, MW).map(n => n.id),
    [1]
  );
});

test('escaping is safe inside HTML attributes', () => {
  assert.equal(MW.ui.escapeHtml('a"b & <c>'), 'a&quot;b &amp; &lt;c&gt;');
  assert.equal(MW.ui.safeHref('https://example.com/a'), 'https://example.com/a');
  assert.equal(MW.ui.safeHref('javascript:alert(1)'), '#');
  assert.equal(MW.ui.safeHref('not a url'), '#');
});

test('every JSON export can be imported', () => {
  const exported = MW.backup.create(notes, { theme: 'dark', language: 'en' });
  const parsed = MW.backup.parse(JSON.stringify(exported));
  assert.equal(parsed.notes.length, 2);
  assert.deepEqual(parsed.settings, { theme: 'dark', language: 'en' });
  assert.throws(() => MW.backup.parse('{'), SyntaxError);
  assert.throws(() => MW.backup.parse(JSON.stringify(notes)), /Invalid backup/);
});

test('settings stay inside their contract', () => {
  assert.deepEqual(
    MW.normalizeSettings({ theme: 'neon', language: 'xx' }),
    { theme: 'light', language: null }
  );
  assert.deepEqual(MW.normalizeSettings(null), { theme: 'light', language: null });
});

test('every selectable preference survives normalization', () => {
  const html = readFileSync(new URL('../options.html', import.meta.url), 'utf8');
  const themes = [...html.matchAll(/<option value="([^"]+)" data-i18n="theme\w+"/g)]
    .map(match => match[1]);
  const languages = [...html.matchAll(/<option value="([^"]+)" data-i18n="language\w+"/g)]
    .map(match => match[1]);
  assert.ok(themes.length >= 3);
  assert.ok(languages.length >= 2);
  for (const theme of themes) {
    assert.equal(MW.normalizeSettings({ theme }).theme, theme);
  }
  for (const language of languages) {
    assert.equal(MW.normalizeSettings({ language }).language, language);
  }
});

test('commands return results and surface errors', async () => {
  globalThis.chrome = {
    runtime: {
      lastError: null,
      sendMessage(message, callback) {
        globalThis.__lastMessage = message;
        callback({ status: 'success', result: 42 });
      }
    }
  };
  assert.equal(await MW.notes.run('anything', { id: 1 }), 42);
  assert.equal(globalThis.__lastMessage.type, 'mw:command');
  assert.equal(globalThis.__lastMessage.name, 'anything');

  globalThis.chrome.runtime.sendMessage = (_message, callback) => {
    callback({ status: 'error', message: 'boom' });
  };
  await assert.rejects(() => MW.notes.run('anything', {}), /boom/);
  delete globalThis.chrome;
});
