# Oyun görselleri

Sohbette görünen görsel, indirilebilir bir görsel dosyası olarak çalışma alanına ulaşmadığı için burada kopyası bulunmuyor. Özgün görsellerin yerine yeni bir görsel üretilmedi.

`giris` ve `giris_sonrasi` görsellerini bu klasöre yerleştirin. Ardından `images.json` içindeki `intro` ve `game` alanlarına dosya adlarını yazın. Örneğin:

```json
{
  "intro": "giris.png",
  "game": "giris_sonrasi.png"
}
```

PNG, JPEG ve WebP dosyaları kullanılabilir. Dosyaları ekledikten sonra oyun klasöründe `python3 scripts/build.py` çalıştırın. Depo kökündeki önizlemeyi de güncellemek için depo kökünden `python3 miras-atolyesi/scripts/build.py --repo-entry` çalıştırın. Tanımlanmış ama bulunamayan bir dosya derlemeyi durdurur; sessizce atlanmaz.

Görseller değiştirilmeden, aynı baytlarla HTML içine gömülür; dış hizmete gönderilmez. Girişte `intro`, Oyna düğmesinden sonra `game` kullanılır. Eksik görsellerin yerine alternatif sahne veya karakter çizimi üretilmez. Şimdilik sahne nötr bırakılır ve parşömenin içinde açık bir eksik görsel uyarısı gösterilir.

Yerleşim, paylaşılan 1672 × 941 görselin oranına göre hazırlanmıştır. Soru, giriş alanı, cevap, uyarı, ilham göstergesi ve ayarlar parşömenin içinde kalır. Sahne kırpılmaz. Dar ekranlarda parşömen aşağı doğru uzar; sahnenin üzerine taşmaz. Girişteki Oyna düğmesinin tıklama alanı görseldeki sol üst düğmeyle hizalanır.
