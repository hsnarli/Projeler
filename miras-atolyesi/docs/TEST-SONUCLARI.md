# Doğrulama sonuçları — 16 Ekim 2026

Bu rapor mevcut oyun kaynaklarının düzeltilmiş sürümüne aittir. Giriş ve giriş sonrası özgün görselleri bulunmadığından **karakterlerin ve özgün sahnenin son görsel onayı beklemektedir**. Bu eksik, başarıyla tamamlanan teknik kontrollerden ayrıdır.

| Kontrol | Sonuç |
| --- | --- |
| Önceki beş aşamanın içeriği ve doğrulama kuralları | Dosya SHA-256 karşılaştırmasında değişmedi |
| HTML, CSS, JavaScript ve görsel tanımlarının denetimi | Tamamlandı; özgün iki görsel yok, `intro` ve `game` null |
| Kaynak ve depo kökündeki HTML erişimi | HTTP 200; doğru HTML içeriği |
| Üretilen HTML'nin harici CSS/JS kaynağı gereksinimi | Yok; CSS ve kod gömülü |
| Kural ve paketleme testleri | **24 geçti, 0 başarısız, 0 atlandı** |
| Masaüstü 1440 × 1000 | Beş aşama baştan sona geçti |
| Telefon 390 × 844 | Beş aşama baştan sona geçti |
| Ek boyutlar 1280 × 720, 768 × 1024, 844 × 390, 320 × 568 | Yatay taşma yok; parşömen üst sahneyi kapatmıyor |
| Tüm harici istekler engellenmiş önizleme | CSS, parşömen, giriş ve görev doğrulaması çalıştı |
| Farklı bir önizleme alt yolunda gömülü görsel geçişi | Sentetik test görselleriyle giriş → oyun geçişi geçti |
| Çok dosyalı kaynak şablonunda görsel yolları | Sentetik test görselleriyle giriş → oyun → giriş geçişi geçti |
| Öğrencinin kendi dizesinin öz yansıtma adımına taşınması | İlk metin aynen korundu; düzeltme ayrı yanıtta tutuldu |
| Yanlış/eksik girişlere geri bildirim | Beklenen uyarılar gösterildi |
| Öz değerlendirme | Üç seçeneğin tamamı kabul edildi; yanlış cevap yok |
| Yenileme, çıkış ve kaldığı yerden devam | Yanıtlar ve aşama korundu |
| Türküyü indirme | İndirilen UTF-8 metindeki öğrenci dizesi ve final doğrulandı |
| Ayarlar ve yeniden başlatma | Ses/metin ayarı ve parşömen içindeki onay çalıştı |
| Bozuk/kullanılamayan localStorage | Oyun çalışmayı sürdürdü; uygun kayıt uyarısı gösterildi |
| ZIP bütünlüğü | CRC kontrolü ve kaynak dosyalarla bayt karşılaştırması yapıldı |
| İsteğe bağlı doğrudan `file://` testi | **Atlandı:** yönetilen tarayıcı `ERR_BLOCKED_BY_ADMINISTRATOR` ile yerel dosya açmayı engelliyor |
| Özgün karakterler, sahne ve gerçek parşömen hizası | **Bekliyor:** `giris` ve `giris_sonrasi` dosyaları gerekli |

## Yapılan düzeltme

Mevcut oyun yeniden yazılmadı. Dosyalar `miras-atolyesi/` altına taşındı. Önceki `src/content.js`, `src/rules.js` ve kural testleri bayt düzeyinde aynı kaldı. `src/game.js` içindeki görsel yükleme yolu ve eksik kaynak bildirimi düzeltildi. Önceki geçici sahne çizimleri kaldırıldı; özgün görsellerin yerine yeni çizim kullanılmıyor. Parşömen yerleşimi korunuyor.

`scripts/build.py`, mevcut HTML şablonu, CSS ve JavaScript modüllerinden tek dosyalık `index.html` üretir. Tanımlanmış özgün görseller, dosyanın baytları değiştirilmeden gömülür. Böylece yalnızca HTML'yi taşıyan veya farklı bir alt yoldan sunan önizlemeler, CSS ve JS'yi ayrıca bulmak zorunda kalmaz. Eksik bir dosya adı tanımlanırsa derleme açık bir hata ile durur.

Test edilen HTTP sunucusunda eski CSS/JS yolları başlangıçta da 200 yanıtı veriyordu. Kullanıcının sağ panelindeki sayfanın önceki ağ kayıtlarına erişilemediğinden, o paneldeki eski hatanın kesin HTTP yanıtı belirlenemedi. Tek dosyalık çıktı, harici CSS/JS engellenerek ayrıca doğrulandı.

## Yeniden çalıştırma

Depo kökünde:

```sh
python3 miras-atolyesi/scripts/build.py --repo-entry
node --test miras-atolyesi/tests/*.test.js
python3 miras-atolyesi/scripts/serve.py
```

Ayrı terminalde:

```sh
python3 miras-atolyesi/tests/browser_smoke.py
```

Çok dosyalı kaynak şablonu aynı sunucudan erişilebilir olmalıdır. Oyun deposu başka bir HTTP sunucusunun alt klasöründe sunuluyorsa `--base-url` sonuna oyun klasörünün yolunu da ekleyin.

## Görsel kanıtlar

Aşağıdaki ekran görüntülerinde özgün görsel bulunmadığı için üst sahne nötrdür. Bunlar özgün sanat tasarımının tamamlandığını göstermez; parşömenin ve oyun kontrollerinin biçimli görüntülendiğini gösterir.

![Masaüstünde parşömen ve ilk görev](validation/desktop.png)

![Telefonda parşömen ve ilk görev](validation/mobile.png)
