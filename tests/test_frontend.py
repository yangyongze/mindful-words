"""Behaviour tests for the Mindful Words popup and options pages."""

import json
import re
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]

CHROME_STUB = r"""
(() => {
  const data = %DATA%;
  const listeners = [];
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

  const emit = changes => listeners.forEach(listener => listener(changes));

  const local = {
    QUOTA_BYTES: 5242880,
    get(keys, callback) {
      const wanted = typeof keys === 'string' ? [keys]
        : Array.isArray(keys) ? keys : Object.keys(keys || {});
      const result = {};
      wanted.forEach(key => {
        if (key in data) result[key] = clone(data[key]);
      });
      setTimeout(() => callback(result), 0);
    },
    set(items, callback) {
      const changes = {};
      Object.entries(items).forEach(([key, value]) => {
        changes[key] = { oldValue: clone(data[key]), newValue: clone(value) };
        data[key] = clone(value);
      });
      setTimeout(() => {
        if (callback) callback();
        emit(changes);
      }, 0);
    },
    clear(callback) {
      Object.keys(data).forEach(key => delete data[key]);
      setTimeout(() => callback(), 0);
    },
    getBytesInUse(_keys, callback) {
      setTimeout(() => callback(1024), 0);
    }
  };

  window.__MW_MESSAGES__ = [];
  window.__MW_DATA__ = data;
  window.__MW_SET_NOTES__ = list => {
    const oldValue = clone(data.notes || []);
    data.notes = clone(list);
    emit({ notes: { oldValue, newValue: clone(list) } });
  };

  window.chrome = {
    runtime: {
      id: 'test',
      lastError: null,
      getManifest: () => ({ version: '%VERSION%' }),
      openOptionsPage: () => {},
      onMessage: { addListener() {} },
      sendMessage(message, callback) {
        window.__MW_MESSAGES__.push(clone(message));
        const payload = message.payload || {};
        let result = null;
        if (message.name === 'delete') {
          result = { deleted: payload.ids.length };
        } else if (message.name === 'update') {
          const found = (data.notes || []).find(note => note.id === payload.id) || {};
          result = { ...found, ...payload.patch };
        }
        setTimeout(() => callback({ status: 'success', result }), 0);
      }
    },
    storage: {
      local,
      onChanged: { addListener: listener => listeners.push(listener) }
    }
  };
})();
"""


def sample_notes():
    return [
        {
            "id": 1,
            "content": "Alpha content",
            "note": "a thought",
            "title": "Alpha",
            "url": "https://www.example.com/page",
            "createdAt": "2026-01-02T10:00:00.000Z",
            "updatedAt": "2026-01-02T10:00:00.000Z",
            "tags": ["work"],
        },
        {
            "id": 2,
            "content": "Beta content",
            "note": "",
            "title": "Beta",
            "url": "https://news.example.org/story",
            "createdAt": "2026-01-01T10:00:00.000Z",
            "updatedAt": "2026-01-01T10:00:00.000Z",
            "tags": ["ideas"],
        },
    ]


@pytest.fixture(scope="session")
def server():
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def log_message(self, *_args):
            pass

    httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{httpd.server_address[1]}"
    finally:
        httpd.shutdown()
        httpd.server_close()
        thread.join(timeout=5)


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as playwright:
        try:
            instance = playwright.chromium.launch(headless=True)
        except PlaywrightError:
            # Playwright's bundled browser is optional when a system Chrome is installed.
            instance = playwright.chromium.launch(headless=True, channel="chrome")
        try:
            yield instance
        finally:
            instance.close()


@pytest.fixture
def page(browser):
    context = browser.new_context(accept_downloads=True)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    try:
        yield page
    finally:
        context.close()
    assert not errors, f"Uncaught page errors: {errors}"


def open_page(page, server, name, notes, settings, ready_selector):
    data = {
        "notes": notes if notes is not None else [],
        "settings": settings if settings is not None else {"theme": "light", "language": "en"},
    }
    script = (CHROME_STUB
              .replace("%DATA%", json.dumps(data, ensure_ascii=False))
              .replace("%VERSION%", VERSION))
    page.add_init_script(script=script)
    page.goto(f"{server}/{name}")
    page.wait_for_function(ready_selector)


def open_popup(page, server, notes=None, settings=None):
    open_page(
        page, server, "popup.html", notes, settings,
        "document.querySelector('#notes-list').children.length > 0",
    )


def open_options(page, server, notes=None, settings=None):
    open_page(
        page, server, "options.html", notes, settings,
        "document.querySelector('#tag-list').children.length > 0",
    )


def last_command(page):
    return page.evaluate("window.__MW_MESSAGES__.at(-1)")


