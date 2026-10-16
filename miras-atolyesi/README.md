# Miras Atölyesi · Teldeki Sevda

7. sınıf Türkçe için, paylaşılan **Miras Atölyesi 4. Bölüm: Teldeki Sevda (Final)** senaryosuna dayalı tarayıcı oyunu.

## Çalıştırma

Python 3.10 veya üzeri yeterlidir. Oyun için paket kurulumu, veritabanı, API anahtarı ve internet bağlantısı gerekmez.

```sh
cd /workspace/Projeler/miras-atolyesi
python3 scripts/serve.py
```

Sunucu varsayılan olarak `4173` portunu kullanır. Başka port için `python3 scripts/serve.py --port 8080` çalıştırılabilir. Sunucuyu `Ctrl+C` ile durdurabilirsiniz. Yerel bilgisayarda tarayıcıdan bu porttaki sunucuyu açın. Sunucu, başlangıçta güncel kaynaklardan `index.html` çıktısını yeniler. Çalıştırma komutu herhangi bir çalışma dizininden tam dosya yoluyla da kullanılabilir.

Önizlemede açılacak dosya **index.html** dosyasıdır. CSS, JavaScript ve tanımlanmış özgün görseller bu dosyanın içine gömülür. Böylece alt klasör, dosya taşıma ve yalnızca HTML gösteren önizlemelerde CSS/JS yolu nedeniyle düz metin görünümü oluşmaz. `index.template.html` ise çok dosyalı kaynak şablonudur. Kaynakları değiştirdikten sonra `python3 scripts/build.py` çalıştırın veya sunucuyu yeniden başlatın. Depo kökündeki eş kopyayı yenilemek için depo kökünden `npm run build` kullanılabilir.

Üretilmiş HTML'nin harici kaynak gereksinimi yoktur. Yönetilen tarayıcılar yerel `file://` açmayı engelleyebilir; doğrulanmış çalıştırma yolu yukarıdaki HTTP sunucusudur.

Node.js varsa `npm start` da aynı sunucuyu çalıştırır. `npm install` gerekli değildir. Windows'ta Python komutu `python3` yerine `py` ise `py scripts/serve.py` kullanılabilir. Oyun standart JavaScript, HTML ve CSS kullanır; masaüstü ve mobil tarayıcılarda çalışır.

## Özgün görsellerin durumu

**Giriş ve oyun arka planı dosyaları henüz çalışma alanına ulaşmadı.** Sohbette görüntülenen görselin indirilebilir dosyası bulunmuyor. Özgün Mimar Kalfası, Hayalî Usta, Halk Ozanı, Çırak ve Ebruzen sahnesinin yerine başka bir görsel veya karakter çizilmez. Eksik görseller açıkça parşömen içinde bildirilir; üst sahne nötr bırakılır. Dosyalar geldiğinde [görsel yönergelerine](assets/README.md) göre bağlanmalıdır; görsel içeriğin son doğrulaması bu dosyalarla yapılmalıdır.

`assets/images.json` iki ayrı görsel tanımlar: `intro` girişte, `game` Oyna düğmesinden sonra kullanılır. Soru, cevap, uyarı, ayar ve ilham göstergesi yalnızca alttaki parşömen alanında görüntülenir. Üst sahneye metin penceresi açılmaz. Uzun metinlerde parşömenin içi kayar. Küçük ekranlarda sahne oranı korunur, parşömen aşağı doğru uzar.

## Oyun akışı

