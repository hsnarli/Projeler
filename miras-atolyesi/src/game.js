import { ORIGINAL_POEM, REFLECTIONS, STEPS } from './content.js';
import { validateName, validateStep } from './rules.js';

const STORAGE_KEY = 'miras-atolyesi-teldeki-sevda-v1';
const panel = document.querySelector('#panel');
const parchment = document.querySelector('#parchment');
const stage = document.querySelector('#stage');
const inspiration = document.querySelector('#inspiration');
const dialog = document.querySelector('#game-dialog');
const hotspots = [document.querySelector('#play-hotspot'), document.querySelector('#continue-hotspot')];
const artwork = { intro: false, game: false };
let assetsLoaded = false;
let audioContext;
let storageWorks = true;
let dialogAction;

function initialState() {
  return { version: 2, screen: 'intro', name: '', step: 0, answers: [ORIGINAL_POEM, '', '', '', ''], completed: [false, false, false, false, false] };
}

function restore() {
  const fresh = initialState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || ![1, 2].includes(saved.version) || !validateName(saved.name || '').ok) return fresh;
    if (!Array.isArray(saved.answers) || saved.answers.length !== 5 || saved.answers.some(value => typeof value !== 'string' || value.length > 600)) return fresh;
    fresh.name = saved.name;
    fresh.answers = saved.answers;
    // Old versions allowed editing the whole stanza. Migrate only the two marks.
    const oldPoem = fresh.answers[0];
    const firstMark = (oldPoem.match(/anadolu(['’‘ʼ.,!?;:…]?)m/iu) || [])[1] || '';
    const secondMark = (oldPoem.match(/\bah\s*([',.!?;:’…]?)/iu) || [])[1] || '';
    fresh.answers[0] = ORIGINAL_POEM.replace('Anadolum', `Anadolu${firstMark}m`).replace('ah ', `ah${secondMark} `);
    let previous = true;
    fresh.completed = fresh.answers.map((value, index) => {
      previous = previous && saved.completed?.[index] === true && validateStep(index, value, saved.name).ok;
      return previous;
    });
    const incomplete = fresh.completed.indexOf(false);
    fresh.step = Math.max(0, Math.min(4, incomplete < 0 ? 4 : incomplete, Number.isInteger(saved.step) ? saved.step : 0));
    if (saved.version === 2 && ['game', 'finish'].includes(saved.screen)) fresh.screen = saved.screen === 'finish' && incomplete >= 0 ? 'game' : saved.screen;
    return fresh;
  } catch { return fresh; }
}

let state = restore();

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in node && !key.startsWith('aria') && key !== 'role') node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) if (child !== null && child !== undefined) node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  return node;
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageWorks = true; }
  catch { storageWorks = false; }
  renderNotices();
}

function renderNotices() {
  panel.querySelectorAll('.asset-notice, .storage-message').forEach(node => node.remove());
  if (!storageWorks) panel.append(el('p', { className: 'storage-message', role: 'status' }, 'Bu tarayıcı ilerlemeni kaydedemiyor. Sayfayı kapatırsan yanıtların kaybolabilir.'));
  if (assetsLoaded && (!artwork.intro || !artwork.game)) panel.append(el('p', { className: 'asset-notice' }, 'Özgün görsel dosyaları henüz yüklenmedi.'));
}

function playMelody(final = false) {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume().catch(() => {});
    const notes = final ? [293.66, 329.63, 392, 440, 392, 329.63, 293.66] : [293.66, 392, 440];
    notes.forEach((frequency, index) => {
      const start = audioContext.currentTime + index * .15;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.045, start + .009); gain.gain.exponentialRampToValueAtTime(.001, start + .5);
      oscillator.connect(gain).connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + .55);
    });
  } catch { /* Audio is optional; all tasks still work. */ }
}

function closeDialog() { if (dialog.open) dialog.close(); dialogAction = null; }

function openDialog(kind, title, message, buttonText, action) {
  dialog.dataset.kind = kind;
  dialog.replaceChildren(el('div', { className: 'dialog-emblem', 'aria-hidden': 'true' }, kind === 'error' ? '↺' : kind === 'name' ? '✎' : '♪'),
    el('p', { className: 'dialog-eyebrow' }, 'MİRAS ATÖLYESİ'),
    el('h2', { id: 'dialog-title' }, title), el('p', { id: 'dialog-message' }, message));
  if (buttonText) {
    const run = () => { closeDialog(); action?.(); };
    dialogAction = run;
    dialog.append(el('button', { type: 'button', className: 'primary-button dialog-primary', onClick: run }, buttonText));
  }
  if (!dialog.open) dialog.showModal();
  dialog.classList.remove('appear'); void dialog.offsetWidth; dialog.classList.add('appear');
}

