"""Real-browser checks for the current five-stage popup/slot game UI."""
import argparse
import base64
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, expect

LINE = 'karanlık günlere bir güneş olduk'
FINAL_LINE = 'Karanlık günlere bir güneş olduk.'
FAREWELL = 'Ali der ki ustalarım sağ olsun, bu atölye umutla dolsun.'
PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQ0AAAAASUVORK5CYII='


def assert_layout(page):
    result = page.evaluate('''() => {
      const paper = document.querySelector('#parchment');
      const scene = document.querySelector('.artwork').getBoundingClientRect();
      const rect = paper.getBoundingClientRect();
      const notes = document.querySelector('#inspiration').getBoundingClientRect();
      return {
        belowCharacters: rect.top >= scene.top + scene.height * .645,
        noPageOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
        noPanelOverflow: paper.scrollWidth <= paper.clientWidth + 1,
        desktopFits: innerWidth <= 1100 || paper.scrollHeight <= paper.clientHeight + 2,
        inspirationOutsidePaper: notes.bottom < rect.top && !paper.contains(document.querySelector('#inspiration')),
        imageUncropped: getComputedStyle(document.querySelector('#game-art')).objectFit === 'contain',
      };
    }''')
    assert all(result.values()), result


def assert_dialog(page, kind):
    expect(page.locator('#game-dialog')).to_be_visible()
    expect(page.locator('#game-dialog')).to_have_attribute('data-kind', kind)
    page.locator('#game-dialog').evaluate('async node => { await Promise.all(node.getAnimations().map(animation => animation.finished)); }')
    geometry = page.locator('#game-dialog').evaluate('''node => {
      const r=node.getBoundingClientRect(); return {
        fits: r.top>=0 && r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight,
        centered: Math.abs((r.left+r.right)/2-innerWidth/2)<2 && Math.abs((r.top+r.bottom)/2-innerHeight/2)<2
      };
    }''')
    assert all(geometry.values()), geometry


def begin(page, hotspot='#play-hotspot'):
    expect(page.locator('#parchment')).to_be_hidden()
    expect(page.locator('#inspiration')).to_be_hidden()
    page.locator(hotspot).click()
    assert_dialog(page, 'name')
    page.locator('#player-name').fill('Ali')
    page.get_by_role('button', name='Başla', exact=True).click()
    expect(page.locator('#punctuation-0')).to_be_visible()
    expect(page.locator('#panel textarea')).to_have_count(0)
    expect(page.locator('#panel [contenteditable="true"]')).to_have_count(0)


def retry(page, expected=None):
    assert_dialog(page, 'error')
    if expected:
        expect(page.locator('#dialog-message')).to_contain_text(expected)
    page.get_by_role('button', name='Tekrar Dene', exact=True).click()
    expect(page.locator('#game-dialog')).to_be_hidden()


def next_step(page, count):
    assert_dialog(page, 'success')
    expect(page.locator('#inspiration')).to_have_attribute('aria-valuenow', str(count))
    page.get_by_role('button', name='Devam Et', exact=True).click()


def complete_punctuation(page):
    # First slot: pointer menu. Second slot: direct keyboard entry.
    page.locator('#punctuation-0').click()
    page.get_by_role('option', name='Kesme işareti', exact=True).click()
    page.locator('#punctuation-1').fill(',')
    page.get_by_role('button', name='Gönder', exact=True).click()
    next_step(page, 1)


