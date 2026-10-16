import { TURKISH_ROOTS } from './lexicon.js';

const suffixes = new Set(('a e ı i u ü ya ye yı yi yu yü nı ni nu nü na ne ' +
  'ın in un ün nın nin nun nün im ım um üm m n ımız imiz umuz ümüz ınız iniz unuz ünüz ' +
  'sı si su sü sıyla siyle suyla süyle lar ler ları leri ların lerin ' +
  'da de ta te dan den tan ten la le yla yle ca ce ça çe ' +
  'lık lik luk lük lı li lu lü sız siz suz süz sal sel daş deş ' +
  'dı di du dü tı ti tu tü dık dik duk dük tık tik tuk tük ' +
  'mış miş muş müş mıştı mişti muştu müştü ' +
  'acak ecek acağ eceğ yacak yecek yacağ yeceğ yor ıyor iyor uyor üyor ' +
  'ar er ır ir ur ür r z maz mez ma me mak mek ması mesi ' +
  'sak sek sa se sam sem san sen salar seler ' +
  'sın sin sun sün sınız siniz sunuz sünüz ız iz uz üz k ' +
  'dır dir dur dür tır tir tur tür ' +
  'ayım eyim yayım yeyim alım elim yalım yelim ' +
  'yın yin yun yün yınız yiniz yunuz yünüz ın in un ün ' +
  'ıp ip up üp yıp yip yup yüp arak erek yarak yerek ken ' +
  'dığım diğim duğum düğüm tığım tiğim tuğum tüğüm ' +
  'dıkça dikçe dukça dükçe tıkça tikçe tukça tükçe ' +
  'abil ebil yabil yebil laş leş laştır leştir').split(/\s+/));
const suffixList = [...suffixes].sort((a, b) => b.length - a.length);
const known = new Map();
const safeWords = new Set(['şık', 'sık', 'sıkı', 'sıkça', 'sıkıntı', 'ışık', 'ışığı', 'boks', 'amca', 'siklamen', 'sikke']);
const obscene = new Set(['amk', 'aq', 'amcik', 'amina', 'aminakoyim', 'aminakoyayim', 'sik', 'siktir', 'sikik', 'sikerim', 'sikeyim', 'siktim', 'sikeyimmi', 'orospu', 'pic', 'yarrak', 'got', 'gotu', 'gotun', 'gotum', 'gotune', 'gotunden', 'gotveren', 'gavat', 'kahpe', 'pezevenk', 'ibne', 'bok', 'boktan', 'salak', 'aptal', 'gerizekali']);
const abusiveRoots = /^(?:siktir|sikik|siker|sikey|siktim|orospu|yarrak|pezevenk|gotveren|gerizekali|salak|aptal|kahpe|ibne|gavat|amci[kğg])/;
const lower = value => String(value).normalize('NFC').toLocaleLowerCase('tr-TR');
const fold = value => lower(value).replace(/[çğıöşüâîû]/g, char => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' })[char]).replace(/[013457@$]/g, char => ({ 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', '$': 's' })[char]);
const tokens = value => lower(value).match(/[\p{L}\p{N}@$]+(?:['’][\p{L}]+)*/gu) || [];

export function hasProfanity(value) {
  const parts = tokens(value);
  for (const part of parts) {
    if (safeWords.has(part) || /^(?:sıkınt|şık|sıkı|sıkça)/.test(part)) continue;
    const cleaned = fold(part).replace(/['’]/g, '');
    if (obscene.has(cleaned) || /^(?:sikim|sikin|piclik|picler)/.test(cleaned) || abusiveRoots.test(cleaned)) return true;
  }
  // Catch separated abbreviations without searching inside ordinary words.
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].length !== 1) continue;
    let joined = '';
    for (let j = i; j < Math.min(i + 12, parts.length) && parts[j].length === 1; j++) {
      joined += fold(parts[j]);
      if (joined.length >= 3 && obscene.has(joined)) return true;
    }
  }
  return false;
}

export function looksRandom(value) {
  const word = lower(value).replace(/['’]/g, '');
  return /(?:asdf|qwer|zxcv|hjkl|rrepj)/.test(word) || /[qwx]/.test(word) ||
    /(.)\1{2}/u.test(word) || (word.length > 2 && !/[aeıioöuüâîû]/.test(word));
}

function validSuffix(tail, depth = 0, memo = new Map()) {
  if (!tail) return true;
  if (depth > 7) return false;
  const key = `${tail}:${depth}`;
  if (memo.has(key)) return memo.get(key);
  const result = suffixList.some(suffix => tail.startsWith(suffix) && validSuffix(tail.slice(suffix.length), depth + 1, memo));
  memo.set(key, result);
  return result;
}

export function isTurkishWord(value) {
  const word = lower(value);
  if (known.has(word)) return known.get(word);
  if (TURKISH_ROOTS.has(word)) return true;
  let result = false;
  for (let end = word.length - 1; end >= 2; end--) {
    if (TURKISH_ROOTS.has(word.slice(0, end)) && validSuffix(word.slice(end))) { result = true; break; }
  }
  known.set(word, result);
  return result;
}

export function validateWriting(value, playerName = '') {
  if (hasProfanity(value)) return { ok: false, message: 'Bu atölyede saygılı ve güzel sözler kullanıyoruz. Cümleni uygun sözcüklerle yeniden yazalım.' };
  if (/[\r\n]/.test(value)) return { ok: false, message: 'Bu görevde yalnızca tek bir dize yazabilirsin. Metnini tek satır hâlinde düzenle.' };
  const names = new Set(tokens(playerName));
  const parts = tokens(value);
  for (const part of parts) {
    const [base, ending] = part.split(/['’]/);
    if (looksRandom(base) || /\d/.test(base)) return { ok: false, message: `“${part}” sözcüğünün harfleri karışmış olabilir. Anlamlı bir Türkçe sözcük yazarak yeniden dene.` };
    if (names.has(base) && (!ending || validSuffix(ending))) continue;
    if (isTurkishWord(base) && (!ending || validSuffix(ending))) continue;
    return { ok: false, message: `“${part}” sözcüğünü tanıyamadım. Yazımını kontrol edebilir veya başka bir sözcük seçebilirsin.` };
  }
  return { ok: true };
}