dialog.addEventListener('cancel', event => {
  event.preventDefault();
  if (dialog.dataset.kind === 'success') dialogAction?.();
  else closeDialog();
});

function showFeedback(message, success = false) {
  openDialog(success ? 'success' : 'error', success ? 'Bir tel daha ses verdi!' : 'Bir daha bakalım', message, success ? 'Devam Et' : 'Tekrar Dene', success ? advance : () => panel.querySelector('input:not([readonly]):not([disabled])')?.focus({ preventScroll: true }));
}

function askName() {
  openDialog('name', 'Hoş geldin, çırak!', 'Türkünün son dizesine imzanı atacaksın. Ozan sana nasıl seslensin?');
  const input = el('input', { id: 'player-name', name: 'player-name', className: 'name-input', type: 'text', maxLength: 30, autoComplete: 'given-name', value: state.name, placeholder: 'Adın veya takma adın', 'aria-describedby': 'name-error' });
  const error = el('p', { id: 'name-error', className: 'name-error', role: 'status', 'aria-live': 'polite' });
  const form = el('form', { className: 'name-form', noValidate: true, onSubmit: event => {
    event.preventDefault();
    const result = validateName(input.value);
    if (!result.ok) { error.textContent = result.message; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
    if (state.name && state.name !== result.name) state = initialState();
    state.name = result.name; state.screen = state.completed.every(Boolean) ? 'finish' : 'game';
    closeDialog(); save(); render(); focusPaper();
  } }, el('label', { htmlFor: 'player-name' }, 'Adın'), input, error, el('button', { type: 'submit', className: 'primary-button dialog-primary' }, 'Başla'));
  dialog.append(form); input.focus();
}

hotspots.forEach(button => button.addEventListener('click', askName));

function renderInspiration(justFilled = false) {
  inspiration.replaceChildren();
  const count = state.completed.filter(Boolean).length;
  inspiration.setAttribute('role', 'progressbar'); inspiration.setAttribute('aria-valuemin', '0'); inspiration.setAttribute('aria-valuemax', '5'); inspiration.setAttribute('aria-valuenow', String(count));
  inspiration.append(el('div', { className: 'inspiration-heading', 'aria-hidden': 'true' }, el('span', {}, '✦ İLHAM TELLERİ ✦'), el('small', {}, `${count} / 5`)));
  const strings = el('div', { className: 'musical-strings', 'aria-hidden': 'true' });
  for (let i = 0; i < 5; i++) strings.append(el('span', { className: `music-note${i < count ? ' filled' : ''}${justFilled && i === count - 1 ? ' just-filled' : ''}` }, ['♪', '♫', '♩', '♫', '♪'][i]));
  inspiration.append(strings);
}

function heading(title, number) {
  return el('div', { className: 'panel-heading' }, el('div', { className: 'heading-copy' },
    number ? el('span', { className: 'chapter-number' }, `${number} / 5`) : null,
    el('h1', {}, title)), number ? el('button', { type: 'button', className: 'hint-button', onClick: () => openDialog('hint', 'Küçük bir ipucu', STEPS[state.step].hint, 'Anladım') }, 'İpucu ✧') : null);
}

function readPunctuation() {
  return [(state.answers[0].match(/anadolu(['’‘ʼ.,!?;:…]?)m/iu) || [])[1] || '', (state.answers[0].match(/\bah\s*([',.!?;:’…]?)/iu) || [])[1] || ''];
}

function punctuationField() {
  const values = readPunctuation();
  const editor = el('div', { className: 'poem-editor', 'aria-label': 'Yalnızca iki eksik noktalama alanı düzenlenebilir' });
  const write = () => { state.answers[0] = ORIGINAL_POEM.replace('Anadolum', `Anadolu${values[0]}m`).replace('ah ', `ah${values[1]} `); save(); };
  function slot(index, label) {
    const wrapper = el('span', { className: 'punctuation-slot' });
    const list = el('span', { className: 'punctuation-options', id: `punctuation-options-${index}`, role: 'listbox', 'aria-label': 'Noktalama işaretleri', hidden: true });
    const input = el('input', { id: `punctuation-${index}`, className: 'punctuation-input', type: 'text', size: 1, maxLength: 1, autoComplete: 'off', spellcheck: false, value: values[index], placeholder: '·', disabled: state.completed[0], role: 'combobox', 'aria-label': label, 'aria-haspopup': 'listbox', 'aria-controls': list.id, 'aria-expanded': 'false' });
    const hide = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); };
    const show = () => { if (input.disabled) return; document.querySelectorAll('.punctuation-options').forEach(node => { node.hidden = true; node.parentElement.querySelector('input').setAttribute('aria-expanded', 'false'); }); list.hidden = false; input.setAttribute('aria-expanded', 'true'); };
    const accept = () => {
      if (input.value && !/^['’‘ʼ,.!?;:…]$/u.test(input.value)) { input.value = values[index]; showFeedback('Buraya yalnızca bir noktalama işareti girebilirsin. Kutudaki seçeneklerden birini de seçebilirsin.'); return; }
      values[index] = input.value; write(); hide();
    };
    input.addEventListener('focus', show); input.addEventListener('click', show); input.addEventListener('input', accept);
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); show(); list.querySelector('button')?.focus(); }
      if (event.key === 'Escape') { event.preventDefault(); hide(); }
    });
    ["'", ',', '.', '!', '?'].forEach((mark, optionIndex) => {
      const option = el('button', { type: 'button', role: 'option', tabIndex: -1, 'data-mark': mark, 'aria-label': ({ "'": 'Kesme işareti', ',': 'Virgül', '.': 'Nokta', '!': 'Ünlem', '?': 'Soru işareti' })[mark], onClick: () => { input.value = mark; values[index] = mark; write(); input.focus({ preventScroll: true }); hide(); }, onKeydown: event => {
        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1; list.children[(optionIndex + direction + 5) % 5].focus(); }
        if (event.key === 'Escape') { event.preventDefault(); input.focus(); hide(); }
      } }, mark);
      list.append(option);
    });
    wrapper.addEventListener('focusout', event => { if (!wrapper.contains(event.relatedTarget)) hide(); });
    wrapper.append(input, list); return wrapper;
  }
  editor.append(el('p', { className: 'verse-line' }, 'Şu ulu çınarın dalları serin'),
    el('p', { className: 'verse-line' }, 'Anadolu', slot(0, 'Anadolu ile m arasındaki işaret'), 'm, yurdum benim her şeyim'),
    el('p', { className: 'verse-line' }, 'Ustalık sırrını ah', slot(1, 'Ah sözcüğünden sonraki işaret'), ' kime vereyim'),
    el('p', { className: 'verse-line' }, 'Gönülden gönüle akar giderim'));
  return editor;
}

