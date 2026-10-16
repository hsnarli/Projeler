export const ORIGINAL_POEM = `Şu ulu çınarın dalları serin
Anadolum, yurdum benim her şeyim
Ustalık sırrını ah kime vereyim
Gönülden gönüle akar giderim`;

export const CORRECTED_EXAMPLE = `Şu ulu çınarın dalları serin.
Anadolu'm, yurdum benim her şeyim.
Ustalık sırrını ah, kime vereyim?
Gönülden gönüle akar giderim.`;

export const REFLECTIONS = [
  { id: 'rhyme', label: 'Kafiye bulmak', text: 'Kafiye bulurken zorlandım ama kelime dağarcığımı geliştirdim.' },
  { id: 'punctuation', label: 'Noktalama işaretleri', text: 'Duygularımı kelimelere dökmek kolaydı fakat noktalama işaretlerini unuttum; buna dikkat etmeliyim.' },
  { id: 'words', label: 'Sözcükleri dizeye katmak', text: 'İstenen kelimeleri cümleye katmak yaratıcılığımı zorladı; farklı bağlamlar kurmayı öğrendim.' },
];

export const STEPS = [
  {
    title: "Ozan’ın defteri",
    skill: 'Yazım ve noktalama',
    prompt: 'Evlat, defterimde iki işaret eksik. Anadolu ile “m” arasındaki ve “ah”tan sonraki kutulara dokun. Uygun işareti seç veya klavyeden yaz.',
    label: 'Dörtlükteki eksik işaretleri tamamla',
    hint: 'Özel ada gelen iyelik eki kesme işaretiyle ayrılır. Duygu bildiren “ah” sözünden sonra virgül veya ünlem kullanılabilir.',
    success: 'Kesme işareti ve “ah”tan sonraki işaret yerini buldu. İlk telimiz ses verdi!',
  },
  {
    title: 'Türküye bir dize kat',
    skill: 'Yaratıcı yazma',
    prompt: '“Mermerleri yonttuk, kemerler kurduk, / Renkleri suyun üzerinde bulduk…” Şimdi sen de içinde “ışık” veya “güneş” geçen, sanatı öven özgün bir dize yaz. Yalnızca tek satır kullan.',
    label: 'Senin özgün dizen',
    hint: 'Sanatın hayatımıza kattığı güzelliği düşün. Dizen, önceki dizelerin “-duk” sesine uyabilir; kafiye bir öneridir.',
    success: 'İstenen sözcük dizende yerini buldu. Şimdi yazdığını birlikte gözden geçirelim.',
  },
  {
    title: 'Dizene yeniden bak',
    skill: 'Öz yansıtma',
    prompt: 'Kalemin çok kuvvetli evlat! Şimdi kendi dizeni oku: İlk harfi büyük mü, sonunda uygun bir noktalama işareti var mı? Gerekiyorsa düzelt; zaten uygunsa olduğu gibi onaylayabilirsin.',
    label: 'Kendi dizeni gözden geçir ve düzenle',
    hint: 'Cümle büyük harfle başlar; nokta, soru işareti, ünlem veya üç nokta ile tamamlanabilir. Yeni bir dize aramak yerine kendi yazdığına dön.',
    success: 'Dizen büyük harfle başlıyor ve uygun bir işaretle tamamlanıyor. Kendi yazını özenle gözden geçirdin.',
  },
  {
    title: 'Söz sende, çırak',
    skill: 'İçerik ve yapı',
    prompt: 'Türkünün son sözünü sen söyle! Mimarın, Hayalî Usta’nın ve Ebruzen’in emeğini anlatan, içinde kendi adının da geçtiği bir veda cümlesi yaz. Ustalara birlikte seslenebilirsin.',
    label: 'Adının da geçtiği veda cümlen',
    hint: '“[Adın] der ki…” diye başlayabilir, ustalara emekleri için teşekkür edebilir ya da atölyenin geleceğine ilişkin bir dilek söyleyebilirsin.',
    success: 'Adın ve ustaların emeği finalde buluştu. Şimdi bu yazma yolculuğunda kendine bir bakalım.',
  },
  {
    title: 'Bu yolculuk sana ne öğretti?',
    skill: 'Kendini değerlendirme',
    prompt: 'Türküyü yazarken en çok hangi konuda zorlandın? Kendine en yakın seçeneği işaretle. Burada yanlış cevap yok.',
    label: 'Yazma deneyimini en iyi anlatan seçeneği seç',
    hint: 'Kendini değerlendirmen, bir sonraki yazında neye dikkat edeceğini keşfetmene yardımcı olur. Her seçenek değerlidir.',
    success: 'Deneyimini düşündün ve kendini ifade ettin. Son tel de titreşti; türkümüz tamamlandı!',
  },
];