def full_journey(browser, base_url, viewport):
    context = browser.new_context(viewport=viewport)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    try:
        page.goto(base_url)
        begin(page, '#play-hotspot' if viewport['width'] > 900 else '#continue-hotspot')
        assert_layout(page)
        page.get_by_role('button', name='Gönder', exact=True).click()
        retry(page, 'İkinci dizeye')
        assert_layout(page)
        complete_punctuation(page)
        expect(page.locator('#answer')).to_have_attribute('type', 'text')
        page.locator('#answer').fill('Sanat asdfasf ile güneş oldu.')
        page.get_by_role('button', name='Gönder', exact=True).click()
        retry(page, 'harfleri')
        expect(page.locator('#inspiration')).to_have_attribute('aria-valuenow', '1')
        page.locator('#answer').fill('Sanat s1ktir ile güneş oldu.')
        page.get_by_role('button', name='Gönder', exact=True).click()
        retry(page, 'saygılı')
        page.locator('#answer').fill('')
        page.locator('#answer').evaluate('''node => {
          const data=new DataTransfer();data.setData('text/plain','Sanat güneş oldu.\\nUmut bize doldu.');
          node.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
        }''')
        retry(page, 'tek bir dize')
        expect(page.locator('#answer')).to_have_value('')
        page.locator('#answer').fill(LINE)
        page.get_by_role('button', name='Gönder', exact=True).click()
        next_step(page, 2)
        expect(page.locator('#answer')).to_have_value(LINE)
        page.reload()
        expect(page.locator('#answer')).to_have_value(LINE)
        page.get_by_role('button', name='Gönder', exact=True).click()
        retry(page, 'büyük harfle')
        page.locator('#answer').fill(FINAL_LINE[:-1])
        page.get_by_role('button', name='Gönder', exact=True).click()
        retry(page, 'sonuna bak')
        page.locator('#answer').fill(FINAL_LINE)
        page.get_by_role('button', name='Gönder', exact=True).click()
        next_step(page, 3)
        page.locator('#answer').fill('Ustalarım sağ olsun, bu atölye umutla dolsun.')
        page.get_by_role('button', name='Gönder', exact=True).click()
        retry(page, 'adını')
        page.locator('#answer').fill(FAREWELL)
        page.get_by_role('button', name='Gönder', exact=True).click()
        next_step(page, 4)
        assert_layout(page)
        page.get_by_role('button', name='Seçimimi paylaş', exact=True).click()
        retry(page, 'yanlış cevap yok')
        page.get_by_role('radio').nth(1).check()
        page.get_by_role('button', name='Seçimimi paylaş', exact=True).click()
        next_step(page, 5)
        expect(page.locator('h1')).to_have_text('Miras Atölyesi açıldı!')
        expect(page.locator('.final-verse')).to_contain_text(FINAL_LINE)
        expect(page.locator('#panel button')).to_have_count(1)
        expect(page.get_by_role('button', name='Tekrar Oyna', exact=True)).to_be_visible()
        expect(page.locator('a[download]')).to_have_count(0)
        expect(page.get_by_role('button', name=re.compile('Ayar|Sesi|indir'))).to_have_count(0)
        assert_layout(page)
        page.get_by_role('button', name='Tekrar Oyna', exact=True).click()
        assert_dialog(page, 'name')
        expect(page.locator('#player-name')).to_have_value('')
        expect(page.locator('#parchment')).to_be_hidden()
        assert not errors, errors
    finally:
        context.close()


def responsive_and_keyboard(browser, base_url):
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = context.new_page()
    try:
        page.goto(base_url)
        page.locator('#continue-hotspot').click()
        page.locator('#player-name').fill('rrepj')
        page.get_by_role('button', name='Başla', exact=True).click()
        expect(page.locator('#name-error')).to_contain_text('Rastgele')
        page.locator('#player-name').fill('Ali')
        page.locator('#player-name').press('Enter')
        for width, height in [(1920, 1080), (1440, 1000), (1280, 720), (1024, 768), (844, 390), (768, 1024), (390, 844), (320, 568)]:
            page.set_viewport_size({'width': width, 'height': height})
            assert_layout(page)
            page.get_by_role('button', name='Gönder', exact=True).click()
            retry(page)
        page.locator('#punctuation-0').focus()
        page.locator('#punctuation-0').press('ArrowDown')
        page.keyboard.press('Enter')
        expect(page.locator('#punctuation-0')).to_have_value("'")
        page.locator('#punctuation-1').fill('!')
        page.get_by_role('button', name='Gönder', exact=True).click()
        next_step(page, 1)
        page.get_by_role('button', name='İpucu ✧', exact=True).click()
        assert_dialog(page, 'hint')
        page.get_by_role('button', name='Anladım', exact=True).click()
    finally:
        context.close()


