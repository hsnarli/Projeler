"""Real-browser functional checks. Start scripts/serve.py first.

Requires the optional Playwright Python package and a Chromium installation.
No browser package or image fixture is added to the application dependencies.
"""
import argparse
import base64
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, expect, Error

CORRECTED = "Şu ulu çınarın dalları serin.\nAnadolu'm, yurdum benim her şeyim.\nUstalık sırrını ah, kime vereyim?\nGönülden gönüle akar giderim."
LINE = 'karanlık günlere bir güneş olduk'
FINAL_LINE = 'Karanlık günlere bir güneş olduk.'
FAREWELL = 'Ali der ki ustalarım sağ olsun, bu atölye umutla dolsun.'


def assert_layout(page):
    result = page.evaluate('''() => {
      const paper = document.querySelector('#parchment');
      const scene = document.querySelector('.artwork').getBoundingClientRect();
      const rect = paper.getBoundingClientRect();
      const above = document.elementFromPoint(rect.left + 20, rect.top - 3);
      return {
        belowScene: rect.top >= scene.top + scene.height * .78,
        clipped: ['auto', 'scroll'].includes(getComputedStyle(paper).overflowY),
        noPageOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
        noPanelOverflow: paper.scrollWidth <= paper.clientWidth + 1,
        upperSceneUncovered: !above || !paper.contains(above),
      };
    }''')
    assert all(result.values()), result


def full_journey(browser, base_url, viewport):
    context = browser.new_context(viewport=viewport, accept_downloads=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base_url)
    expect(page.locator('h1')).to_have_text('Bir türkü de sen yaz.')
    page.locator('#play-hotspot').click()
    expect(page.locator('#feedback')).to_contain_text('Sana nasıl seslenelim')
    page.locator('#player-name').fill('Ali')
    page.get_by_role('button', name='Oyuna başla →', exact=True).click()
    expect(page.locator('#answer')).to_have_value(CORRECTED.replace("Anadolu'm", 'Anadolum').replace('serin.', 'serin').replace('şeyim.', 'şeyim').replace('ah,', 'ah').replace('vereyim?', 'vereyim').replace('giderim.', 'giderim'))
    page.get_by_role('button', name='Gönder →', exact=True).click()
    expect(page.locator('#feedback')).to_contain_text('İkinci dizeye')
    page.locator('#answer').fill(CORRECTED)
    page.get_by_role('button', name='Gönder →', exact=True).click()
    expect(page.locator('.note.filled')).to_have_count(1)
    assert_layout(page)
    page.get_by_role('button', name='Devam et →', exact=True).click()
    page.locator('#answer').fill(LINE)
    page.get_by_role('button', name='Gönder →', exact=True).click()
    page.get_by_role('button', name='Devam et →', exact=True).click()
    expect(page.locator('#answer')).to_have_value(LINE)
    page.reload()
    expect(page.locator('#answer')).to_have_value(LINE)
    expect(page.locator('h1')).to_contain_text('Dizene yeniden bak')
    page.get_by_role('button', name='Dizemi onayla', exact=True).click()
    expect(page.locator('#feedback')).to_contain_text('büyük harfle')
    page.locator('#answer').fill(LINE[0].upper() + LINE[1:])
    page.get_by_role('button', name='Dizemi onayla', exact=True).click()
    expect(page.locator('#feedback')).to_contain_text('sonuna bak')
    page.locator('#answer').fill(FINAL_LINE)
    page.get_by_role('button', name='Dizemi onayla', exact=True).click()
    page.get_by_role('button', name='Devam et →', exact=True).click()
    page.locator('#answer').fill('Hayali ustalarım için bir türkü olsun.')
    page.get_by_role('button', name='Gönder →', exact=True).click()
    expect(page.locator('#feedback')).to_contain_text('adını')
    page.locator('#answer').fill(FAREWELL)
    page.get_by_role('button', name='Gönder →', exact=True).click()
    page.get_by_role('button', name='Devam et →', exact=True).click()
    page.get_by_role('button', name='Seçimimi paylaş', exact=True).click()
    expect(page.locator('#feedback')).to_contain_text('yanlış cevap yok')
    page.get_by_role('radio').nth(1).check()
    page.get_by_role('button', name='Seçimimi paylaş', exact=True).click()
    expect(page.locator('.note.filled')).to_have_count(5)
    assert_layout(page)
    page.get_by_role('button', name='Atölyeyi aç →', exact=True).click()
    expect(page.locator('h1')).to_have_text('Miras Atölyesi açıldı!')
    expect(page.get_by_role('blockquote')).to_contain_text(FINAL_LINE)
    with page.expect_download() as download_event:
        page.get_by_role('button', name='Türkümü indir ↓', exact=True).click()
    download = download_event.value
    assert download.suggested_filename == 'miras-atolyesi-turkum.txt'
    text = Path(download.path()).read_text(encoding='utf-8-sig')
    assert FINAL_LINE in text and FAREWELL in text and 'KENDİME NOTUM' in text
    page.reload()
    expect(page.locator('h1')).to_have_text('Miras Atölyesi açıldı!')
    page.get_by_role('button', name='Ayarları aç', exact=True).click()
    page.get_by_label('Metni büyüt', exact=True).check()
    page.get_by_label('Tel melodilerini çal', exact=True).check()
    page.get_by_role('button', name='Oyuna dön ↩', exact=True).click()
    assert_layout(page)
    page.get_by_role('button', name='Yeni bir türkü yaz', exact=True).click()
    page.get_by_role('button', name='Yanıtlarımı koru', exact=True).click()
    expect(page.locator('h1')).to_have_text('Miras Atölyesi açıldı!')
    page.get_by_role('button', name='Yeni bir türkü yaz', exact=True).click()
    page.get_by_role('button', name='Evet, yeniden başla', exact=True).click()
    expect(page.locator('#player-name')).to_have_value('')
    assert not errors, errors
    context.close()


