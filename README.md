# Mindful Words

[English](README.md) | [简体中文](README.zh-CN.md)

A Chrome extension for capturing passages from web pages and keeping them searchable, taggable, and portable — entirely on your own machine.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4)
![Build](https://img.shields.io/badge/build-none-success)
![License: ISC](https://img.shields.io/badge/license-ISC-lightgrey)

## Overview

Mindful Words saves a selected passage together with its page title and URL, stores it as a note, and lets you review it from a browser side panel. Notes can be edited, tagged, filtered, copied, exported, or sent to Anki. All data lives in `chrome.storage.local`. There is no account, no sync service, no analytics, and no build pipeline — the source tree is the extension.

## Features

### Capture

| Trigger | Behaviour |
| --- | --- |
| `Ctrl` + `Shift` + `S` | Saves the current text selection |
| `Ctrl` + click | Saves the current text selection |
| Right-click a selection → **Save to Mindful Words** | Saves via the context menu |

Each note holds `content`, `note` (your own comment), `title`, `url`, `tags`, `createdAt` and `updatedAt`. The source site is derived from the URL. Saves are limited to 10,000 characters and throttled to one per second.

### Organize

- Side panel with full-text search across content, title and personal note.
- Filters by tag, source site and time — today, yesterday, this week, this month, last 7 / 30 days, or a custom date range. Active filters appear as removable chips.
- Click a card to edit its content, personal note and tags. `Escape` or a backdrop click closes a modal.
- Multi-select mode: copy to clipboard, export, or delete in bulk. **Select all** applies only to the currently visible (filtered) notes.
- The scroll position is restored whenever the side panel reopens.

### Export and integration

- Selected notes → **JSON**, **CSV**, **TXT**, or **Anki**.
- Options → full backup (`notes` + `settings`) as JSON, and import it back. Duplicate IDs are skipped.
- AnkiConnect: choose a deck and note model, duplicates are detected before sending, and every card is tagged `mindful-words`.

### Preferences

- Theme: light, dark, or follow system.
- Language: English / 简体中文, switched at runtime without a reload.
- Data page: tag management, usage statistics, storage usage, import / export, and clear-all (requires typing `DELETE`).

## Requirements

- A Chromium-based browser with the Side Panel API (Chrome 114+ or equivalent).
- **No runtime dependencies.** Node.js 22+ and Python 3 are needed only to run the test suite and the icon scripts.

## Installation

The extension is loaded from source; there is nothing to compile, bundle or install.

1. Clone the repository:

   ```bash
   git clone https://github.com/yangyongze/mindful-words.git
   ```

2. Open `chrome://extensions/` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder that contains `manifest.json`.
4. Click the Mindful Words toolbar icon to open the side panel. **Options** is reachable from the extension card or the gear button in the side panel.

Two sample notes are seeded on first install so the panel is not empty.

After editing source files, press the reload button on the extension card. Changes to `src/background/main.js` require a full extension reload because it is the service worker.

> `popup.html` and `options.html` cannot be opened directly via `file://`. They use ES modules and `chrome.*` APIs that only exist inside the extension context.

## Project structure

```text
.
├── manifest.json               MV3 config: service worker, content scripts, side panel, options
├── popup.html / popup.css       Side panel UI
├── options.html / options.css   Settings UI
├── src/
│   ├── core/
│   │   ├── mw.js               Shared core, exposed as globalThis.MW
│   │   └── theme.css           Single source of design tokens
│   ├── background/main.js      Service worker: command table, context menu, install seed
│   ├── content/main.js         Selection capture and in-page notifications
│   ├── popup/                  main, notes-view, filters, exporter, anki
│   └── options/main.js         Settings, tags, statistics, backup, clear
├── tests/
│   ├── core.test.mjs           Node test runner
│   └── test_frontend.py        Playwright behaviour tests with a chrome stub
├── scripts/                    Icon generation (Pillow / reportlab)
└── icons/                      PNG assets referenced by manifest.json
```

## Architecture

Three invariants keep the codebase small:

1. **One core contract.** `src/core/mw.js` defines the UI strings, message and command names, storage keys, limits, note model, i18n, message bus, toast component, theme handling and backup format. The popup, options page, service worker and content script all load the same file.
2. **One writer.** All note mutations go through a serialized command table in `src/background/main.js` (`save`, `delete`, `update`, `removeTag`, `import`, `clear`). No UI writes the notes array directly.
3. **One refresh channel.** `chrome.storage.onChanged` is the sole mechanism for keeping the popup and options page in sync with notes and settings.

Consequences: adding an operation means one entry in the command table; adding a UI string means one key per locale in `STRINGS`; adding a design token means one declaration in `src/core/theme.css`.

## Permissions and privacy

| Permission | Purpose |
| --- | --- |
| `storage` | Persist notes and settings locally |
| `activeTab` | Read the active tab's title and URL when saving from the context menu |
| `contextMenus` | Provide the right-click save action |
| `sidePanel` | Open the notes panel from the toolbar icon |

- Notes and settings never leave `chrome.storage.local` on the device.
- There are no accounts, telemetry, analytics or remote endpoints.
- The only network request in the codebase is a local `POST` to `http://127.0.0.1:8765`, made when you explicitly send notes to Anki.
- The content script is registered for all URLs because saving works on any page; it reads the selection only when a save action is invoked.

## Anki integration

1. Install the AnkiConnect add-on and keep Anki running.
2. Confirm it listens on `http://127.0.0.1:8765` (API version 5) and that its CORS policy allows the extension origin.
3. In the side panel, select notes → **Export** → **Send to Anki** → choose a deck and note model.

The first model field receives the saved content; the second receives the personal note, source, tags and date. For single-field models both are combined. The `Basic` model is preferred when present.

## Development

### Tests

```bash
python -m pip install -r requirements.txt
python -m playwright install chromium   # optional if a system Chrome is installed
npm test
```

`npm test` runs both suites:

| Command | Coverage |
| --- | --- |
| `npm run test:core` | 11 Node tests: i18n, note model, filtering, HTML escaping, backup format, settings contract, command protocol |
| `npm run test:ui` | 15 Playwright tests: rendering, search, filters, selection, editing, export, theme and language switching, options page, scroll persistence |

The browser suite serves the repository over a local HTTP server and injects a `chrome` stub before page load, so it does not require the extension to be installed. It falls back to a system Chrome when the bundled Playwright browser is unavailable.

### Icons

```bash
python scripts/generate_icons.py    # regenerates icons/icon*.png
python scripts/create_icon_pdf.py   # regenerates the icon design sheet
```

### Conventions

- Source is plain ES modules. `src/core/mw.js` is deliberately a classic script so the content script can load it from `manifest.json`'s `content_scripts` list, where load order is guaranteed.
- i18n placeholders are `$1$`, `$2$`, …; both locales must expose identical key sets (enforced by tests).
- `.gitattributes` normalizes text files to LF.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| "Extension updated. Please refresh the page to continue saving notes." banner | The extension was reloaded while the page was open; use the banner's refresh button. |
| "AnkiConnect is not running" notification | Anki or the add-on is closed, the port is not `8765`, or the request is blocked by CORS. |
| No notes after clearing data | Nothing is re-seeded after install; only a fresh install adds the two sample notes. |

## Contributing

There is no build step: edit the source, reload the extension, and run `npm test` before opening a pull request. Keep both `STRINGS` locales in sync and add a behaviour test for any user-visible change.

## License

ISC. See `package.json`.
