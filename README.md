# Projeler

[Miras Atölyesi · Teldeki Sevda](miras-atolyesi/README.md) oyununun bütün kaynakları **miras-atolyesi/** klasöründedir. Bu klasör, önceki oyun dosyaları korunarak hazırlanmıştır.

Oyunu çalıştırmak için:

```sh
python3 miras-atolyesi/scripts/serve.py
```

Python 3.10+ yeterlidir; paket kurulumu gerekmez. Node.js varsa `npm start` da kullanılabilir. Varsayılan port 4173'tür; `--port 8080` ile değiştirilebilir. Kaynaklar güncellendiğinde sunucu başlangıçta tek dosyalık oyun girişini yeniden oluşturur.

**index.html**, önizleme araçları için CSS ve JavaScript'i içinde taşıyan oyun çıktısıdır. Oyun klasöründeki index.html ile aynıdır; doğrudan yerel tarayıcıda da açılabilir. Depo kökündeki kopyayı yenilemek için `python3 miras-atolyesi/scripts/build.py --repo-entry` çalıştırın. HTML/CSS/JS kaynaklarının tümü oyun klasöründe ayrıca saklanır.

**Özgün giriş ve giriş sonrası görselleri henüz eklenmemiştir.** Alternatif karakter veya sahne tasarımı kullanılmaz. İki orijinal görsel dosyası gereklidir; [bağlama yönergeleri](miras-atolyesi/assets/README.md).

[ZIP paketini indir](downloads/miras-atolyesi.zip) · [Test sonuçları](miras-atolyesi/docs/TEST-SONUCLARI.md)
