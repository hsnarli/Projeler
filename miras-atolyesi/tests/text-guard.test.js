import test from 'node:test';
import assert from 'node:assert/strict';
import { validateName, validateStep } from '../src/rules.js';
import { hasProfanity, validateWriting } from '../src/text-guard.js';

test('rastgele tuş dizileri temaya uygun cümlede saklanamaz', () => {
  for (const word of ['asdfasf', 'rrepj', 'qwerty', 'xzytr', 'aaaaa', 'güneşasdfasf']) {
    assert.equal(validateStep(1, `Sanat ${word} ile güneş oldu.`).ok, false, word);
  }
});
test('normal Türkçe dizeler ve yaygın çekimli sözcükler kabul edilir', () => {
  for (const line of ['Karanlık günlere bir güneş olduk.', 'Sanatın ışığı bize umut oldu.', 'Güneşlerimiz güzel atölyemizi aydınlattı.', 'Ustalarımızın emekleri güneş gibi parlıyor.', 'Sanatın ışığı sıkıntımı alıp götürdü.']) {
    assert.equal(validateStep(1, line).ok, true, `${line}: ${validateStep(1, line).message}`);
  }
});
test('öğrencinin adı sözlükte olmasa da finalde kabul edilir', () => {
  assert.equal(validateStep(3, 'İlbilge der ki ustalarım sağ olsun.', 'İlbilge').ok, true);
  assert.equal(validateWriting("Ali'nin ustaları bize ışık oldu.", 'Ali').ok, true);
});
test('uygunsuz sözler, çekimleri, harf-rakam ve ayraç gizlemeleri denetlenir', () => {
  for (const word of ['siktir', 's1ktir', 'a.m.k', 'a m k', 'orospu', 'aptallar', 'salakça', 'sikim', 'piçlik']) assert.equal(hasProfanity(word), true, word);
});
test('normal sanat sözcükleri benzer harflerden dolayı engellenmez', () => {
  for (const word of ['ışık', 'IŞIK', 'şık', 'şıklar', 'sık', 'sıkı', 'sıkıntımı', 'götürdü', 'boks', 'amca', 'siklamen']) assert.equal(hasProfanity(word), false, word);
});
test('ad penceresi de rastgele ve uygunsuz girdiyi denetler', () => {
  for (const name of ['asdfasf', 'rrepj', 'salak']) assert.equal(validateName(name).ok, false);
  assert.equal(validateName('İlbilge').ok, true);
});
test('birden fazla satır ve çok uzun dizeler kabul edilmez', () => {
  assert.equal(validateStep(1, 'Sanat güneş oldu.\nUmut bize doldu.').ok, false);
  assert.equal(validateStep(1, 'Sanat güneş oldu '.repeat(12)).ok, false);
});