function lineField(step) {
  const field = el('div', { className: 'writing-field' });
  const limit = step === 3 ? 160 : 120;
  const counter = el('span', { id: 'character-count', className: 'character-count' }, `${state.answers[step].length} / ${limit}`);
  const input = el('input', { id: 'answer', className: 'answer-input', type: 'text', maxLength: limit, autoComplete: 'off', spellcheck: true, readOnly: state.completed[step], value: state.answers[step], placeholder: step === 3 ? `${state.name} der ki…` : 'Özgün dizeni tek satırda yaz…', 'aria-describedby': 'task-prompt character-count', onInput: () => { state.answers[step] = input.value; counter.textContent = `${input.value.length} / ${limit}`; save(); } });
  input.addEventListener('paste', event => {
    if (/[\r\n]/.test(event.clipboardData?.getData('text') || '')) { event.preventDefault(); showFeedback('Bu görevde yalnızca tek bir dize yazabilirsin. Birden fazla satırı aynı anda yapıştırma.'); }
  });
  field.append(el('label', { htmlFor: 'answer', className: 'field-label' }, STEPS[step].label), input,
    el('div', { className: 'field-footer' }, el('span', {}, 'Tek satır · Kendi sözlerin'), counter));
  return field;
}

function reflectionField() {
  const list = el('fieldset', { className: 'reflection-list', 'aria-describedby': 'task-prompt' }, el('legend', { className: 'sr-only' }, STEPS[4].label));
  REFLECTIONS.forEach((option, index) => list.append(el('label', { className: 'reflection-option' },
    el('input', { type: 'radio', name: 'reflection', value: option.id, checked: state.answers[4] === option.id, disabled: state.completed[4], onChange: () => { state.answers[4] = option.id; save(); } }),
    el('span', {}, el('strong', {}, `${String.fromCharCode(65 + index)}) `), option.text))));
  return list;
}

