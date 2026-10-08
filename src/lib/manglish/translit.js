// Malayalam script -> Manglish (the way people type Malayalam in WhatsApp).
// Speech-to-text gives Malayalam script with English words left in Latin
// ("നാളെ 5 manikku meeting ഉണ്ട്"); everything after this step works on one
// romanised form, so the lexicon only needs Latin spellings.

const VOWELS = {
  'അ': 'a', 'ആ': 'aa', 'ഇ': 'i', 'ഈ': 'ee', 'ഉ': 'u', 'ഊ': 'oo', 'ഋ': 'ru',
  'എ': 'e', 'ഏ': 'e', 'ഐ': 'ai', 'ഒ': 'o', 'ഓ': 'o', 'ഔ': 'au',
};
const SIGNS = {
  'ാ': 'aa', 'ി': 'i', 'ീ': 'ee', 'ു': 'u', 'ൂ': 'oo', 'ൃ': 'ru',
  'െ': 'e', 'േ': 'e', 'ൈ': 'ai', 'ൊ': 'o', 'ോ': 'o', 'ൌ': 'au', 'ൗ': 'au',
};
const CONSONANTS = {
  'ക': 'k', 'ഖ': 'kh', 'ഗ': 'g', 'ഘ': 'gh', 'ങ': 'ng',
  'ച': 'ch', 'ഛ': 'chh', 'ജ': 'j', 'ഝ': 'jh', 'ഞ': 'nj',
  'ട': 't', 'ഠ': 'th', 'ഡ': 'd', 'ഢ': 'dh', 'ണ': 'n',
  'ത': 'th', 'ഥ': 'th', 'ദ': 'd', 'ധ': 'dh', 'ന': 'n',
  'പ': 'p', 'ഫ': 'f', 'ബ': 'b', 'ഭ': 'bh', 'മ': 'm',
  'യ': 'y', 'ര': 'r', 'ല': 'l', 'വ': 'v', 'ശ': 'sh', 'ഷ': 'sh', 'സ': 's', 'ഹ': 'h',
  'ള': 'l', 'ഴ': 'zh', 'റ': 'r', 'ഺ': 't',
};
const CHILLU = { 'ൺ': 'n', 'ൻ': 'n', 'ർ': 'r', 'ൽ': 'l', 'ൾ': 'l', 'ൿ': 'k', 'ൔ': 'm', 'ൕ': 'y', 'ൖ': 'zh' };
const VIRAMA = '്';
const ZW = /[‌‍]/;
const DIGITS = '൦൧൨൩൪൫൬൭൮൯';

// Conjuncts whose sound isn't the sum of their parts, spelled the way Manglish
// writes them: രണ്ട് = randu, എന്റെ = ente, പറ്റും = pattum, പത്ത് = pathu.
const CONJUNCTS = {
  'ണ്ട': 'nd', 'ന്റ': 'nt', 'റ്റ': 'tt', 'ട്ട': 'tt', 'ത്ത': 'th', 'ങ്ങ': 'ng', 'ഞ്ഞ': 'nj', 'ച്ച': 'ch',
  'ഞ്ച': 'nch', 'ങ്ക': 'nk', 'ക്ഷ': 'ksh', 'മ്പ': 'mb', 'ന്ത': 'nth', 'ന്ദ': 'nd', 'ണ്ണ': 'nn',
};

export const hasMalayalam = s => /[ഀ-ൿ]/.test(s);

export function transliterate(text) {
  if (!hasMalayalam(text)) return text;
  let out = '';
  const chars = [...text.normalize('NFC')];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    let sound = CONSONANTS[c];
    const conj = c + (chars[i + 1] ?? '') + (chars[i + 2] ?? '');
    if (CONJUNCTS[conj]) { sound = CONJUNCTS[conj]; i += 2; }
    const next = chars[i + 1];
    // a single ട between vowels is said, and typed, as "d": പൊടി = podi, കട = kada
    if (c === 'ട' && sound === 't' && /[aeiou]$/.test(out)) sound = 'd';
    if (sound) {
      out += sound;
      if (SIGNS[next]) { out += SIGNS[next]; i++; }
      else if (next === VIRAMA) {
        const after = chars[i + 2];
        if (after && ZW.test(after)) { i += 2; }               // old-style chillu: ന്‍
        else if (after && CONSONANTS[after]) { i++; }          // conjunct, no vowel
        else { out += 'u'; i++; }                             // word-final: half-u (samvruthokaram)
      } else out += 'a';
    } else if (VOWELS[c]) out += VOWELS[c];
    else if (CHILLU[c]) out += CHILLU[c];
    else if (c === 'ം') out += /[കഖഗഘ]/.test(next ?? '') ? 'n' : 'm';   // മീറ്റിംഗ് = meeting
    else if (c === 'ഃ') out += 'h';
    else if (SIGNS[c] || c === VIRAMA || ZW.test(c)) { /* stray sign: drop */ }
    else if (DIGITS.includes(c)) out += String(DIGITS.indexOf(c));
    else if (/[\p{L}\p{N}]/u.test(c)) out += c;
    else out += c;
  }
  return out;
}
