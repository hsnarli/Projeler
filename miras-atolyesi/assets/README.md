# Oyun görselleri

Sohbette görünen görsel, indirilebilir bir görsel dosyası olarak çalışma alanına ulaşmadığı için burada kopyası bulunmuyor. Özgün görsellerin yerine yeni bir görsel üretilmedi.

Özgün dosyaları **giris.png** ve **giris_sonrasi.png** adlarıyla bu klasöre yerleştirin. Bu iki standart dosya adı artık otomatik bulunur; `images.json` düzenlemek gerekmez. Farklı dosya adı veya JPG/WebP kullanılıyorsa `images.json` içindeki `intro` ve `game` alanlarına gerçek dosya adlarını yazın. Örneğin:

```json
{
  "intro": "giris.png",
  "game": "giris_sonrasi.png"
}
```

PNG, JPEG ve WebP dosyaları kullanılabilir. Dosyaları ekledikten sonra oyun klasöründe `python3 scripts/build.py` çalıştırın. Depo kökündeki önizlemeyi de güncellemek için depo kökünden `python3 miras-atolyesi/scripts/build.py --repo-entry` çalıştırın. Tanımlanmış ama bulunamayan bir dosya derlemeyi durdurur; sessizce atlanmaz.

Görseller değiştirilmeden, aynı baytlarla HTML içine gömülür; dış hizmete gönderilmez. Girişte `intro`, Oyna düğmesinden sonra `game` kullanılır. Eksik görsellerin yerine alternatif sahne veya karakter çizimi üretilmez. Şimdilik sahne nötr bırakılır ve parşömenin içinde açık bir eksik görsel uyarısı gösterilir.

Yerleşim, yeni paylaşılan 1672 × 941 oyun görseline göre hazırlanmıştır: büyük parşömen yaklaşık %64,6 yüksekliğinde başlar. Sorular %66,7 hizasından sonra, güvenli iç alanda yer alır. Sahne kırpılmaz. Küçük ekranlarda parşömen aşağı doğru uzar ve metin okunur boyutta kalır.

Girişte HTML açıklaması veya isim alanı görsele eklenmez. Sol üstteki Oyna ve sağ alttaki Devam Et çizimlerinin üzerinde şeffaf, klavyeyle erişilen tıklama alanları vardır. İkisi de isim penceresini açar. İlham telleri yalnızca oyun başladıktan sonra sağ üstte gösterilir. İsim ve yanıt geri bildirimleri ekranın ortasında açılan pencerelerdedir. Parşömen üzerinde ayarlar/ses düğmeleri bulunmaz.