function renderGame() {
  const step = state.step;
  panel.append(heading(STEPS[step].title, step + 1));
  const story = el('div', { className: 'story' }, el('span', { className: 'speaker' }, `HALK OZANI · ${state.name}`), el('p', { id: 'task-prompt' }, STEPS[step].prompt));
  if (step === 2) story.append(el('p', { className: 'original-line' }, 'İlk yazdığın: ', state.answers[1]));
  const form = el('form', { className: `answer-form${step === 0 ? ' punctuation-form' : ''}`, noValidate: true, onSubmit: event => {
    event.preventDefault();
    if (state.completed[step]) { advance(); return; }
    const result = validateStep(step, state.answers[step], state.name);
    if (!result.ok) { showFeedback(result.message); return; }
    state.answers[step] = state.answers[step].trim(); state.completed[step] = true;
    save(); renderInspiration(true); playMelody(step === 4); showFeedback(STEPS[step].success, true);
  } }, step === 0 ? punctuationField() : step === 4 ? reflectionField() : lineField(step),
  el('button', { type: 'submit', className: 'primary-button submit-answer' }, state.completed[step] ? 'Devam Et' : step === 4 ? 'Seçimimi paylaş' : 'Gönder'));
  panel.append(el('div', { className: `panel-body${step === 0 ? ' with-poem' : ''}${step === 4 ? ' with-reflection' : ''}` }, story, form));
}

function advance() {
  if (!state.completed[state.step]) return;
  if (state.step === 4) state.screen = 'finish';
  else { state.step++; if (state.step === 2 && !state.answers[2]) state.answers[2] = state.answers[1]; }
  save(); render(); focusPaper();
}

function renderFinish() {
  panel.append(heading('Miras Atölyesi açıldı!'));
  panel.append(el('div', { className: 'final-body' }, el('div', {}, el('p', { className: 'final-motto' }, 'Köklerin sesi geleceğe ulaştı.'),
    el('p', {}, `Eline, diline sağlık ${state.name}! Dizelerinle ustaların emeğini geleceğe taşıdın.`),
    el('button', { type: 'button', className: 'primary-button replay-button', onClick: () => { state = initialState(); save(); render(); askName(); } }, 'Tekrar Oyna')),
    el('blockquote', { className: 'final-verse' }, state.answers[2], el('br'), state.answers[3])));
}

function focusPaper() { parchment.scrollTop = 0; parchment.focus({ preventScroll: true }); }

function renderArtwork() {
  const intro = state.screen === 'intro';
  const active = intro ? 'intro' : 'game';
  for (const key of ['intro', 'game']) document.querySelector(`#${key}-art`).hidden = key !== active || !artwork[key];
  document.querySelector('.scene-fallback').hidden = artwork[active];
  hotspots.forEach(button => { button.hidden = !intro; button.classList.toggle('has-art', artwork.intro); });
  stage.dataset.artwork = artwork[active] ? active : 'missing';
}

function render() {
  panel.replaceChildren(); stage.dataset.screen = state.screen;
  parchment.hidden = state.screen === 'intro'; inspiration.hidden = state.screen === 'intro';
  renderArtwork(); renderInspiration();
  if (state.screen === 'game') renderGame();
  if (state.screen === 'finish') renderFinish();
  renderNotices();
}

async function loadArtwork() {
  try {
    const embedded = document.querySelector('#embedded-assets');
    let manifest;
    if (embedded) manifest = JSON.parse(embedded.textContent);
    else { const response = await fetch(new URL('../assets/images.json', import.meta.url)); if (!response.ok) throw new Error('Görsel listesi yüklenemedi.'); manifest = await response.json(); }
    await Promise.all(['intro', 'game'].map(async key => {
      let filename = manifest[key];
      if (!embedded && filename === null) filename = key === 'intro' ? 'giris.png' : 'giris_sonrasi.png';
      if (typeof filename !== 'string') return;
      const embeddedImage = embedded && /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(filename);
      if (!embeddedImage && (embedded || !/^[\p{L}\p{N}_ .-]+\.(png|jpe?g|webp)$/iu.test(filename))) return;
      const img = document.querySelector(`#${key}-art`);
      img.src = embeddedImage ? filename : new URL(`../assets/${encodeURIComponent(filename)}`, import.meta.url).href;
      try { await img.decode(); artwork[key] = true; } catch { artwork[key] = false; }
    }));
  } catch { /* Original images remain missing; no alternative illustration is generated. */ }
  finally { assetsLoaded = true; renderArtwork(); renderNotices(); }
}

render(); loadArtwork();