def portable_and_artwork(browser, base_url):
    html = (Path(__file__).resolve().parents[1] / 'index.html').read_text(encoding='utf-8')
    context = browser.new_context()
    page = context.new_page()
    failed = []
    context.route('**/*', lambda route: route.continue_() if route.request.is_navigation_request() else route.abort())
    page.on('requestfailed', lambda request: failed.append(request.url))
    try:
        page.goto(base_url)
        begin(page)
        assert page.locator('#parchment').evaluate('node => getComputedStyle(node).position') == 'absolute'
        complete_punctuation(page)
        assert not failed, failed
    finally:
        context.close()
    context = browser.new_context()
    fixture = 'data:image/png;base64,' + PNG
    config = json.dumps({'intro': fixture, 'game': fixture})
    html, count = re.subn(r'(<script id="embedded-assets" type="application/json">).*?(</script>)', lambda match: match[1] + config + match[2], html, count=1)
    assert count == 1
    context.route('https://preview.invalid/**', lambda route: route.fulfill(body=html, content_type='text/html') if route.request.resource_type == 'document' else route.abort())
    page = context.new_page()
    try:
        page.goto('https://preview.invalid/subdirectory/game.html')
        expect(page.locator('#stage')).to_have_attribute('data-artwork', 'intro')
        begin(page)
        expect(page.locator('#stage')).to_have_attribute('data-artwork', 'game')
        expect(page.locator('#game-art')).to_be_visible()
        expect(page.locator('.asset-notice')).to_have_count(0)
    finally:
        context.close()
    # The source template also resolves images relative to its JS module.
    context = browser.new_context()
    context.route('**/assets/images.json', lambda route: route.fulfill(json={'intro': 'giris.png', 'game': 'giris_sonrasi.png'}))
    context.route('**/assets/*.png', lambda route: route.fulfill(body=base64.b64decode(PNG), content_type='image/png'))
    page = context.new_page()
    try:
        page.goto(urljoin(base_url.rstrip('/') + '/', 'index.template.html'))
        expect(page.locator('#stage')).to_have_attribute('data-artwork', 'intro')
        begin(page)
        expect(page.locator('#stage')).to_have_attribute('data-artwork', 'game')
    finally:
        context.close()


def storage_failures(browser, base_url):
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(base_url)
        page.evaluate("localStorage.setItem('miras-atolyesi-teldeki-sevda-v1', '{invalid')")
        page.reload()
        page.evaluate("() => { Storage.prototype.setItem = function () { throw new Error('storage unavailable'); }; }")
        begin(page)
        expect(page.locator('.storage-message')).to_be_visible()
    finally:
        context.close()
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(base_url)
        legacy = {'version': 1, 'screen': 'game', 'name': 'Ali', 'step': 0, 'answers': ['Eski değişmiş metin', '', '', '', ''], 'completed': [False] * 5}
        page.evaluate('(state) => localStorage.setItem("miras-atolyesi-teldeki-sevda-v1",JSON.stringify(state))', legacy)
        page.reload()
        begin(page)
        expect(page.locator('.poem-editor')).to_contain_text('Şu ulu çınarın dalları serin')
        complete_punctuation(page)
    finally:
        context.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://127.0.0.1:4173/')
    parser.add_argument('--browser', default=shutil.which('chromium'))
    args = parser.parse_args()
    with sync_playwright() as p:
        options = {'headless': True, 'args': ['--no-sandbox']}
        if args.browser: options['executable_path'] = args.browser
        browser = p.chromium.launch(**options)
        try:
            for viewport in [{'width': 1440, 'height': 1000}, {'width': 390, 'height': 844}]:
                full_journey(browser, args.base_url, viewport)
                print(f"PASS full journey {viewport['width']} × {viewport['height']}", flush=True)
            responsive_and_keyboard(browser, args.base_url)
            print('PASS eight viewport sizes, centered dialogs, pointer/keyboard punctuation', flush=True)
            portable_and_artwork(browser, args.base_url)
            print('PASS blocked external resources, embedded/source artwork switching', flush=True)
            storage_failures(browser, args.base_url)
            print('PASS corrupted/unavailable storage', flush=True)
        finally:
            browser.close()


if __name__ == '__main__':
    main()
