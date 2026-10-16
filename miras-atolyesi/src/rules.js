import { ORIGINAL_POEM, REFLECTIONS } from './content.js';

export const normalize = (text) => String(text).normalize('NFC').toLocaleLowerCase('tr-TR');
const words = (text) => normalize(text).match(/\p{L}+/gu) || [];
const wordCount = (text) => words(text).length;
const unpunctuated = (text) => normalize(text).replace(/['’‘ʼ]/gu, '').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
const hasTheme = (text) => words(text).some(word => /^(ışık|ışığ|güneş)/u.test(word));
const invalid = (message) => ({ ok: false, message });
const valid = () => ({ ok: true });

export function validateName(value) {
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 30 || !/^[\p{L}][\p{L}\s’'.-]*$/u.test(name)) {
    return invalid('Sana nasıl seslenelim? 2–30 karakterlik bir ad ya da takma ad yaz.');
  }
  return { ok: true, name };
}

export function validateStep(step, value, playerName = '') {
  const text = String(value).trim();
  if (step === 4) {
    return REFLECTIONS.some(option => option.id === value) ? valid() : invalid('Sana en yakın seçeneği işaretle. Burada yanlış cevap yok.');
  }
  if (!text) return invalid('Kalem sırası sende. Önce parşömene yanıtını yaz, sonra birlikte bakalım.');
  if (text.length > 600) return invalid('Bu parşömene en fazla 600 karakter sığıyor. Metnini biraz kısaltıp yeniden okuyabilir misin?');
  if (step === 0) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const originals = ORIGINAL_POEM.split('\n');
    if (lines.length !== 4 || lines.some((line, i) => unpunctuated(line) !== unpunctuated(originals[i]))) {
      return invalid('Ozanın dört dizesini ve sözcüklerini koru; yalnızca noktalama işaretlerini tamamlamayı dene.');
    }
    if (!/anadolu['’‘ʼ]m/u.test(normalize(lines[1]))) {
      return invalid('İkinci dizeye yeniden bak: Anadolu özel adına gelen “m” ekini hangi işaret ayırmalı?');
    }
    if (!/(?:^|\s)ah\s*[,!]/u.test(normalize(lines[2]))) {
      return invalid('Üçüncü dizedeki “ah” bir duygu bildiriyor. Hemen sonrasına virgül ya da ünlem eklemeyi dene.');
    }
    return valid();
  }
  if (step === 1 || step === 2) {
    if (!hasTheme(text)) return invalid('Dizeni yeniden oku: İçinde “ışık” veya “güneş” sözcüklerinden biri yer almalı.');
    if (wordCount(text) < 4) return invalid('Düşünceni biraz açabilir misin? En az dört sözcükle bir dize oluşturmayı dene.');
    if (step === 2) {
      const first = text.replace(/^[“"«‘'(\[\s]+/u, '').charAt(0);
      if (!/\p{Lu}/u.test(first)) return invalid('Dizenin ilk harfine bir daha bak. Cümleye büyük harfle başlamayı dene.');
      if (!/[.!?…][”"»’')\]]*$/u.test(text)) return invalid('Dizenin sonuna bak: Anlamına uygun bir noktalama işareti eklemeyi dene.');
    }
    return valid();
  }
  if (step === 3) {
    const textWords = words(text);
    const nameWords = words(playerName);
    const nameAppears = nameWords.length > 0 && textWords.some((_, i) => nameWords.every((word, j) => textWords[i + j] === word));
    if (!nameAppears) return invalid('Bu finalde senin de imzan olsun. Oyuna başlarken yazdığın adını cümlene ekler misin?');
    if (wordCount(text) < 5) return invalid('Vedanı biraz geliştirebilir misin? Adınla birlikte ustaların emeğini anlatan bir cümle kur.');
    const mentionsMasters = textWords.some(word => word.startsWith('usta'));
    const mentionsAll = ['mimar', 'hayal', 'ebru'].every(root => textWords.some(word => word.startsWith(root)));
    if (!mentionsMasters && !mentionsAll) return invalid('Mimarın, Hayalî Usta’nın ve Ebruzen’in emeğini de hatırla. Dilersen hepsine birlikte “ustalarım” diye seslen.');
    return valid();
  }
  return invalid('Bu aşama bulunamadı.');
}