def asset_switching(browser, base_url):
    context = browser.new_context()
    context.route('**/assets/images.json', lambda route: route.fulfill(json={'intro': 'giris.png', 'game': 'giris_sonrasi.png'}))
    # A tiny synthetic PNG checks image switching without impersonating user artwork.
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQ0AAAAASUVORK5CYII=')
    context.route('**/assets/*.png', lambda route: route.fulfill(body=png, content_type='image/png'))
    page = context.new_page()
    page.goto(urljoin(base_url.rstrip('/') + '/', 'index.template.html'))
    expect(page.locator('#stage')).to_have_attribute('data-artwork', 'intro')
    expect(page.locator('#intro-art')).to_be_visible()
    expect(page.locator('#game-art')).to_be_hidden()
    page.locator('#player-name').fill('Işıl')
    page.locator('#play-hotspot').click()
    expect(page.locator('#stage')).to_have_attribute('data-artwork', 'game')
    expect(page.locator('#intro-art')).to_be_hidden()
    expect(page.locator('#game-art')).to_be_visible()
    page.locator('#answer').fill(CORRECTED)
    page.get_by_role('button', name='Gönder →', exact=True).click()
    page.get_by_role('button', name='Devam et →', exact=True).click()
    page.locator('#answer').fill('Sanatın güneşi gönlümüze doğdu bugün.')
    page.get_by_role('button', name='Ayarları aç', exact=True).click()
    page.get_by_role('button', name='Çıkış · girişe dön', exact=True).click()
    expect(page.locator('#stage')).to_have_attribute('data-artwork', 'intro')
    page.get_by_role('button', name='Devam et →', exact=True).click()
    expect(page.locator('#answer')).to_have_value('Sanatın güneşi gönlümüze doğdu bugün.')
    for width, height in [(1280, 720), (768, 1024), (844, 390), (320, 568)]:
        page.set_viewport_size({'width': width, 'height': height})
        assert_layout(page)
    context.close()


