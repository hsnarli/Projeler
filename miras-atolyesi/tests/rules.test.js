import test from 'node:test';
import assert from 'node:assert/strict';
import { ORIGINAL_POEM, CORRECTED_EXAMPLE, REFLECTIONS } from '../src/content.js';
import { validateName, validateStep } from '../src/rules.js';

test('Türkçe adlar, takma adlar ve birden fazla sözcüklü adlar kabul edilir', () => {
  assert.deepEqual(validateName('  Işıl   Öztürk '), { ok: true, name: 'Işıl Öztürk' });
  assert.equal(validateName('Çağrı').ok, true);
});
test('Boş, çok kısa, çok uzun veya HTML içeren adlar kabul edilmez', () => {
  for (const value of ['', 'A', 'A'.repeat(31), '<img src=x onerror=alert(1)>']) assert.equal(validateName(value).ok, false);
});
test('Eksik işaretler bulunan kaynak dörtlük tamamlanmış sayılmaz', () => {
  assert.equal(validateStep(0, ORIGINAL_POEM).ok, false);
});
test('Düzeltilmiş dörtlük kabul edilir', () => {
  assert.equal(validateStep(0, CORRECTED_EXAMPLE).ok, true);
});
test('Kesme işareti ve ah sonrasındaki işaret birbirinden bağımsız kontrol edilir', () => {
  assert.equal(validateStep(0, CORRECTED_EXAMPLE.replace("Anadolu'm", 'Anadolum')).ok, false);
  assert.equal(validateStep(0, CORRECTED_EXAMPLE.replace('ah,', 'ah')).ok, false);
});
test('Kıvrımlı kesme işareti ve ünlem de kabul edilir', () => {
  for (const apostrophe of ['’', '‘', 'ʼ']) assert.equal(validateStep(0, CORRECTED_EXAMPLE.replace("'", apostrophe).replace('ah,', 'ah!')).ok, true);
});
test('Noktalama görevi dize veya sözcük silinerek geçilemez', () => {
  assert.equal(validateStep(0, CORRECTED_EXAMPLE.split('\n').slice(1).join('\n')).ok, false);
  assert.equal(validateStep(0, CORRECTED_EXAMPLE.replace('Ustalık sırrını', 'Sırrı')).ok, false);
});
test('Yaratıcı dizede istenen sözcük bulunmalıdır', () => {
  assert.equal(validateStep(1, 'Atölyede nice güzel renkler bulduk.').ok, false);
  assert.equal(validateStep(1, 'Sanat ile bir güneş olduk.').ok, true);
});
test('Türkçe büyük harfler ve çekimli ışık sözcüğü desteklenir', () => {
  assert.equal(validateStep(1, 'IŞIK İLE SANATA YOL BULDUK.').ok, true);
  assert.equal(validateStep(1, 'Sanatın ışığı bize umut oldu.').ok, true);
});
test('İstenen sözcüğün başka bir sözcüğün içinde rastlantıyla geçmesi yeterli değildir', () => {
  assert.equal(validateStep(1, 'Alışık olduğum resimleri yine çizdim.').ok, false);
});
test('Yalnızca anahtar sözcük yazmak yeterli değildir', () => {
  assert.equal(validateStep(1, 'güneş').ok, false);
});
test('Öz yansıtmada küçük harf ve eksik son işaret ayrı ayrı yakalanır', () => {
  assert.equal(validateStep(2, 'karanlık günlere bir güneş olduk.').ok, false);
  assert.equal(validateStep(2, 'Karanlık günlere bir güneş olduk').ok, false);
  assert.equal(validateStep(2, 'Karanlık günlere bir güneş olduk.').ok, true);
});
test('Zaten doğru yazılmış dize değişiklik yapmadan onaylanabilir', () => {
  const line = 'Sanat ile bir güneş olduk!';
  assert.equal(validateStep(1, line).ok, true);
  assert.equal(validateStep(2, line).ok, true);
});
test('Tırnak içinde cümle ve farklı son işaretleri kabul edilir', () => {
  for (const ending of ['.', '?', '!', '…', '...']) assert.equal(validateStep(2, `“Sanat ile bir güneş olduk${ending}”`).ok, true);
});
test('Son cümlede öğrencinin adı ve ustaların emeği bulunur', () => {
  assert.equal(validateStep(3, 'Ali der ki ustalarım sağ olsun, bu atölye umutla dolsun.', 'Ali').ok, true);
  assert.equal(validateStep(3, 'Ustalarım sağ olsun, bu atölye umutla dolsun.', 'Ali').ok, false);
  assert.equal(validateStep(3, 'Ali der ki atölyemiz hep umutla dolsun.', 'Ali').ok, false);
});
test('Ad için Türkçe harf karşılaştırması yapılır, başka sözcüğün içindeki ad sayılmaz', () => {
  assert.equal(validateStep(3, 'ışıl der ki ustalarım sağ olsun.', 'Işıl').ok, true);
  assert.equal(validateStep(3, 'Hayali ustalarım için bir türkü olsun.', 'Ali').ok, false);
});
test('Ustaların üçü de adıyla anılabilir', () => {
  assert.equal(validateStep(3, 'Ali der ki mimar, hayalî ve ebruzen emeklerinizle yaşayın.', 'Ali').ok, true);
});
test('Öz değerlendirme seçeneklerinin hepsi kabul edilir, hiçbiri yanlış sayılmaz', () => {
  for (const option of REFLECTIONS) assert.equal(validateStep(4, option.id).ok, true);
  assert.equal(validateStep(4, '').ok, false);
  assert.equal(validateStep(4, 'bilinmeyen').ok, false);
});
test('Boş veya aşırı uzun cevaplarla aşamalar atlanamaz', () => {
  for (let step = 0; step < 4; step++) {
    assert.equal(validateStep(step, '   ', 'Ali').ok, false);
    assert.equal(validateStep(step, 'güneş '.repeat(150), 'Ali').ok, false);
  }
});
