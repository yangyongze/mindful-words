"""Test Mindful Words Chrome Extension Frontend"""

import sys
import os
from playwright.sync_api import sync_playwright

HTML_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'popup.html')

def test_page_loads():
    """Test that the popup page loads correctly"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file:///{HTML_FILE}')
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
        page.goto(f'file:///{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Click tags filter button
        page.click('#filter-tags-btn')
        page.wait_for_timeout(200)
        page.screenshot(path='/tmp/mindful-words-02-tags-dropdown.png')
        
        # Check if dropdown appeared
        dropdown = page.locator('.filter-dropdown')
        assert dropdown.count() == 1, "Tags dropdown should appear"
        
        # Click outside to close dropdown
        page.mouse.click(100, 100)
        page.wait_for_timeout(200)
        
        # Click time filter button
        page.click('#filter-time-btn')
        page.wait_for_timeout(200)
        page.screenshot(path='/tmp/mindful-words-03-time-dropdown.png')
        
        dropdown = page.locator('.filter-dropdown')
        assert dropdown.count() == 1, "Time dropdown should appear"
        
        # Click outside to close dropdown
        page.mouse.click(100, 100)
        page.wait_for_timeout(200)
        
        # Click source filter button
        page.click('#filter-source-btn')
        page.wait_for_timeout(200)
        page.screenshot(path='/tmp/mindful-words-04-source-dropdown.png')
        
        dropdown = page.locator('.filter-dropdown')
        assert dropdown.count() == 1, "Source dropdown should appear"
        
        print("✅ Filter buttons work correctly")
        browser.close()

def test_search_input():
    """Test search input functionality"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file:///{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Type in search input
        page.fill('#search-input', 'test')
        page.wait_for_timeout(300)
        
        # Check clear button appears
        clear_btn = page.locator('#clear-search')
        assert clear_btn.count() == 1, "Clear button should appear"
        
        # Clear search
        page.click('#clear-search')
        page.wait_for_timeout(200)
        
        # Check search input is empty
        search_value = page.input_value('#search-input')
        assert search_value == '', "Search input should be cleared"
        
        print("✅ Search input works correctly")
        browser.close()

def test_select_mode():
    """Test select mode functionality"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file:///{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Click select button
        page.click('#select-btn')
        page.wait_for_timeout(300)
        
        # Check selection bar appeared
        selection_bar = page.locator('#selection-bar')
        assert selection_bar.count() == 1, "Selection bar should appear"
        
        # Take screenshot
        page.screenshot(path='/tmp/mindful-words-05-select-mode.png')
        
        print("✅ Select mode works correctly")
        browser.close()

def test_empty_state():
    """Test empty state display"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file:///{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Check empty state
        empty_state = page.locator('.empty-state')
        assert empty_state.count() == 1, "Empty state should exist"
        
        # Check empty state title
        empty_title = page.locator('.empty-title')
        assert empty_title.count() == 1, "Empty state title should exist"
        
        # Take screenshot
        page.screenshot(path='/tmp/mindful-words-06-empty-state.png')
        
        print("✅ Empty state displays correctly")
        browser.close()

def test_css_styles():
    """Test CSS styles are applied correctly"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file:///{HTML_FILE}')
        page.wait_for_load_state('networkidle')
        
        # Check CSS variables
        root_styles = page.evaluate('''() => {
            const root = document.documentElement;
            const styles = window.getComputedStyle(root);
            return {
                accentColor: styles.getPropertyValue('--accent-color'),
                transitionFast: styles.getPropertyValue('--transition-fast'),
                bgColor: styles.getPropertyValue('--bg-color')
            };
        }''')
        
        assert root_styles['accentColor'] is not None, "CSS variable --accent-color should be defined"
        assert root_styles['transitionFast'] is not None, "CSS variable --transition-fast should be defined"
        assert root_styles['bgColor'] is not None, "CSS variable --bg-color should be defined"
        
        print("✅ CSS styles applied correctly")
        browser.close()

if __name__ == "__main__":
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
