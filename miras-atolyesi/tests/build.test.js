import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));

test('önizleme HTML dosyası CSS, JavaScript ve görsel tanımını kendi içinde taşır', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(html, /<style id="game-styles">/);
  assert.match(html, /<script type="module" id="game-code">/);
  assert.match(html, /<script id="embedded-assets" type="application\/json">/);
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/);
  assert.match(html, /function validateStep\(/);
  assert.match(html, /function advance\(/);
  assert.doesNotMatch(html, /^import\s/m);
});

test('dağıtılan HTML güncel kaynak dosyalardan aynen üretilebilir', () => {
  const before = readFileSync(join(root, 'index.html'), 'utf8');
  const result = spawnSync('python3', [join(root, 'scripts/build.py')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(root, 'index.html'), 'utf8'), before);
});

test('tanımlanmış ama eksik bir özgün görsel sessizce atlanmaz', () => {
  const temp = mkdtempSync(join(tmpdir(), 'miras-build-'));
  try {
    cpSync(root, temp, { recursive: true });
    writeFileSync(join(temp, 'assets/images.json'), JSON.stringify({ intro: 'giris.png', game: null }));
    const result = spawnSync('python3', [join(temp, 'scripts/build.py')], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /özgün görsel bulunamadı/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('özgün görsel dosyası değiştirilmeden HTML içine gömülür', () => {
  const temp = mkdtempSync(join(tmpdir(), 'miras-images-'));
  try {
    cpSync(root, temp, { recursive: true });
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQ0AAAAASUVORK5CYII=', 'base64');
    writeFileSync(join(temp, 'assets/giris.png'), png);
    writeFileSync(join(temp, 'assets/images.json'), JSON.stringify({ intro: 'giris.png', game: null }));
    const result = spawnSync('python3', [join(temp, 'scripts/build.py')], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const html = readFileSync(join(temp, 'index.html'), 'utf8');
    assert.ok(html.includes('data:image/png;base64,' + png.toString('base64')));
    assert.deepEqual(readFileSync(join(temp, 'assets/giris.png')), png);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('standart adlarla eklenen özgün görseller ayrıca JSON düzenlemeden bulunur', () => {
  const temp = mkdtempSync(join(tmpdir(), 'miras-auto-images-'));
  try {
    cpSync(root, temp, { recursive: true });
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQ0AAAAASUVORK5CYII=', 'base64');
    writeFileSync(join(temp, 'assets/giris.png'), png);
    writeFileSync(join(temp, 'assets/giris_sonrasi.png'), png);
    writeFileSync(join(temp, 'assets/images.json'), JSON.stringify({ intro: null, game: null }));
    const result = spawnSync('python3', [join(temp, 'scripts/build.py')], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stdout, /görseller eksik/);
    const html = readFileSync(join(temp, 'index.html'), 'utf8');
    const json = html.match(/<script id="embedded-assets" type="application\/json">(.*?)<\/script>/s)[1];
    assert.ok(JSON.parse(json).intro.startsWith('data:image/png;base64,'));
    assert.ok(JSON.parse(json).game.startsWith('data:image/png;base64,'));
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('görsel tanımı assets klasöründen dışarı çıkamaz', () => {
  const temp = mkdtempSync(join(tmpdir(), 'miras-paths-'));
  try {
    cpSync(root, temp, { recursive: true });
    writeFileSync(join(temp, 'assets/images.json'), JSON.stringify({ intro: '../giris.png', game: null }));
    const result = spawnSync('python3', [join(temp, 'scripts/build.py')], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /yalnızca assets içindeki/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