def test_renders_notes_from_storage(page, server):
    open_popup(page, server, sample_notes())

    items = page.locator(".note-item")
    expect(items).to_have_count(2)
    expect(items.first).to_contain_text("Alpha content")
    expect(items.first.locator(".note-url")).to_have_text("example.com")
    expect(items.first.locator(".tag")).to_have_text("work")
    expect(items.first.locator(".note-personal-note")).to_contain_text("a thought")


def test_empty_state_describes_the_real_situation(page, server):
    open_popup(page, server)
    expect(page.locator(".empty-title")).to_have_text("No notes yet")


def test_search_filters_notes_and_clear_restores_them(page, server):
    open_popup(page, server, sample_notes())

    page.locator("#search-input").fill("Alpha")
    expect(page.locator(".note-item")).to_have_count(1)
    expect(page.locator(".empty-title")).to_have_count(0)

    page.locator("#clear-search").click()
    expect(page.locator("#search-input")).to_have_value("")
    expect(page.locator(".note-item")).to_have_count(2)


def test_selection_mode_updates_actions(page, server):
    open_popup(page, server, sample_notes())

    page.locator("#select-btn").click()
    expect(page.locator("#selection-bar")).to_be_visible()
    expect(page.locator("#copy-selected-btn")).to_be_disabled()

    page.locator(".note-item").first.click()
    expect(page.locator("#selection-count")).to_have_text("Selected 1 items")

    page.locator("#select-all-checkbox").check()
    expect(page.locator("#selection-count")).to_have_text("Selected 2 items")
    expect(page.locator("#copy-selected-btn")).to_be_enabled()

    page.locator("#cancel-selection-btn").click()
    expect(page.locator("#selection-bar")).to_be_hidden()
    expect(page.locator("#copy-selected-btn")).to_be_disabled()


def test_filter_chip_carries_its_own_state(page, server):
    open_popup(page, server, sample_notes())

    page.locator("#filter-tags-btn").click()
    expect(page.locator(".filter-dropdown")).to_have_count(1)
    page.locator('.filter-dropdown input[value="work"]').check()
    page.locator(".filter-dropdown .btn-confirm").click()

    expect(page.locator(".note-item")).to_have_count(1)
    chip = page.locator("#filter-tags-btn")
    assert "has-value" in chip.get_attribute("class")
    expect(chip.locator(".chip-value")).to_contain_text("work")
    expect(chip.locator(".chip-clear")).to_be_visible()
    expect(chip.locator(".chip-chevron")).to_be_hidden()
    expect(page.locator("#clear-filters-btn")).to_be_visible()

    chip.locator(".chip-clear").click()
    expect(page.locator(".note-item")).to_have_count(2)
    assert "has-value" not in chip.get_attribute("class")
    expect(page.locator("#clear-filters-btn")).to_be_hidden()

    page.locator("#filter-tags-btn").click()
    page.locator('.filter-dropdown input[value="work"]').check()
    page.locator(".filter-dropdown .btn-confirm").click()
    page.locator("#clear-filters-btn").click()
    expect(page.locator(".note-item")).to_have_count(2)
    expect(page.locator("#clear-filters-btn")).to_be_hidden()


def test_editing_a_note_sends_one_update_command(page, server):
    open_popup(page, server, sample_notes())

    page.locator(".note-item").first.click()
    expect(page.locator("#edit-modal")).to_be_visible()
    page.locator("#edit-content").fill("Changed content")
    page.locator("#save-edit").click()

    expect(page.locator("#edit-modal")).to_be_hidden()
    expect(page.locator(".note-item").first).to_contain_text("Changed content")
    command = last_command(page)
    assert command["name"] == "update"
    assert command["payload"] == {
        "id": 1,
        "patch": {"content": "Changed content", "note": "a thought", "tags": ["work"]},
    }


def test_deleting_a_note_sends_one_delete_command(page, server):
    open_popup(page, server, sample_notes())

    page.locator(".delete-btn").first.click()
    expect(page.locator("#confirm-modal")).to_be_visible()
    page.locator("#confirm-ok").click()

    expect(page.locator(".note-item")).to_have_count(1)
    assert last_command(page)["name"] == "delete"
    assert last_command(page)["payload"]["ids"] == [1]


def test_export_menu_downloads_selected_notes(page, server):
    open_popup(page, server, sample_notes())

    page.locator("#select-btn").click()
    page.locator("#select-all-checkbox").check()
    page.locator("#export-selected-btn").click()
    expect(page.locator(".export-option")).to_have_count(4)

    with page.expect_download() as download_info:
        page.locator('.export-option[data-format="json"]').click()
    download = download_info.value
    assert download.suggested_filename == "mindful_notes.json"
    content = Path(download.path()).read_text(encoding="utf-8")
    assert "Alpha content" in content
    assert "Beta content" in content


