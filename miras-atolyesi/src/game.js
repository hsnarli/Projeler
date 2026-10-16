import { ORIGINAL_POEM, REFLECTIONS, STEPS } from './content.js';
import { validateName, validateStep } from './rules.js';

const STORAGE_KEY = 'miras-atolyesi-teldeki-sevda-v1';
const panel = document.querySelector('#panel');
const parchment = document.querySelector('#parchment');
const stage = document.querySelector('#stage');
const hotspot = document.querySelector('#play-hotspot');
const artwork = { intro: false, game: false };
let assetsLoaded = false;
let storageWorks = true;
let audioContext;
let view = null;

function initialState(settings = { sound: false, large: false }) {
  return { version: 1, screen: 'intro', name: '', step: 0, answers: [ORIGINAL_POEM, '', '', '', ''], completed: [false, false, false, false, false], settings };
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || saved.version !== 1) return initialState();
    const state = initialState({ sound: saved.settings?.sound === true, large: saved.settings?.large === true });
    if (!validateName(saved.name || '').ok) return state;
    if (!Array.isArray(saved.answers) || saved.answers.length !== 5 || saved.answers.some(value => typeof value !== 'string' || value.length > 600)) return state;
    state.name = saved.name;
    state.answers = saved.answers;
    let previousComplete = true;
    state.completed = state.answers.map((value, i) => {
      const complete = previousComplete && saved.completed?.[i] === true && validateStep(i, value, state.name).ok;
      previousComplete = complete;
      return complete;
    });
    const firstIncomplete = state.completed.indexOf(false);
    const requestedStep = Number.isInteger(saved.step) ? saved.step : 0;
    state.step = Math.max(0, Math.min(4, firstIncomplete === -1 ? 4 : firstIncomplete, requestedStep));
    if (saved.screen === 'finish' && firstIncomplete === -1) state.screen = 'finish';
    else if (saved.screen === 'game') state.screen = 'game';
    return state;
  } catch {
    return initialState();
  }
}

let state = restore();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageWorks = true;
  } catch {
    storageWorks = false;
    if (!panel.querySelector('.storage-message')) {
      panel.append(el('p', { className: 'storage-message', role: 'status' }, 'Tarayıcı ilerlemeni kaydedemiyor. Bu sayfayı kapatırsan yanıtların kaybolabilir.'));
    }
  }
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in node && !key.startsWith('aria') && key !== 'role') node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child !== null && child !== undefined) node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

const iconPaths = {
  settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m9 3-1 3-3 1-2 4 2 2v4l3 1 2 3 4-1 2-3 3-1 2-4-2-2V6l-4-1-2-3Z"/>',
  sound: '<path d="M11 4 6 8H3v8h3l5 4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  muted: '<path d="M11 4 6 8H3v8h3l5 4Z"/><path d="m16 9 5 6m0-6-5 6"/>',
};

function iconButton(kind, label, handler, pressed) {
  const button = el('button', { className: 'icon-button', type: 'button', 'aria-label': label, onClick: handler });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = iconPaths[kind]; // Static application icons only; no user content.
  button.append(svg);
  if (pressed !== undefined) button.setAttribute('aria-pressed', String(pressed));
  return button;
}

function playMelody(final = false) {
  if (!state.settings.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume().catch(() => {});
    const notes = final ? [293.66, 329.63, 392, 440, 392, 329.63, 293.66] : [293.66, 392, 440];
    notes.forEach((frequency, index) => {
      const start = audioContext.currentTime + index * .16;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.075, start + .009);
      gain.gain.exponentialRampToValueAtTime(.001, start + .6);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + .65);
    });
  } catch {
    // Sound is optional; writing remains available on browsers without Web Audio.
  }
}

function toggleSound() {
  state.settings.sound = !state.settings.sound;
  save();
  playMelody();
  render();
}

function header(title, { number, finale = false } = {}) {
  const heading = el('div', { className: 'panel-heading' });
  const titleNode = el('h1', { className: `chapter-title${finale ? ' finished-title' : ''}` });
  if (number) titleNode.append(el('span', { className: 'chapter-number' }, `${String(number).padStart(2, '0')} / 05`));
  titleNode.append(document.createTextNode(title));
  const progress = state.completed.filter(Boolean).length;
  const inspiration = el('div', { className: 'inspiration', role: 'img', 'aria-label': `İlham çubuğu: 5 telden ${progress} tanesi doldu` }, el('span', { className: 'inspiration-label', 'aria-hidden': 'true' }, 'İLHAM'));
  for (let i = 0; i < 5; i++) inspiration.append(el('span', { className: `note${i < progress ? ' filled' : ''}`, 'aria-hidden': 'true' }, '♪'));
  const tools = el('div', { className: 'tools' },
    inspiration,
    iconButton(state.settings.sound ? 'sound' : 'muted', 'Sesi aç veya kapat', toggleSound, state.settings.sound),
    iconButton('settings', 'Ayarları aç', () => { view = 'settings'; render(); }),
  );
  heading.append(titleNode, tools);
  return heading;
}

