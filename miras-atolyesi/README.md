# Miras Atölyesi · Teldeki Sevda

Paylaşılan 7. sınıf Türkçe senaryosundaki beş aşamalı yazma oyunu. Mevcut oyun kaynakları geliştirilmiştir; yeni bir proje veya farklı sanat tasarımı oluşturulmamıştır.

## Çalıştırma

Depo veya ZIP'in ana klasöründe:

```sh
python3 miras-atolyesi/scripts/serve.py
```

Python 3.10+ yeterlidir. Oyun için paket kurulumu, veritabanı, gizli anahtar veya internet gerekmez. Varsayılan port **4173**, bağlama **0.0.0.0**'dır. Başka port: `--port 8080`. `--host` / `--bind` seçeneği ve `PORT` değişkeni desteklenir. Windows'ta gerekirse `python3` yerine `py` kullanın. Sunucuyu Ctrl+C ile durdurabilirsiniz.

Sunucu başlangıçta kaynaklardan **index.html** üretir. CSS, JavaScript, Türkçe sözcük kökleri ve mevcut özgün görseller bu HTML içine gömülür. Çok dosyalı kaynak şablonu `index.template.html` dosyasıdır. Kaynak değişikliklerinden sonra sunucuyu yeniden başlatın veya depo kökünde şu komutu çalıştırın:

```sh
python3 miras-atolyesi/scripts/build.py --repo-entry
```

Bu komut oyun klasörü ve depo kökündeki önizleme HTML'lerini birlikte yeniler. Node.js varsa `npm start`, `npm run build` ve `npm test` eşdeğer kısa yollardır; `npm install` gerekmez.

## Görseller

Özgün **giris.png** ve **giris_sonrasi.png** dosyalarını `miras-atolyesi/assets/` klasörüne koyun. Bu adlar otomatik bulunur. Ardından yeniden derleyin veya sunucuyu yeniden başlatın. Farklı uzantılar/adlar için [görsel yönergelerine](assets/README.md) bakın.

**Şu anda indirilebilir özgün PNG dosyaları çalışma alanında yoktur.** Sohbetteki yeni görsellerin 1672 × 941 oranı ve büyütülen parşömen sınırları yerleşimde dikkate alınmıştır. Orijinal dosyalar yerine farklı karakter veya sahne çizilmemiştir. Gerçek dosyalar eklenene kadar üst sahne nötr görünür; son görsel doğrulama bekler.

## Güncel akış

1. Girişte yalnızca özgün görsel görünür. Görseldeki **Oyna** veya **Devam Et** alanı isim penceresini açar; alttaki hazır metnin üzerine yeni HTML metni eklenmez.
2. İsim, ekranın ortasındaki pencerede yazılır. **Başla** ile ilk soruya geçilir. Mevcut oyuncunun ilerlemesi korunur; farklı bir adla başlanırsa yeni oyun açılır.
3. İlk soruda dört dize sabittir. Yalnızca **Anadolu / m** arasındaki ve **ah** sonrasındaki iki kutu düzenlenebilir. Kutudan işaret seçilebilir veya klavyeyle tek işaret girilebilir. Ok tuşları ve Enter da seçenekleri kullanır.
4. Oyuncu **ışık** veya **güneş** geçen özgün dizesini **tek satırlık** alanda yazar. Birden çok satır yapıştırılamaz. Dize en fazla 120 karakterdir.
5. Öz yansıtmada aynı dize aynen geri gelir. Büyük başlangıç harfi ve son noktalama işareti kontrol edilir; zaten doğru metni değiştirmek gerekmez.
6. En fazla 160 karakterlik veda cümlesinde oyuncunun adı ve ustaların emeği bulunur.
7. Öz değerlendirmede üç seçeneğin tamamı kabul edilir; yanlış cevap yoktur.
8. Yanıt geri bildirimleri ortadaki animasyonlu pencerede gösterilir. **Tekrar Dene** yanıtı korur; **Devam Et** sonraki aşamaya geçer. Finalde yalnızca **Tekrar Oyna** düğmesi vardır; türkü indirme seçeneği kaldırılmıştır.

İlham telleri parşömende değil, görselin sağ üstündedir. Başarıyla dolan beş nota ışıldar ve kısa bir hareket yapar. Parşömende ayar veya ses düğmesi bulunmaz. Hafif tel sesleri yalnızca kullanıcı etkileşiminden sonra çalınır.

## Duyarlı yerleşim ve erişilebilirlik

Sahne kırpılmaz. Geniş ekranlarda sorular yeni parşömenin güvenli iç alanına yerleşir. Tablet/telefon ekranlarında parşömen aşağı doğru uzar, içerik okunur boyutta kalır. Yatay sayfa taşması engellenir. İsim/uyarı pencereleri ekranın ortasında kalır; küçük ekran ve sanal klavye için azami yükseklikleri sınırlıdır, gerektiğinde kendi içlerinde kayarlar. Klavyeyle erişim, alan etiketleri, yerel dialog odak yönetimi ve azaltılmış hareket tercihi desteklenir.

İlerleme yalnızca bu tarayıcıdaki localStorage alanında tutulur. Girdiler sunucuya veya harici hizmete gönderilmez. Depolama kapalıysa oyun çalışır ve kayıt uyarısı gösterilir.

## Metin denetimi

`asdfasf`, `rrepj` gibi tuş dizileri, tanınmayan sözcükler, uygunsuz ifadeler ve bazı harf/rakam/ayraç gizlemeleri denetlenir. Türkçe sözcük kökleri ve yaygın ekler çevrimdışı kontrol edilir. Oyuncunun kendi adı ayrıca kabul edilir. **Işık, şık, sıkıntı, götürdü** gibi normal sözcükleri yanlışlıkla engellememek için regresyon testleri vardır.

Bu denetim cümlenin anlamını veya edebî niteliğini değerlendiren bir yapay zekâ değildir. Tam Türkçe biçimbilim çözümlemesi de değildir; nadir, yöresel veya yeni türetilen doğru sözcükleri tanımayabilir. Böyle bir durumda oyun yazımı kontrol etmeyi veya başka sözcük seçmeyi önerir. Sözcük kökleri Apache-2.0 lisanslı Zemberek sözlüğünden türetilmiştir; [kaynak ve değişiklik bildirimi](licenses/ZEMBEREK-NOTICE.md).

## Test ve paketleme

Depo kökünde:

```sh
node --test miras-atolyesi/tests/*.test.js
python3 miras-atolyesi/tests/server_smoke.py
```

Sunucu çalışırken, isteğe bağlı Playwright/Chromium testleri:

```sh
python3 miras-atolyesi/tests/browser_smoke.py
```

Sistem Chromium'u otomatik bulunur. Gerekirse `--browser` ve `--base-url` verilebilir. Güncel [test raporu](docs/TEST-SONUCLARI.md), gerçek görsellerle bekleyen doğrulamayı teknik sonuçlardan ayırır.

ZIP'i yenilemek için `python3 miras-atolyesi/scripts/package.py` çalıştırın. `downloads/miras-atolyesi.zip` kaynakları, tek dosyalık HTML'yi, belgeleri, lisansları ve testleri içerir. Git metaverisi ve önbellekler dahil edilmez; her ZIP üyesi kaynakla karşılaştırılır ve CRC kontrolü yapılır.