1. Çırak adını veya takma adını yazar. Oyna, ad girildikten sonra ilk görevi açar.
2. Ozanın dörtlüğünde `Anadolu'm` ve `ah,` / `ah!` işaretleri tamamlanır. Dört dizenin sözcükleri korunur.
3. Oyuncu `ışık` veya `güneş` geçen kendi dizesini yazar. En az dört sözcük istenir; çekimli sözcükler de tanınır.
4. Oyuncunun **kendi yazdığı dize**, değiştirilmeden öz yansıtma adımına getirilir. Büyük başlangıç harfi ve cümle sonu işareti kontrol edilir. Zaten doğru bir dizeyi değiştirmek gerekmez.
5. Oyuncu kendi adını ve ustaların emeğini içeren bir veda cümlesi yazar. Ustalara topluca seslenilebilir veya üçü de adıyla anılabilir.
6. Üç öz değerlendirme seçeneğinden biri seçilir. Hiçbir seçeneğin yanlış karşılığı yoktur.
7. Beş ilham teli dolduğunda final açılır; tamamlanan türkü UTF-8 metin dosyası olarak indirilebilir.

Denetimler metindeki yazım kuralları ve anahtar sözcükler içindir. Dizelerin sanatsal niteliğini veya anlamını otomatik puanlama iddiası yoktur. Kafiye önerilir, zorunlu tutulmaz. Geri bildirimler yeniden düşünmeyi ve düzeltmeyi destekler.

## Kullanım ve erişilebilirlik

İlerleme ve yanıtlar yalnızca kullanılan tarayıcının `localStorage` alanına kaydedilir; başka bir yere gönderilmez. Kaydetme kapalıysa oyun çalışmayı sürdürür ve bir uyarı gösterir. Ayarlardan çıkış yapmak yanıtları korur; yeniden başlamak ise parşömen içinde ayrıca onay gerektirir. Paylaşılan bir cihazda sonraki öğrenci için **Yeniden başla** seçilmelidir.

Girdilerin etiketleri, klavyeyle erişilen düğmeler, canlı geri bildirim alanı ve azaltılmış hareket desteği bulunur. Ayarlardan metin büyütülebilir. Kısa, yerel olarak sentezlenen tel melodileri isteğe bağlıdır ve başlangıçta kapalıdır. Gerçek bağlama kaydı kullanılmamıştır. Uygulama ekranın üzerine taşan sistem pencereleri açmaz.

## Doğrulama

İş kuralları Node.js'in yerleşik test aracıyla sınanır; harici npm bağımlılığı yoktur:

```sh
node --test tests/*.test.js
```

İsteğe bağlı gerçek tarayıcı testi, Python Playwright paketi ve Chromium gerektirir. Bir terminalde oyun sunucusunu başlatın, diğerinde çalıştırın:

```sh
python3 tests/browser_smoke.py
```

Sistem Chromium'u otomatik bulunur; gerekirse `--browser /tarayicinin/yolu` veya farklı sunucu için `--base-url` verilebilir. Test, masaüstü ve telefonda beş aşamayı baştan sona tamamlar; geri bildirimleri, sayfa yenilemede devam etmeyi, indirmeyi, ayarları ve sıfırlamayı denetler. Ek olarak altı ekran boyutunda parşömenin üst sahneye taşmadığını, iki görsel arasındaki geçişi sentetik test görselleriyle ve bozuk/kullanılamayan tarayıcı depolamasını kontrol eder. Tüm harici kaynaklar engellenerek CSS/JS'nin önizlemede yine de çalıştığı ayrıca sınanır. Özgün görseller eklenene kadar bu testler onların görsel doğruluğunu kanıtlamaz.

Kural ve paketleme testleri toplam 24 testtir. [Test raporu](docs/TEST-SONUCLARI.md), gerçek sonuçları ve eksik görseller nedeniyle bekleyen kontrolleri ayırır.

## ZIP paketi

Depo kökünde `python3 miras-atolyesi/scripts/package.py` çalıştırılır. Paket `downloads/miras-atolyesi.zip` konumuna yazılır. Kaynak kodlar, tek dosyalık HTML, çalıştırıcılar, belgeler ve testler dahil edilir. Git metaverisi ve önbellekler dahil edilmez. Her dosya arşivden geri okunarak kaynakla karşılaştırılır ve ZIP CRC kontrolü yapılır. Paketi çıkardıktan sonra üst klasördeki README yönergesini izleyin.