def test_language_setting_translates_every_label(page, server):
    open_popup(page, server, sample_notes(), {"theme": "light", "language": "zh_CN"})

    expect(page.locator("#search-input")).to_have_attribute("placeholder", "搜索笔记...")
    page.locator("#select-btn").click()
    page.locator("#select-all-checkbox").check()
    page.locator("#export-selected-btn").click()

    label = page.locator(".export-option-ai .option-label").inner_text()
    assert label != "sendToAnki"
    assert re.search(r"[一-鿿]", label)


def test_theme_variables_and_dark_setting(page, server):
    open_popup(page, server, sample_notes(), {"theme": "dark", "language": "en"})

    expect(page.locator("html")).to_have_attribute("data-theme", "dark")
    variables = page.evaluate("""() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        accent: styles.getPropertyValue('--accent-color').trim(),
        hover: styles.getPropertyValue('--accent-hover-color').trim(),
        card: styles.getPropertyValue('--background-card').trim(),
        background: styles.getPropertyValue('--background-primary').trim(),
      };
    }""")
    assert variables["accent"] == "#7f77dd"
    assert variables["hover"] == "#9189e8"
    assert variables["card"] == "#2b2b31"
    assert variables["background"] == "#1c1c1e"


def test_storage_change_refreshes_the_list(page, server):
    open_popup(page, server, sample_notes()[:1])

    page.evaluate("""notes => window.__MW_SET_NOTES__(notes)""", sample_notes())
    expect(page.locator(".note-item")).to_have_count(2)
    expect(page.locator(".mw-toast--top")).to_have_count(1)


def test_options_derives_tags_and_stats_from_notes(page, server):
    open_options(page, server, sample_notes())

    expect(page.locator("#total-notes")).to_have_text("2")
    expect(page.locator("#total-tags")).to_have_text("2")
    expect(page.locator("#total-sources")).to_have_text("2")
    expect(page.locator("#tag-list .tag-item")).to_have_count(2)
    expect(page.locator("#tag-count")).to_have_text("2 tags")
    expect(page.locator("#about-version")).to_have_text(f"v{VERSION}")


def test_options_language_change_retranslates(page, server):
    open_options(page, server, sample_notes())

    page.locator("#language").select_option("zh_CN")
    expect(page.locator("#save-settings span")).to_have_text("保存设置")
    expect(page.locator('[data-i18n="settingsTitle"]')).to_have_text("设置")
    assert page.evaluate("window.__MW_DATA__.settings.language") == "zh_CN"


def test_options_tag_removal_sends_one_command(page, server):
    open_options(page, server, sample_notes())
    page.on("dialog", lambda dialog: dialog.accept())

    page.locator('.nav-item[data-section="tags"]').click()
    expect(page.locator("#section-tags")).to_have_class("content-section active")
    page.locator('.tag-remove[data-tag="work"]').click()
    assert last_command(page) == {"type": "mw:command", "name": "removeTag", "payload": {"tag": "work"}}


def test_scrolling_the_real_container_persists_the_position(page, server):
    open_popup(page, server, sample_notes() * 4)
    page.add_style_tag(content=".notes-container { max-height: 80px; }")

    page.evaluate("document.querySelector('#notes-container').scrollTop = 50")
    page.dispatch_event("#notes-container", "scroll")
    page.wait_for_function("window.__MW_DATA__['popup_scroll_position'] > 0")

    assert page.evaluate("window.__MW_DATA__['popup_scroll_position']") == 50


def test_search_matches_tags_and_source(page, server):
    open_popup(page, server, sample_notes())

    page.locator("#search-input").fill("work")
    expect(page.locator(".note-item")).to_have_count(1)
    expect(page.locator("#clear-search")).to_be_visible()

    page.locator("#search-input").fill("example.org")
    expect(page.locator(".note-item")).to_have_count(1)
    expect(page.locator(".note-item").first).to_contain_text("Beta content")


def test_header_shows_the_result_count_not_a_tagline(page, server):
    open_popup(page, server, sample_notes())

    expect(page.locator(".header-subtitle")).to_have_count(0)
    expect(page.locator(".header-title")).to_have_count(0)
    expect(page.locator("#results-count")).to_have_text("2 notes")

    page.locator("#search-input").fill("Alpha")
    expect(page.locator("#results-count")).to_have_text("1 note")


def test_selection_replaces_the_workspace_without_a_height_jump(page, server):
    open_popup(page, server, sample_notes())

    header = page.locator(".header")
    before = header.bounding_box()["height"]
    expect(page.locator("#workspace")).to_be_visible()

    page.locator("#select-btn").click()
    expect(page.locator("#workspace")).to_be_hidden()
    expect(page.locator("#selection-bar")).to_be_visible()
    assert abs(header.bounding_box()["height"] - before) <= 1

    page.locator("#cancel-selection-btn").click()
    expect(page.locator("#workspace")).to_be_visible()
    assert abs(header.bounding_box()["height"] - before) <= 1