function feedbackNode(text = '', kind = '') {
  return el('p', { id: 'feedback', className: `feedback ${kind}`, role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, text);
}

function feedback(message, kind = '') {
  const target = panel.querySelector('#feedback');
  if (!target) return;
  target.className = `feedback ${kind}`;
  target.textContent = message;
  target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
}

function renderIntro() {
  const hasProgress = state.completed.some(Boolean) || state.answers[1].trim();
  panel.append(header('Bir türkü de sen yaz.'));
  const nameInput = el('input', { id: 'player-name', className: 'text-input', type: 'text', name: 'player-name', autoComplete: 'given-name', maxLength: 30, value: state.name, placeholder: 'Adın veya takma adın', readOnly: Boolean(hasProgress), 'aria-describedby': 'feedback' });
  const form = el('form', { className: 'name-row', noValidate: true, onSubmit: (event) => {
    event.preventDefault();
    const result = validateName(nameInput.value);
    if (!result.ok) { nameInput.setAttribute('aria-invalid', 'true'); feedback(result.message, 'warning'); nameInput.focus(); return; }
    state.name = result.name;
    state.screen = state.completed.every(Boolean) ? 'finish' : 'game';
    save();
    playMelody();
    render();
    focusPanel();
  } },
  el('div', { className: 'field' }, el('label', { htmlFor: 'player-name', className: 'field-label' }, hasProgress ? 'Türkündeki imzan' : 'Ozan sana nasıl seslensin?'), nameInput),
  el('button', { className: 'primary-button', type: 'submit' }, hasProgress ? 'Devam et →' : 'Oyuna başla →'));
  panel.append(el('div', { className: 'panel-body intro-body' },
    el('div', { className: 'intro-copy' }, el('strong', {}, 'Halk Ozanı seni bekliyor.'), el('p', {}, 'Miras Atölyesi açılışa hazır; türkünün son sözleri eksik. Dizeleri tamamla, kendi yazına yeniden bak ve beş teli birlikte seslendirelim.')),
    el('div', {}, form, el('p', { className: 'intro-note' }, hasProgress ? 'İlerlemen bu tarayıcıda saklı. Adını değiştirmek için ayarlardan yeniden başlayabilirsin.' : '5 küçük adım · Kendi sözlerin · Acele etmeden')),
  ), feedbackNode());
  hotspot.onclick = () => form.requestSubmit();
}

function renderGame() {
  const step = state.step;
  const content = STEPS[step];
  const complete = state.completed[step];
  panel.append(header(content.title, { number: step + 1 }));
  const story = el('div', {}, el('span', { className: 'speaker' }, `HALK OZANI · ${state.name}`), el('p', { id: 'task-prompt', className: 'story' }, content.prompt));
  if (step === 2) story.append(el('p', { className: 'original-line' }, 'İlk yazdığın: ', state.answers[1]));
  const field = el('div', { className: 'field' });
  let input;
  if (step === 4) {
    input = el('fieldset', { className: 'reflection-list', 'aria-describedby': 'task-prompt feedback' }, el('legend', { className: 'field-label' }, content.label));
    REFLECTIONS.forEach((option, i) => {
      const radio = el('input', { type: 'radio', name: 'reflection', value: option.id, checked: state.answers[step] === option.id, disabled: complete, onChange: () => { state.answers[step] = option.id; save(); } });
      input.append(el('label', { className: 'reflection-option' }, radio, el('span', {}, `${String.fromCharCode(65 + i)}) ${option.text}`)));
    });
    field.append(input);
  } else {
    input = el('textarea', { id: 'answer', className: `answer-input${step === 0 ? ' poem' : ''}`, value: state.answers[step], maxLength: 600, rows: step === 0 ? 4 : 2, readOnly: complete, spellcheck: true, 'aria-describedby': 'task-prompt feedback', placeholder: step === 3 ? `${state.name} der ki…` : 'Dizeni buraya yaz…', onInput: () => { state.answers[step] = input.value; input.removeAttribute('aria-invalid'); save(); } });
    field.append(el('label', { htmlFor: 'answer', className: 'field-label' }, content.label), input);
  }
  const action = el('button', { className: 'primary-button', type: complete ? 'button' : 'submit', ...(complete ? { onClick: advance, 'data-next': '' } : {}) }, complete ? (step === 4 ? 'Atölyeyi aç →' : 'Devam et →') : (step === 4 ? 'Seçimimi paylaş' : step === 2 ? 'Dizemi onayla' : 'Gönder →'));
  const form = el('form', { className: 'answer-form', noValidate: true, onSubmit: (event) => {
    event.preventDefault();
    if (state.completed[step]) return;
    const result = validateStep(step, state.answers[step], state.name);
    if (!result.ok) {
      input.setAttribute('aria-invalid', 'true');
      feedback(result.message, 'warning');
      return;
    }
    state.answers[step] = state.answers[step].trim();
    state.completed[step] = true;
    save();
    playMelody();
    render();
    const notes = panel.querySelectorAll('.note.filled');
    notes[notes.length - 1]?.classList.add('just-filled');
    panel.querySelector('[data-next]')?.focus();
  } }, field, action);
  story.append(el('div', { className: 'story-feedback' }, feedbackNode(complete ? content.success : '', complete ? 'success' : '')),
    el('button', { className: 'text-button hint-control story-hint', type: 'button', onClick: () => feedback(content.hint) }, 'Bir ipucu al'));
  panel.append(el('div', { className: 'panel-body' }, story, el('div', { className: 'workbench' }, form)));
}

function advance() {
  if (!state.completed[state.step]) return;
  if (state.step === 4) {
    state.screen = 'finish';
    playMelody(true);
  } else {
    state.step++;
    if (state.step === 2 && !state.answers[2]) state.answers[2] = state.answers[1];
  }
  save();
  render();
  focusPanel();
}

function songText() {
  return `${state.answers[0]}\n\nMermerleri yonttuk, kemerler kurduk,\nRenkleri suyun üzerinde bulduk…\n${state.answers[2]}\n\n${state.answers[3]}`;
}

function downloadSong() {
  const reflection = REFLECTIONS.find(option => option.id === state.answers[4]);
  const text = `MİRAS ATÖLYESİ · TELDEKİ SEVDA\n${state.name} ve Halk Ozanı\n\n${songText()}\n\nKENDİME NOTUM\n${reflection?.text || ''}\n`;
  const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }));
  const link = el('a', { href: url, download: 'miras-atolyesi-turkum.txt' });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderFinish() {
  panel.append(header('Miras Atölyesi açıldı!', { finale: true }));
  const reflection = REFLECTIONS.find(option => option.id === state.answers[4]);
  panel.append(el('div', { className: 'panel-body' },
    el('div', {}, el('span', { className: 'eyebrow' }, 'Köklerin sesi geleceğe ulaştı'),
      el('p', { className: 'story' }, `Eline, diline sağlık ${state.name}! Mimar Kalfası, Hayalî Usta, Halk Ozanı ve Ebruzen aynı avluda buluştu. Senin dizelerinle türkümüz tamamlandı.`),
      el('p', { className: 'finished-reflection' }, 'Kendine notun: ', reflection?.text),
      el('div', { className: 'finished-actions' },
        el('button', { className: 'primary-button', type: 'button', onClick: downloadSong }, 'Türkümü indir ↓'),
        el('button', { className: 'secondary-button', type: 'button', onClick: () => { state.screen = 'intro'; save(); render(); } }, 'Girişe dön'),
        el('button', { className: 'text-button', type: 'button', onClick: () => { view = 'reset'; render(); } }, 'Yeni bir türkü yaz')),
    ), el('blockquote', { className: 'finished-poem', 'aria-label': 'Birlikte tamamladığımız türkü' }, songText())),
  );
}