def storage_failures(browser, base_url):
    context = browser.new_context()
    page = context.new_page()
    page.goto(base_url)
    page.evaluate("localStorage.setItem('miras-atolyesi-teldeki-sevda-v1', '{invalid')")
    page.reload()
    expect(page.locator('#player-name')).to_have_value('')
    page.evaluate("() => { Storage.prototype.setItem = function () { throw new Error('storage unavailable'); }; }")
    page.locator('#player-name').fill('Ali')
    page.locator('#play-hotspot').click()
    expect(page.locator('.storage-message')).to_be_visible()
    expect(page.locator('#answer')).to_be_visible()
    context.close()


def standalone_preview(browser, base_url):
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    failed = []
    context.route('**/*', lambda route: route.continue_() if route.request.is_navigation_request() else route.abort())
    page = context.new_page()
    page.on('requestfailed', lambda request: failed.append(request.url))
    page.goto(base_url)
    expect(page.locator('#game-styles')).to_have_count(1)
    expect(page.locator('#game-code')).to_have_count(1)
    assert page.locator('#parchment').evaluate("node => getComputedStyle(node).position") == 'absolute'
    expect(page.locator('.asset-notice')).to_contain_text('Orijinal görsel dosyaları gerekiyor')
    page.locator('#player-name').fill('Ali')
    page.locator('#play-hotspot').click()
    page.locator('#answer').fill(CORRECTED)
    page.get_by_role('button', name='Gönder →', exact=True).click()
    expect(page.locator('.note.filled')).to_have_count(1)
    assert_layout(page)
    assert not failed, failed
    context.close()


def embedded_artwork(browser):
    context = browser.new_context()
    html = (Path(__file__).resolve().parents[1] / 'index.html').read_text(encoding='utf-8')
    png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQ0AAAAASUVORK5CYII='
    config = json.dumps({'intro': png, 'game': png})
    html, count = re.subn(r'(<script id="embedded-assets" type="application/json">).*?(</script>)', lambda match: match[1] + config + match[2], html, count=1)
    assert count == 1
    context.route('https://preview.invalid/**', lambda route: route.fulfill(body=html, content_type='text/html') if route.request.resource_type == 'document' else route.abort())
    page = context.new_page()
    page.goto('https://preview.invalid/subdirectory/game.html')
    expect(page.locator('#stage')).to_have_attribute('data-artwork', 'intro')
    expect(page.locator('.asset-notice')).to_have_count(0)
    page.locator('#player-name').fill('Ali')
    page.locator('#play-hotspot').click()
    expect(page.locator('#stage')).to_have_attribute('data-artwork', 'game')
    expect(page.locator('#game-art')).to_be_visible()
    context.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://127.0.0.1:4173')
    parser.add_argument('--browser', default=shutil.which('chromium'))
    args = parser.parse_args()
    with sync_playwright() as p:
        options = {'headless': True, 'args': ['--no-sandbox']}
        if args.browser:
            options['executable_path'] = args.browser
        browser = p.chromium.launch(**options)
        for viewport in [{'width': 1440, 'height': 1000}, {'width': 390, 'height': 844}]:
            full_journey(browser, args.base_url, viewport)
            print(f"PASS full journey {viewport['width']} × {viewport['height']}", flush=True)
        asset_switching(browser, args.base_url)
        print('PASS separate artwork, resume, and four additional viewport sizes', flush=True)
        standalone_preview(browser, args.base_url)
        print('PASS styled standalone preview with all external resources blocked', flush=True)
        local_file = (Path(__file__).resolve().parents[1] / 'index.html').as_uri()
        probe = browser.new_page()
        try:
            probe.goto(local_file)
        except Error as error:
            if 'ERR_BLOCKED_BY_ADMINISTRATOR' not in str(error):
                raise
            print('SKIP optional file:// navigation: blocked by managed browser policy; HTTP checks remain required', flush=True)
        else:
            full_journey(browser, local_file, {'width': 1440, 'height': 1000})
            print('PASS complete offline file:// journey without a server', flush=True)
        finally:
            probe.close()
        embedded_artwork(browser)
        print('PASS embedded original-image mechanism under an arbitrary preview path', flush=True)
        storage_failures(browser, args.base_url)
        print('PASS corrupted and unavailable browser storage', flush=True)
        browser.close()


if __name__ == '__main__':
    main()
