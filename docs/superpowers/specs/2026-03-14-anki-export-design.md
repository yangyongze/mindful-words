# Anki (.apkg) Export Feature Design

## Overview

Add Anki (.apkg) export format to the existing export menu, allowing users to export their saved notes as flashcards for use in Anki - a popular spaced repetition learning software.

## Requirements

### Core Requirements
1. Add "Anki (.apkg)" option to the export menu
2. Generate valid .apkg files that can be imported into Anki
3. Each note becomes a flashcard with front/back format
4. No changes to existing note data structure

### Out of Scope
- Frequency tracking/statistics
- Separate vocabulary module
- Changes to note saving logic

## Data Mapping

### Note to Anki Card Mapping

| Note Field | Anki Card Field |
|------------|-----------------|
| `content` | Front (word/sentence) |
| `note` (personal note) | Back - Personal Note section |
| `title` + `url` | Back - Source section |
| `tags` | Back - Tags section |
| `createdAt` | Back - Date section |

### Card Template

**Front:**
```
{content}
```

**Back:**
```
{content}

---
Personal Note: {note}
Source: {title} - {url}
Tags: {tags}
Saved: {createdAt}
```

## UI Changes

### Export Menu Update

Add new option to existing export menu (in `showExportOptions()`):

```html
<div class="export-option" data-format="apkg">
  <svg><!-- Anki icon --></svg>
  <div class="option-content">
    <span class="option-label">Anki (.apkg)</span>
    <span class="option-desc">Import into Anki for spaced repetition learning</span>
  </div>
</div>
```

### i18n Keys

Add to `_locales/en/messages.json` and `_locales/zh_CN/messages.json`:

```json
{
  "exportAnki": {
    "message": "Anki (.apkg)"
  },
  "exportAnkiDesc": {
    "message": "Import into Anki for spaced repetition learning"
  }
}
```

## Technical Implementation

### .apkg File Structure

An .apkg file is a ZIP archive containing:
1. `collection.anki2` - SQLite database with cards
2. `media` - JSON file mapping media files (empty for our use case)

### Required Libraries

Use a lightweight approach:
- **Option A**: Use `sql.js` (SQLite compiled to WebAssembly) + JSZip
- **Option B**: Use existing `genanki-js` library (if available and lightweight)
- **Option C**: Implement minimal .apkg generator (recommended for size control)

### Implementation Steps

1. Create `apkg-generator.js` module
2. Implement SQLite database creation with Anki schema
3. Generate card notes with proper model/deck structure
4. Package as ZIP file with .apkg extension
5. Trigger download

### Anki Database Schema (Minimal)

```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  guid TEXT,
  mid INTEGER,
  mod INTEGER,
  usn INTEGER,
  tags TEXT,
  flds TEXT,
  sfld TEXT,
  csum INTEGER,
  flags INTEGER,
  data TEXT
);

CREATE TABLE cards (
  id INTEGER PRIMARY KEY,
  nid INTEGER,
  did INTEGER,
  ord INTEGER,
  mod INTEGER,
  usn INTEGER,
  type INTEGER,
  queue INTEGER,
  due INTEGER,
  ivl INTEGER,
  factor INTEGER,
  reps INTEGER,
  lapses INTEGER,
  left INTEGER,
  odue INTEGER,
  odid INTEGER,
  flags INTEGER,
  data TEXT
);

CREATE TABLE decks (
  id INTEGER PRIMARY KEY,
  name TEXT,
  mtime_secs INTEGER,
  usn INTEGER,
  common TEXT
);

CREATE TABLE models (
  id INTEGER PRIMARY KEY,
  name TEXT,
  mtime_secs INTEGER,
  usn INTEGER,
  common TEXT
);
```

## File Changes

### New Files
- `apkg-generator.js` - Core .apkg generation logic

### Modified Files
- `popup.js` - Add export handler for 'apkg' format
- `_locales/en/messages.json` - Add i18n keys
- `_locales/zh_CN/messages.json` - Add i18n keys
- `popup.html` - No changes needed (dynamic menu)
- `popup.css` - Minor styling if needed

## Dependencies

### Required Libraries
- `sql.js` (~300KB) - SQLite in WebAssembly
- `jszip` (~90KB) - ZIP file generation

### Loading Strategy
Load libraries dynamically only when .apkg export is triggered to avoid impacting initial load time.

```javascript
async function loadApkgDependencies() {
  const [sqlJs, jszip] = await Promise.all([
    import('./lib/sql.js'),
    import('./lib/jszip.js')
  ]);
  return { sqlJs, jszip };
}
```

## Testing Plan

1. Generate .apkg file with sample notes
2. Import into Anki desktop application
3. Verify card content displays correctly
4. Test with special characters and long content
5. Test with empty notes/missing fields
6. Test batch export (selected notes)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Large library size impacts performance | Lazy load only when needed |
| SQLite complexity | Use well-tested sql.js library |
| Anki format changes | Follow stable Anki 2.1 format |

## Success Criteria

1. Users can export notes as .apkg file
2. Exported file imports successfully into Anki
3. Card front shows content, back shows details
4. No impact on existing functionality
5. Works with both individual and batch export