function renderSettings() {
  panel.append(el('div', { className: 'panel-heading' }, el('h1', { className: 'chapter-title' }, 'Atölye ayarları'), el('button', { type: 'button', className: 'secondary-button tools', onClick: () => { view = null; render(); focusPanel(); } }, 'Oyuna dön ↩')));
  const sound = el('input', { type: 'checkbox', checked: state.settings.sound, onChange: () => { state.settings.sound = sound.checked; save(); playMelody(); } });
  const large = el('input', { type: 'checkbox', checked: state.settings.large, onChange: () => { state.settings.large = large.checked; stage.classList.toggle('large-text', large.checked); save(); } });
  panel.append(el('div', { className: 'settings-grid' },
    el('label', { className: 'setting-check' }, sound, 'Tel melodilerini çal'),
    el('label', { className: 'setting-check' }, large, 'Metni büyüt'),
    el('span', { className: 'intro-note' }, 'Yanıtların yalnızca bu tarayıcıda saklanır.')),
    el('div', { className: 'settings-bottom' },
      el('button', { className: 'secondary-button', type: 'button', onClick: () => { state.screen = 'intro'; view = null; save(); render(); } }, 'Çıkış · girişe dön'),
      el('button', { className: 'text-button', type: 'button', onClick: () => { view = 'reset'; render(); } }, 'Yeniden başla')),
  );
}

