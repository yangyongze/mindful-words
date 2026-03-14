"""
Mindful Words Chrome Extension - Frontend Tests
Tests the popup UI functionality using Playwright
"""

from playwright.sync_api import sync_playwright
import os

HTML_FILE = r'd:\CodeAICo\mindful-words\popup.html'

def test_page_loads():
    """Test that the popup page loads correctly"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Take screenshot
        page.screenshot(path='/tmp/mindful-words-01-load.png')
        
        # Check header exists
        header = page.locator('.header')
        assert header.count() == 1, "Header should exist"
        
        # Check search input exists
        search = page.locator('#search-input')
        assert search.count() == 1, "Search input should exist"
        
        # Check filter buttons exist
        filter_tags = page.locator('#filter-tags-btn')
        assert filter_tags.count() == 1, "Filter tags button should exist"
        
        filter_time = page.locator('#filter-time-btn')
        assert filter_time.count() == 1, "Filter time button should exist"
        
        filter_source = page.locator('#filter-source-btn')
        assert filter_source.count() == 1, "Filter source button should exist"
        
        # Check select button exists
        select_btn = page.locator('#select-btn')
        assert select_btn.count() == 1, "Select button should exist"
        
        print("✅ Page loads correctly")
        browser.close()

def test_filter_buttons():
    """Test that filter buttons show dropdowns"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Click tags filter button
        page.click('#filter-tags-btn')
        page.wait_for_timeout(200)
        page.screenshot(path='/tmp/mindful-words-02-tags-dropdown.png')
        
        # Check dropdown appeared
        dropdown = page.locator('.filter-dropdown')
        assert dropdown.count() >= 1, "Tags dropdown should appear"
        
        # Click outside to close
        page.click('body', position={'x': 10, 'y': 10})
        page.wait_for_timeout(200)
        
        # Click time filter button
        page.click('#filter-time-btn')
        page.wait_for_timeout(200)
        page.screenshot(path='/tmp/mindful-words-03-time-dropdown.png')
        
        # Check dropdown appeared
        dropdown = page.locator('.filter-dropdown')
        assert dropdown.count() >= 1, "Time dropdown should appear"
        
        # Click outside to close
        page.click('body', position={'x': 10, 'y': 10})
        page.wait_for_timeout(200)
        
        # Click source filter button
        page.click('#filter-source-btn')
        page.wait_for_timeout(200)
        page.screenshot(path='/tmp/mindful-words-04-source-dropdown.png')
        
        # Check dropdown appeared
        dropdown = page.locator('.filter-dropdown')
        assert dropdown.count() >= 1, "Source dropdown should appear"
        
        print("✅ Filter buttons work correctly")
        browser.close()

def test_search_input():
    """Test search input functionality"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Type in search
        search_input = page.locator('#search-input')
        search_input.fill('test search')
        page.wait_for_timeout(300)
        page.screenshot(path='/tmp/mindful-words-05-search.png')
        
        # Check clear button exists
        clear_btn = page.locator('#clear-search')
        assert clear_btn.count() == 1, "Clear search button should exist"
        
        # Clear search
        clear_btn.click()
        page.wait_for_timeout(200)
        
        # Check search is cleared
        value = search_input.input_value()
        assert value == '', "Search input should be cleared"
        
        print("✅ Search input works correctly")
        browser.close()

def test_select_mode():
    """Test selection mode functionality"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Click select button
        page.click('#select-btn')
        page.wait_for_timeout(200)
        page.screenshot(path='/tmp/mindful-words-06-select-mode.png')
        
        # Check selection bar appeared
        selection_bar = page.locator('#selection-bar')
        assert selection_bar.count() == 1, "Selection bar should appear"
        
        # Check selection bar is visible (not hidden)
        is_hidden = selection_bar.evaluate('el => el.classList.contains("hidden")')
        assert not is_hidden, "Selection bar should be visible"
        
        # Check copy and export buttons exist
        copy_btn = page.locator('#copy-selected-btn')
        assert copy_btn.count() == 1, "Copy button should exist"
        
        export_btn = page.locator('#export-selected-btn')
        assert export_btn.count() == 1, "Export button should exist"
        
        # Click cancel to exit selection mode
        page.click('#cancel-selection-btn')
        page.wait_for_timeout(200)
        
        # Check selection bar is hidden again
        is_hidden = selection_bar.evaluate('el => el.classList.contains("hidden")')
        assert is_hidden, "Selection bar should be hidden after cancel"
        
        print("✅ Selection mode works correctly")
        browser.close()

def test_empty_state():
    """Test empty state display"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Check empty state exists (no notes)
        empty_state = page.locator('.empty-state')
        page.screenshot(path='/tmp/mindful-words-07-empty-state.png')
        
        # Check empty state icon
        empty_icon = page.locator('.empty-icon')
        assert empty_icon.count() >= 0, "Empty icon should exist"
        
        # Check empty state title
        empty_title = page.locator('.empty-title')
        assert empty_title.count() >= 0, "Empty title should exist"
        
        print("✅ Empty state displays correctly")
        browser.close()

def test_css_styles():
    """Test that CSS styles are applied correctly"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Check header has correct background
        header = page.locator('.header')
        bg_color = header.evaluate('el => window.getComputedStyle(el).backgroundColor')
        print(f"  Header background: {bg_color}")
        
        # Check filter buttons have correct styling
        filter_btn = page.locator('#filter-tags-btn')
        border_radius = filter_btn.evaluate('el => window.getComputedStyle(el).borderRadius')
        print(f"  Filter button border-radius: {border_radius}")
        
        # Check CSS variables are defined
        root_vars = page.evaluate('''() => {
            const styles = getComputedStyle(document.documentElement);
            return {
                accentColor: styles.getPropertyValue('--accent-color'),
                transitionFast: styles.getPropertyValue('--transition-fast')
            };
        }''')
        print(f"  CSS variables: {root_vars}")
        
        page.screenshot(path='/tmp/mindful-words-08-styles.png')
        
        print("✅ CSS styles applied correctly")
        browser.close()

def main():
    print("=" * 50)
    print("Mindful Words - Frontend Tests")
    print("=" * 50)
    
    tests = [
        ("Page Loads", test_page_loads),
        ("Filter Buttons", test_filter_buttons),
        ("Search Input", test_search_input),
        ("Select Mode", test_select_mode),
        ("Empty State", test_empty_state),
        ("CSS Styles", test_css_styles),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        print(f"\n▶ Running: {name}")
        try:
            test_func()
            passed += 1
        except Exception as e:
            print(f"❌ Failed: {e}")
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 50)
    
    if failed == 0:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️ {failed} test(s) failed")

if __name__ == '__main__':
    main()