function renderReset() {
  panel.append(el('h1', { className: 'chapter-title' }, 'Yeni bir türküye başlayalım mı?'),
    el('p', { className: 'settings-confirm' }, 'Yeniden başlarsan bu tarayıcıda saklanan adın ve yanıtların silinir. Bitirdiğin türküyü önce indirmek isteyebilirsin.'),
    el('div', { className: 'settings-bottom' },
      el('button', { className: 'secondary-button', type: 'button', onClick: () => { view = null; render(); focusPanel(); } }, 'Yanıtlarımı koru'),
      state.completed.every(Boolean) ? el('button', { className: 'secondary-button', type: 'button', onClick: downloadSong }, 'Önce türkümü indir') : null,
      el('button', { className: 'primary-button', type: 'button', onClick: () => { state = initialState(state.settings); view = null; save(); render(); focusPanel(); } }, 'Evet, yeniden başla')),
  );
}

function focusPanel() {
  parchment.scrollTop = 0;
  parchment.focus({ preventScroll: true });
}

function renderArtwork() {
  const active = state.screen === 'intro' ? 'intro' : 'game';
  for (const key of ['intro', 'game']) document.querySelector(`#${key}-art`).hidden = key !== active || !artwork[key];
  document.querySelector('.scene-fallback').hidden = artwork[active];
  hotspot.hidden = state.screen !== 'intro' || view !== null;
  hotspot.classList.toggle('has-art', artwork.intro);
  stage.dataset.artwork = artwork[active] ? active : 'missing';
}

function renderAssetNotice() {
  panel.querySelector('.asset-notice')?.remove();
  if (!assetsLoaded) return;
  const missing = [!artwork.intro ? 'giriş' : null, !artwork.game ? 'giriş sonrası' : null].filter(Boolean);
  if (missing.length) panel.append(el('p', { className: 'asset-notice', role: 'status' }, `Özgün ${missing.join(' ve ')} görseli henüz yüklenmedi. Orijinal görsel dosyaları gerekiyor.`));
}

function render() {
  panel.replaceChildren();
  stage.classList.toggle('large-text', state.settings.large);
  renderArtwork();
  if (view === 'reset') renderReset();
  else if (view === 'settings') renderSettings();
  else if (state.screen === 'intro') renderIntro();
  else if (state.screen === 'finish') renderFinish();
  else renderGame();
  if (!storageWorks) panel.append(el('p', { className: 'storage-message' }, 'İlerlemen kaydedilemiyor; sayfayı kapatırsan yanıtların kaybolabilir.'));
  renderAssetNotice();
  parchment.scrollTop = 0;
}

async function loadArtwork() {
  try {
    const embedded = document.querySelector('#embedded-assets');
    let manifest;
    if (embedded) manifest = JSON.parse(embedded.textContent);
    else {
      const response = await fetch(new URL('../assets/images.json', import.meta.url));
      if (!response.ok) throw new Error('Görsel listesi yüklenemedi.');
      manifest = await response.json();
    }
    await Promise.all(['intro', 'game'].map(async key => {
      const filename = manifest[key];
      if (typeof filename !== 'string') return;
      const isEmbeddedImage = embedded && /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(filename);
      const isLocalImage = !embedded && /^[\p{L}\p{N}_ .-]+\.(png|jpe?g|webp)$/iu.test(filename);
      if (!isEmbeddedImage && !isLocalImage) return;
      const img = document.querySelector(`#${key}-art`);
      img.src = isEmbeddedImage ? filename : new URL(`../assets/${encodeURIComponent(filename)}`, import.meta.url).href;
      try { await img.decode(); artwork[key] = true; } catch { artwork[key] = false; }
    }));
  } catch {
    // Missing original artwork stays missing; no substitute scene is generated.
  } finally {
    assetsLoaded = true;
    renderArtwork();
    renderAssetNotice();
  }
}

render();
loadArtwork();
