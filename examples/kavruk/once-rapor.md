# AI Slop Meter raporu: http://localhost:5801/

**Slop skoru: 74/100 · Yoğun slop.** Sayfanın büyük kısmı başka bir sitede de aynen durabilir.

| | | |
|---|---|---|
| İçerik özü | `█████░░░░░░░` | 12.9/30 |
| Dil kalıpları | `████████░░░░` | 15.4/22 |
| Şablon tasarım | `████████████` | 28/28 |
| Özensiz detaylar | `█████████░░░` | 10.8/15 |
| Üretici izleri | `░░░░░░░░░░░░` | 0/5 |

Tarama no: `s1` · 993 kelime · sayfa dili: tr

## Sayfalar (6)
Taranan her sayfa, en kötüden başlayarak. Site skorunun yarısı ortalama sayfadan (ana sayfa iki kat sayılır, yasal metin ve giriş sayfaları hariç), yarısı en kötü sayfadan gelir.

| sayfa | Slop skoru | Bulgu | En büyük sorunlar |
|---|---|---|---|
| `/` | 80 · Saf slop | 28 | Somut bilgi az, Klişe ifade yoğunluğu, Genel geçer ya da stok sosyal kanıt |
| `/hakkimizda.html` | 71 · Yoğun slop | 23 | Somut bilgi az, Klişe ifade yoğunluğu, Şablon dolgu metni kalmış |
| `/blog.html` | 66 · Yoğun slop | 21 | Somut bilgi az, Klişe ifade yoğunluğu, Mor-indigo gradyan |
| `/kahveler.html` | 60 · Yoğun slop | 22 | Somut bilgi az, Klişe ifade yoğunluğu, Mor-indigo gradyan |
| `/abonelik.html` | 47 · Belirgin slop | 19 | Mor-indigo gradyan, Efekt kiti bileşenleri, Klişe ifade yoğunluğu |
| `/iletisim.html` | 45 · Belirgin slop | 16 | Mor-indigo gradyan, Efekt kiti bileşenleri, Klişe ifade yoğunluğu |

## Bulgular, etkisi en yüksekten

### 1. Somut bilgi az `+10`
_İçerik özü · yeniden yazım · sahibinden gerçek bilgi gerekir · 4 sayfada_ · id: `specificity`

Metin gövdesinde her 100 kelimeye 0 somut öğe düşüyor (sayı, tarih, fiyat, isim). 3,5'in altı genel geçer okunur.

**Kanıt:**
- `names found: Kavruk`
- `names found: Kavruk'a`

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`

**Düzeltme:** Genel iddiaları yalnızca bu işletmenin sahip olduğu bilgilerle değiştirin: rakamlar, müşteri isimleri, fiyatlar, tarihler, süreç detayları. Bunları sahibine sorun, asla uydurmayın.

**Adımlar:**
1. Sayfadaki en genel üç cümleyi seçin (her şirkete uyabilecek olanlar).
2. Her biri için sadece sizin söyleyebileceğiniz bir bilgi yazın: rakam, yer, müşteri, tarih, fiyat ya da isim.
3. Bir cümlenin arkasında bilgi yoksa silin. Kısa bir sayfa, belirsiz bir sayfadan iyidir.

**Örnek:** Önce: "Büyümeyi hızlandıran yenilikçi çözümler sunuyoruz." Sonra: "Kadıköy'de düz çatı sızıntılarını genelde 48 saatte, 4.500 TL'den başlayan fiyatla onarıyoruz."

**Bitti sayılır:** İlk ekrana bakan biri ne sattığınızı, kime, nerede ve kaça sattığınızı anlayabiliyor.

### 2. Klişe ifade yoğunluğu `+9`
_Dil kalıpları · yeniden yazım · 6 sayfada_ · id: `lexicon`

Slop sözlüğünden 12 güçlü ve 2 zayıf eşleşme, 1000 kelimede 43.3 (insan yazısı web metninde ortalama 7'nin epey altı).

**Kanıt:**
- `bir üst seviyeye ×2 · üst seviyeye taşı ×2 · yolculuğunuz ×2 · keşfedin ×2 · günümüzün hızla · hızla değişen dünya · kusursuz bir deneyim · oyunun kurallarını · en son teknoloji · fark yaratan`
- `Günümüzün hızla değişen dünyasında kahve sadece bir içecek değil, bir yaşam tarzıdır.`
- `Kavruk, eşsiz lezzetleri kusursuz bir deneyimle buluşturarak kahve yolculuğunuzu bir üst seviyeye taşıyor.`
- `yolculuğunuz ×3 · bir üst seviyeye ×2 · üst seviyeye taşı ×2 · kapsamlı ×2 · günümüzün hızla · hızla değişen dünya · vazgeçilmez bir parçası · vazgeçilmez · sonuç olarak`
- `Kahve demleme sanatında ustalaşmak için bilmeniz gereken her şey bu kapsamlı rehberde.`

**Konum:**
- `index.html:31` `Günümüzün hızla değişen dünyasında kahve sadece bir içecek değil, bir yaşam tarzıdır. Kavruk, eşsiz lezzetleri kusursuz bir deneyimle buluşturarak kahve yolculuğunuzu bir üst seviyeye taşıyor.`
- `index.html:49` `Kahve tutkunları için tasarlanmış, her yudumda fark yaratan benzersiz özellikler.`
- `index.html:56` `En son teknolojiyle korunan güvenli ve kolay ödeme altyapısı.`
- `index.html:63` `Binlerce mutlu müşterimizin deneyimlerini keşfedin.`
- `index.html:66` `"Harika bir deneyim! Kalite, hız ve müşteri hizmetleri mükemmel. Oyunun kurallarını değiştiriyorlar."`
- `index.html:73` `Kahve Yolculuğunuza Bugün Başlayın ☕`
- … +2

**Sayfalar:** `/`, `/blog.html`, `/hakkimizda.html`, `/kahveler.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Her ifadeyi silin ya da arkasındaki somut bilgiyle değiştirin. Bir klişeyi eş anlamlısıyla değiştirmeyin.

**Adımlar:**
1. Listelenen her yeri açıp bu site için listelenen klişe ifadeyi bulun.
2. Cümleyi gerçekte ne yapıldığı ya da ne işe yaradığı üzerinden sade kelimelerle yeniden yazın: ne, kimin için, hangi sonuçla. Eş anlamlısıyla değiştirmeyin.
3. Kelime çıkınca cümle bir şey söylemiyorsa cümlenin tamamını silin.

**Örnek:** Önce: "Sorunsuz iş birliğinin kilidini açın, iş akışınızı bir üst seviyeye taşıyın." Sonra: "Herkes aynı faturayı aynı anda düzenler, değişiklik bir saniyede görünür."

**Bitti sayılır:** Sayfayı sesli okuyun: hiçbir cümle daha önce duyduğunuz bir reklam gibi gelmiyor.

### 3. Mor-indigo gradyan `+6`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `purple-gradient`

6 mor/menekşe/indigo gradyan. AI ile üretilen arayüzlerin en bilinen varsayılanı.

**Kanıt:**
- `radial-gradient(circle, rgba(139, 92, 246, 0.35), transparent 70%)`
- `linear-gradient(135deg, var(--primary), var(--secondary))`
- `linear-gradient(90deg, #a78bfa, #ec4899, #6366f1)`
- `linear-gradient(90deg, var(--primary), var(--accent))`
- `linear-gradient(135deg, rgba(139, 92, 246, .3), rgba(236, 72, 153, .3))`

**Konum:**
- `assets/style.css:23` `radial-gradient(circle, rgba(139, 92, 246, 0.35), transparent 70%)`
- `assets/style.css:45` `linear-gradient(135deg, var(--primary), var(--secondary))`
- `assets/style.css:63` `linear-gradient(90deg, #a78bfa, #ec4899, #6366f1)`
- `assets/style.css:79` `linear-gradient(90deg, var(--primary), var(--accent))`
- `assets/style.css:91` `linear-gradient(135deg, rgba(139, 92, 246, .3), rgba(236, 72, 153, .3))`
- `assets/style.css:113` `linear-gradient(135deg, #7c3aed, #4f46e5, #db2777)`
- … +2

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Paleti konunun kendisinden türetin (malzemesi, mekânı, dönemi) ve tek bir vurgu rengini az kullanın. Gradyanı yalnızca bir şeyi tasvir ediyorsa kullanın. Gradyanın sadece rengini değiştirmek çözüm değil.

**Adımlar:**
1. Mor/çivit gradyanı logonuzdan, ürününüzden ya da mekânınızdan alınmış tek, düz bir marka rengiyle değiştirin.
2. O rengi tek bir iş için kullanın (ana buton ya da linkler), arka planları sade bırakın.
3. Tüm palet için yapay zekânıza tasarım rehberini verin: slop_guide → design.

**Bitti sayılır:** Renklere bakan biri sektörünüzü tahmin edebiliyor.

### 4. Şablon dolgu metni kalmış `+5.3`
_Özensiz detaylar · hızlı düzeltme · sahibinden gerçek bilgi gerekir · 3 sayfada_ · id: `placeholder`

Yayından önce değiştirilmesi gereken yer tutucular hâlâ sayfada.

**Kanıt:**
- `Lorem ipsum`
- `John Doe`
- `(555) 000`
- `₺XXX`

**Konum:**
- `hakkimizda.html:41` `Lorem ipsum`
- `hakkimizda.html:50` `John Doe`
- `hakkimizda.html:51` `Jane Smith`
- `hakkimizda.html:52` `Ali Veli`
- `iletisim.html:42` `(555) 000`
- `iletisim.html:43` `example.com`
- … +2

**Sayfalar:** `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Her birini gerçek içerikle değiştirin ya da bloğu silin. Gerçek isim, yorum ve linkleri sahibine sorun.

**Adımlar:**
1. Listelenen her konumu açın; her lorem ipsum, [Adınız], John Doe ya da sahte numara listelenmiş.
2. Her birini gerçeğiyle değiştirin ya da bloğun tamamını silin.

**Bitti sayılır:** Sayfada "lorem", "örnek" ve "[" aramak hiçbir şey bulmuyor.

### 5. Efekt kiti bileşenleri `+5`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `gimmick-effects`

Daktilo efekti, özel imleç, parçacıklar, uçuşan şekiller, meteor ve ışınlar: eklemesi kolay olduğu için yapıştırılmış efektler.

**Kanıt:**
- `typing effect`
- `floating shapes`

**Konum:**
- `index.html:30` `class="typing`
- `index.html:12` `class="glow-orb"></div><div class="glow…`
- `assets/app.js:3` `isDeleting`
- `blog.html:12` `class="glow-orb"></div><div class="glow…`
- `assets/app.js:3` `isDeleting`
- `kahveler.html:12` `class="glow-orb"></div><div class="glow…`
- … +2

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Eklemesi kolay olması eklemek için sebep değil. Kaldırın; o emeği gerçek görsellere ya da ürünün tek bir etkileşimli demosuna verin.

**Adımlar:**
1. Bu sitede listelenen efektleri kaldırın.
2. O alanı işinizden gerçek bir örneğe ayırın.

**Bitti sayılır:** Hiçbir şey sadece meşgul görünmek için hareket etmiyor.

### 6. Parlama, bulanıklık ve cam efekti `+4`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `glow-glass`

Arka plan parlamaları, bulanık lekeler, yanıp sönen rozetler ve buzlu cam kartlar.

**Kanıt:**
- `radial-gradient(`
- `backdrop-filter: blur(16px)`
- `backdrop-filter: blur(10px)`
- `backdrop-filter: blur(12px)`
- `glow 30px`

**Konum:**
- `assets/style.css:23` `radial-gradient(`
- `assets/style.css:30` `radial-gradient(`
- `assets/style.css:34` `backdrop-filter: blur(16px)`
- `assets/style.css:51` `backdrop-filter: blur(10px)`
- `assets/style.css:86` `backdrop-filter: blur(12px)`
- `assets/style.css:45` `glow 30px`
- … +2

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Efektleri kaldırın. Derinliği düzen, ölçek farkı ve gerçek görsellerle kurun.

**Adımlar:**
1. Parlamaları, bulanık lekeleri ve buzlu cam panelleri kaldırın.
2. Bölümleri boşluk, ince bir çizgi ya da sade bir arka plan değişimiyle ayırın.

**Bitti sayılır:** Sayfada hiçbir şey parlamıyor.

### 7. Genel geçer ya da stok sosyal kanıt `+3.9`
_İçerik özü · yeniden yazım · sahibinden gerçek bilgi gerekir · 2 sayfada_ · id: `fake-proof`

Yer tutucu avatarlar, isimsiz "binlerce kişi güveniyor" cümleleri ve kalıp övgülerden oluşan yorumlar uydurma kanıt gibi okunur. Sahte yorumlar ABD'de (FTC, 2024) ve Birleşik Krallık'ta (DMCC, 2025) ayrıca yasa dışı.

**Kanıt:**
- `i.pravatar.cc`
- `TechCorp`
- `Mutlu Müşteri`
- `Binlerce mutlu müşterimizin deneyimlerini keşfedin.`
- `"Kavruk sayesinde sabahlarım tamamen değişti! Hayatımda içtiğim en iyi kahve. Kesinlikle…`

**Konum:**
- `index.html:65` `i.pravatar.cc`
- `index.html:66` `i.pravatar.cc`
- `index.html:67` `i.pravatar.cc`
- `index.html:40` `Mutlu Müşteri`
- `index.html:63` `Binlerce mutlu müşterimizin deneyimlerini keşfedin.`
- `hakkimizda.html:50` `i.pravatar.cc`
- … +2

**Sayfalar:** `/`, `/hakkimizda.html`

**Düzeltme:** Gerçek yorumları tam isim, unvan, şirket ve tarihle (izin alarak) kullanın, orijinal yoruma link verin ya da bölümü kaldırın. Asla yorum üretmeyin.

**Adımlar:**
1. Arkasında duramayacağınız stok avatarları, örnek logoları ve "Bize güvenenler" satırlarını kaldırın.
2. 2-3 gerçek müşteriden tam isim, unvan ve şirketle, yayın izniyle bir yorum isteyin.
3. Henüz gerçek yorum yoksa bölümü çıkarın ya da herkese açık yorumlarınıza link verin (Google, Trustpilot, G2).

**Bitti sayılır:** Her yüz, logo ve yorum gerçek, isimli bir müşteriye ait.

### 8. İkon yerine emoji `+3.1`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `emoji-icons`

12 özellik ya da bölüm ikonu tek başına emoji.

**Kanıt:**
- `☕ 🚀 🌱 🎯 💎 🔒 ⭐⭐⭐⭐⭐ ⭐⭐⭐⭐⭐ ⭐⭐⭐⭐⭐ 📸 🐦 👍`
- `✨ 📸 🐦 👍`
- `📸 🐦 👍`

**Konum:**
- `index.html:15` `☕`
- `index.html:33` `🚀`
- `index.html:53` `🌱`
- `index.html:54` `🎯`
- `index.html:55` `💎`
- `index.html:56` `🔒`
- … +2

**Sayfalar:** `/`, `/kahveler.html`, `/blog.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Konuya uygun tek ve tutarlı bir ikon seti kullanın ya da hiç kullanmayın; gerçek fotoğraf veya şema çoğu zaman daha çok şey anlatır.

**Adımlar:**
1. Özellik ikonu olarak kullanılan emojileri değiştirin.
2. Özelliğin gerçek görüntüsünü (ekran görüntüsü, fotoğraf), tek tutarlı bir ikon seti kullanın ya da ikon kullanmayın.

**Bitti sayılır:** Hiçbir emoji ikon işi görmüyor.

### 9. Tailwind'in varsayılan renkleri `+3`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `default-palette`

Tailwind'in varsayılan paletinden doğrudan alınmış 9 renk (slate, purple-500, blue-500…). Binlerce site tam olarak bu değerleri paylaşıyor.

**Kanıt:**
- `#8b5cf6`
- `#6366f1`
- `#ec4899`
- `#9ca3af`
- `#a78bfa`

**Konum:**
- `assets/style.css:1` `#8b5cf6`
- `assets/style.css:63` `#a78bfa`
- `assets/style.css:113` `#7c3aed`
- `assets/style.css:132` `#d1d5db`
- `assets/style.css:1` `#8b5cf6`
- `assets/style.css:63` `#a78bfa`
- … +2

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Konudan (bir fotoğraf, ürün, mekân) 4-6 renk türetin, onlara isim verin ve sadece onları kullanın.

**Adımlar:**
1. Konunuzdaki gerçek bir şeyden 4-6 renk seçin (ürün fotoğrafı, logonuz, mekân).
2. Bunları bir kez isimli değişkenler olarak tanımlayın (--ink, --paper, --accent…) ve listelenen Tailwind renklerini değiştirin.

**Bitti sayılır:** Sayfadaki hiçbir renk doğrudan Tailwind'in varsayılan paletinden gelmiyor.

### 10. Bölüm anlatan kod yorumları `+3`
_Özensiz detaylar · hızlı düzeltme · 6 sayfada_ · id: `section-comments`

<!-- Hero Section --> gibi her bloğu etiketleyen yorumlar; AI'ın kendi düzeni için bıraktığı izler.

**Kanıt:**
- `Navbar`
- `Hero Section`
- `Stats Section`
- `Features Section`
- `Testimonials Section`

**Konum:**
- `index.html:13` `Navbar`
- `index.html:27` `Hero Section`
- `index.html:38` `Stats Section`
- `index.html:46` `Features Section`
- `index.html:60` `Testimonials Section`
- `index.html:71` `CTA Section`
- … +2

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Silin ya da yayın derlemesinde yorumları temizleyin.

**Adımlar:**
1. Listelenen <!-- Hero Section --> türü yorumları silin.

**Bitti sayılır:** Yorumlar sadece açık olmayan şeyleri açıklıyor.

### 11. Hiçbir yere gitmeyen linkler `+3`
_Özensiz detaylar · hızlı düzeltme · sahibinden gerçek bilgi gerekir · 6 sayfada_ · id: `dead-links`

11 link ya da buton "#" adresine veya bir sosyal ağın ana sayfasına (3) gidiyor.

**Kanıt:**
- `Hemen Başla`
- `Hemen Başla 🚀`
- `Daha Fazla Bilgi`
- `Ücretsiz Deneyin →`
- `📸`

**Konum:**
- `index.html:24` `Hemen Başla`
- `index.html:33` `Hemen Başla 🚀`
- `index.html:34` `Daha Fazla Bilgi`
- `index.html:75` `Ücretsiz Deneyin →`
- `index.html:83` `📸`
- `index.html:85` `Hediye Kartı`
- … +2

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Her birini gerçek bir sayfaya ya da eyleme bağlayın veya kaldırın.

**Adımlar:**
1. Listelenen her linki açın (href="#", boş ya da bir sosyal ağın ana sayfası).
2. Gerçek sayfaya ya da profile yönlendirin, ya da linki kaldırın.

**Bitti sayılır:** Her link işe yarar bir yere gidiyor.

### 12. Her şey aynı kart şablonunda `+2.5`
_Şablon tasarım · yeniden tasarım · 3 sayfada_ · id: `card-template`

İkon + başlık + tek cümlelik özdeş kartlardan oluşan 3 bölüm.

**Sayfalar:** `/`, `/kahveler.html`, `/hakkimizda.html`

**Düzeltme:** Her bölüme içeriğine uyan bir düzen verin: karşılaştırma tablosu, adım sırası, tek büyük kanıt, açıklamalı fotoğraf. Hero'yu tekrar eden bölümleri silin.

**Adımlar:**
1. Listelenen yerlerdeki birbirinin aynı kart ızgarasını (ikon, başlık, iki satır) bulun.
2. En önemli bir iki özelliği bırakıp gerçek bir ekran görüntüsü ya da örnekle büyük gösterin.
3. Gerisini sade bir listeye koyun.

**Bitti sayılır:** Sayfada birbirine benzeyen üçlü ya da altılı kart dizisi yok.

### 13. Varsayılan "güvenli" yazı tipi `+2.5`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `default-font`

Inter: AI araçlarının hep aynı yere çıktığı yazı tiplerinden.

**Kanıt:**
- `Inter`

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Konunun dünyasına ait yazı tipleri seçin ve nedenini yazın. Bir başlık fontunu bir metin fontuyla eşleştirin ya da tek bir değişken aileyi uç kalınlıklarda kullanın (200 ve 900). Inter uygulama içinde iyidir, açılış sayfasının sesi olarak değil.

### 14. Sebepsiz yere varsayılan karanlık `+2.5`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `perma-dark`

Sayfa ziyaretçinin ayarından bağımsız olarak siyaha yakın açılıyor. AI ile yapılmış sitelerin en yaygın görünümlerinden; tema düğmesi ilk izlenimi değiştirmiyor.

**Kanıt:**
- `background: var(--bg-color) = #0a0a12`

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** prefers-color-scheme ayarını izleyin ya da koyu temayı yalnızca konu gerektiriyorsa seçin (gece, film, kod). Koyu kalacaksa 3-4 yüzey seviyesi ve 7:1 kontrastlı gövde metni kullanın.

### 15. Her şey hareketli `+2.5`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `motion-everywhere`

0 kaydırınca beliren animasyon ve 2 üzerine gelince kalkan kart, azaltılmış hareket ayarı da yok.

**Kanıt:**
- `:hover translateY/scale`

**Konum:**
- `assets/style.css:50` `:hover translateY/scale`
- `assets/style.css:90` `:hover translateY/scale`
- `assets/style.css:50` `:hover translateY/scale`
- `assets/style.css:90` `:hover translateY/scale`
- `assets/style.css:50` `:hover translateY/scale`
- `assets/style.css:90` `:hover translateY/scale`
- … +2

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Tek bir bilinçli an bırakın (sayfa açılış animasyonu ya da tek etkileşimli demo). İçerik varsayılan olarak görünür olsun; prefers-reduced-motion'a uyun.

### 16. Üçlü sıralama alışkanlığı `+2.3`
_Dil kalıpları · yeniden yazım · 3 sayfada_ · id: `triads`

"Hızlı, güvenli ve kolay" türünden 4 üçlü sıralama.

**Kanıt:**
- `Siparişleriniz hızlı, güvenli ve sorunsuz`
- `Çevreye duyarlı, etik ve sürdürülebilir`
- `fincanda unutulmaz, benzersiz ve kusursuz`
- `Kalite, hız ve müşteri`
- `Taze, özenle seçilmiş ve doğru`

**Konum:**
- `index.html:52` `Siparişleriniz hızlı, güvenli ve sorunsuz bir şekilde kapınızda.`
- `index.html:53` `Çevreye duyarlı, etik ve sürdürülebilir kaynaklardan gelen kahveler.`
- `index.html:55` `Her fincanda unutulmaz, benzersiz ve kusursuz bir lezzet deneyimi.`
- `index.html:66` `"Harika bir deneyim! Kalite, hız ve müşteri hizmetleri mükemmel. Oyunun kurallarını değiştiriyorlar."`
- `blog.html:37` `Kaliteli bir kahvenin temeli, şüphesiz ki kaliteli çekirdeklerdir. Taze, özenle seçilmiş ve doğru kavrulmuş çekirdekler, lezzet yolculuğunuzun vazgeçilmez bir parçasıdır.`
- `blog.html:41` `Kahve ve su arasındaki denge, mükemmel fincanın anahtarıdır. Doğru oranı bulmak, lezzet, aroma ve gövde arasında kusursuz bir uyum yakalamanızı sağlar.`
- … +2

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`

**Düzeltme:** En önemli tek özelliği bırakın ve bir örnekle kanıtlayın.

### 17. Gradyanlı başlık yazısı `+2`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `gradient-text`

Başlık harfleri gradyanla boyanmış.

**Kanıt:**
- `background-clip: text`

**Konum:**
- `assets/style.css:63` `background-clip: text`
- `assets/style.css:63` `background-clip: text`
- `assets/style.css:63` `background-clip: text`
- `assets/style.css:63` `background-clip: text`
- `assets/style.css:63` `background-clip: text`
- `assets/style.css:63` `background-clip: text`

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Başlığı karakterli bir yazı tipi ve tek düz renk taşısın.

### 18. Emojili başlık ve butonlar `+1.9`
_Dil kalıpları · hızlı düzeltme · 2 sayfada_ · id: `emoji-headings`

5 başlık ya da butonda emoji var.

**Kanıt:**
- `1. 🌱 Kaliteli Çekirdek Seçin`
- `2. 💧 Suyun Önemi`
- `3. ⚖️ Doğru Oran`
- `4. 🌡️ Sıcaklık Kontrolü`
- `Misyonumuz 🎯`

**Konum:**
- `blog.html:36` `1. 🌱 Kaliteli Çekirdek Seçin`
- `blog.html:38` `2. 💧 Suyun Önemi`
- `blog.html:40` `3. ⚖️ Doğru Oran`
- `blog.html:42` `4. 🌡️ Sıcaklık Kontrolü`
- `blog.html:44` `5. ⏱️ Zamanlama`
- `hakkimizda.html:37` `Misyonumuz 🎯`
- … +1

**Sayfalar:** `/blog.html`, `/hakkimizda.html`

**Düzeltme:** Kaldırın; hiyerarşiyi yazı boyutu, kalınlık ve boşlukla kurun.

### 19. Kaynaksız vitrin rakamları `+1.8`
_İçerik özü · yeniden yazım · sahibinden gerçek bilgi gerekir · 1 sayfada_ · id: `vanity`

Yuvarlak yüzdeler, "10.000+" ve "5 kat" türü iddialar neyi, kimin, ne zaman ölçtüğü belirtilmeden duruyor.

**Kanıt:**
- `10.000+ · 50+ · %99`

**Konum:**
- `index.html:40` `10.000+`
- `index.html:41` `50+`
- `index.html:42` `%99`

**Sayfalar:** `/`

**Düzeltme:** Bir rakamı yalnızca sahibi kaynağını gösterebiliyorsa tutun ve neyin ne zaman ölçüldüğünü yazın. Gerisini silin.

### 20. "Sadece X değil, Y" kalıbı `+1.8`
_Dil kalıpları · yeniden yazım · 1 sayfada_ · id: `neg-parallel`

Bu karşıtlık kalıbı 2 kez geçiyor. AI metninin en bilinen işaretlerinden biri.

**Kanıt:**
- `sadece bir içecek değil, bir`
- `sadece bir kahve değil, bir`

**Konum:**
- `index.html:31` `Günümüzün hızla değişen dünyasında kahve sadece bir içecek değil, bir yaşam tarzıdır. Kavruk, eşsiz lezzetleri kusursuz bir deneyimle buluşturarak kahve yolculuğunuzu bir üst seviyeye taşıyor.`
- `index.html:67` `"Sadece bir kahve değil, bir yaşam tarzı. Kavruk ile tanıştıktan sonra başka kahve içemiyorum!"`

**Sayfalar:** `/`

**Düzeltme:** Ne olduğunu doğrudan söyleyin, olmadığı şeyle karşılaştırmayı bırakın.

### 21. Her şey ortalanmış `+1.7`
_Şablon tasarım · yeniden tasarım · 4 sayfada_ · id: `centred-everything`

Tarayıcıda ölçüldü: 33 başlık ve paragrafın 29 tanesi ortalanmış. Her bloğun ortada durduğu sayfada okuma çizgisi ve hiyerarşi kalmaz.

**Kanıt:**
- `88% centred`
- `89% centred`
- `82% centred`

**Sayfalar:** `/`, `/kahveler.html`, `/hakkimizda.html`, `/abonelik.html`

**Düzeltme:** Gövde metnini ve çoğu başlığı sola hizalayın; ortalamayı bir iki ana bırakın (hero, kapanış satırı).

### 22. Şablondan çıkmış başlık `+1.5`
_Dil kalıpları · yeniden yazım · sahibinden gerçek bilgi gerekir · 1 sayfada_ · id: `headline-formula`

"…nizi güçlendirin", "…yeniden tanımlıyoruz", "Hepsi tek platformda": ürünün yaptığı tek bir şeyi söylemeden değişim vaat eden başlık kalıpları.

**Kanıt:**
- `Kahvede Deneyimi Yeniden Tanımlıyoruz`

**Sayfalar:** `/`

**Düzeltme:** Başlığı ne yaptığını ve kimin için olduğunu tek somut detayla söyleyen düz bir cümle olarak yazın.

### 23. Her başlığın altında kısa renkli çizgi `+1.5`
_Şablon tasarım · yeniden tasarım · 6 sayfada_ · id: `accent-underline`

Ortalanmış başlık ve altında küçük renkli çizgi, her bölümde tekrar: hazır temaların "bölüm burada başlıyor" deme şekli.

**Kanıt:**
- `.section-title::after { content: ''; display: block; width: 60px; height: 4px;…`

**Konum:**
- `assets/style.css:79` `::after`
- `assets/style.css:79` `::after`
- `assets/style.css:79` `::after`
- `assets/style.css:79` `::after`
- `assets/style.css:79` `::after`
- `assets/style.css:79` `::after`

**Sayfalar:** `/`, `/blog.html`, `/kahveler.html`, `/hakkimizda.html`, `/iletisim.html`, `/abonelik.html`

**Düzeltme:** Bölümleri boşluk ve yazı boyutu ayırsın. Ayırıcı gerekiyorsa sayfa genelinde tek tutarlı bir çizgi kullanın.

### 24. Genel geçer eylem butonları `+1.4`
_Dil kalıpları · hızlı düzeltme · 3 sayfada_ · id: `generic-cta`

"Hemen başla" ya da "Daha fazla bilgi" gibi butonlar ziyaretçiye ne alacağını söylemiyor.

**Kanıt:**
- `Hemen Başla`
- `Keşfet`
- `Daha Fazla Bilgi`
- `Ücretsiz Deneyin →`
- `Bize Ulaşın`

**Konum:**
- `kahveler.html:24` `Hemen Başla`
- `kahveler.html:37` `Keşfet`
- `index.html:24` `Hemen Başla`
- `index.html:34` `Daha Fazla Bilgi`
- `index.html:75` `Ücretsiz Deneyin →`
- `abonelik.html:24` `Hemen Başla`
- … +1

**Sayfalar:** `/kahveler.html`, `/`, `/abonelik.html`

**Düzeltme:** Sonucu ya da sonraki ekranı adlandırın: "20 dakikalık demo ayarla", "Menüyü gör".

### 25. Hazır açılış sayfası kalıpları `+1`
_Dil kalıpları · yeniden yazım · 1 sayfada_ · id: `stock-microcopy`

Her üretilmiş açılış sayfasında olan 4 kalıp ("Hemen başla", "Kredi kartı gerekmez", "Güvenenler", "Tüm hakları saklıdır").

**Kanıt:**
- `hemen başla`
- `daha fazla bilgi`
- `tüm hakları saklıdır`
- `yapay zeka destekli`

**Konum:**
- `index.html:24` `Hemen Başla`
- `index.html:29` `✨ Yeni: Yapay Zeka Destekli Kahve Önerileri`
- `index.html:33` `Hemen Başla 🚀`
- `index.html:34` `Daha Fazla Bilgi`
- `index.html:54` `Damak zevkinize özel, yapay zeka destekli kahve önerileri.`
- `index.html:89` `© 2023 Kavruk. Tüm hakları saklıdır.`

**Sayfalar:** `/`

**Düzeltme:** Her butonu tıklayınca ne olacağına göre adlandırın, her rakibin de söylediği güven cümlelerini çıkarın.

… +7

## Şimdiden işe yarayanlar (skoru düşürür)
- `-0.3` İsmi ve rolü belli kişi: Özel Harman
Usta
- `-1` Hakkımızda / ekip sayfası: Hakkımızda

## AI arama hazırlığı: 4/11 (36)
ChatGPT, Claude, Perplexity ve Gemini bunu okuyabiliyor, arkasında kimin olduğunu anlayıp alıntılayabiliyor mu? Ayrı bir puan; slop skorunu değiştirmez.

- ✗ **Yapısal veri (JSON-LD)** — 6 sayfanın 0 tanesinde. Kim olduğunuzu söyleyen bir JSON-LD bloğu ekleyin (Organization, LocalBusiness ya da Person); yazılarda yazar ve tarihli Article.
- ✓ **JavaScript olmadan okunabiliyor** — 6 sayfanın 6 tanesinde
- ✓ **Başlık ve açıklama** — 6 sayfanın 5 tanesinde
- ✗ **Link önizlemesi (Open Graph)** — 6 sayfanın 0 tanesinde. og:title, og:description ve og:image ekleyin; paylaşılan linkler ve AI cevapları düzgün bir önizleme göstersin.
- ✗ **Asıl adres (canonical)** — 6 sayfanın 0 tanesinde. Sayfanın tek asıl adresiyle <link rel="canonical"> ekleyin.
- ✓ **Tek ana başlık** — 6 sayfanın 6 tanesinde
- ✗ **Yazar ve tarih** — 5 sayfanın 0 tanesinde. Kimin ne zaman yazdığını gösterin (imza ve <time datetime>); ikisini de Article JSON-LD'ye koyun.
- ✗ **Alıntılanabilir paragraflar** — 6 sayfanın 1 tanesinde. Sayfanın ana sorusunu tam cümlelerden oluşan düz paragraflarla cevaplayın. Yalnızca başlık ve buton, bir AI'ın alıntılayacağı bir şey bırakmaz.
- ✓ **AI tarayıcılarına izin var** — robots.txt yok, hepsine izin var
- ✗ **llms.txt** — yok. /llms.txt ekleyin: sitenin kısa bir Markdown özeti ve önemli sayfalarına linkler (llmstxt.org).
- ✗ **Site haritası** — yok. /sitemap.xml yayınlayın ve robots.txt'te belirtin.

## Sonraki adım
Öncelik sıralı dönüşüm planı için `slop_rescue_plan` aracını `scan_id: "s1"` ile çağırın, sonra değişimi ölçmek için yeniden tarayın.
Tek bir sayfanın kendi adımlarıyla tam raporu için `slop_page` aracını `scan_id: "s1"` ve sayfa yoluyla çağırın.


# Kurtarma planı: http://localhost:5801/

Şu an **74/100 (Yoğun slop)**. Bu plan uygulanırsa tahmini skor **~0**. Hedef: **20**. Sayfa türü tahmini: blog / yayın.

## Kurallar
- Asla bilgi, rakam, isim, alıntı, fiyat, müşteri ya da ödül uydurmayın. Eksik bilgi için [yer tutucu] bırakıp sorun ya da iddiayı silin.
- Bir klişeyi eş anlamlısıyla değiştirmeyin ("kusursuz" → "pürüzsüz"). Yerine bir bilgi koyun ya da silin.
- Bir AI varsayılan görünümünü başkasıyla değiştirmeyin: mor gradyan → krem + serif + kiremit ya da siyah + tek neon vurgu aynı hamledir.
- Sahibinin korumak istediklerine dokunmayın. Her seferinde bir aşamayı değiştirin ve her aşamadan sonra yeniden tarayın.
- Tarayıcı için değil okuyucu için yazın: amaç bir dedektörü atlatmak değil, daha faydalı ve özgül bir sayfa.

## Aşama 1. Önce gerçek bilgileri toplayın
Genel geçer metin, özgül bilgi hiç verilmediği için var. Hiçbir şeyi yeniden yazmadan önce sahibine sorun; boşlukları kendisi dolduran bir yapay zekâ sadece yeni slop üretir.

Sahibine tek mesajda sorun, cevapları bekleyin:
1. Tek cümleyle: bu kimin için ve başka yerde bulamayacağı neyi alıyor?
2. Müşteriler sizi tavsiye ederken gerçekte ne diyor? Pazarlama dili değil, onların kelimeleri.
3. Arkasında durabileceğiniz rakamlı üç somut bilgi verin (kazanılan süre, fiyat, yıl, hacim, cevap süresi) ve her rakamın nereden geldiğini.
4. Arkasında kim var? Gösterebileceğimiz isimler ve roller, ziyaretçinin bir insana nasıl ulaşabileceği.
5. Olduğu gibi kalması gereken ne var (logo, renkler, ton, bölümler)?
6. Burada kim yazıyor ve okuyucu bu konuda ona neden güvenmeli?
7. Önemli yazılar için: neyi bizzat test ettiniz, ölçtünüz ya da yaşadınız?
8. Yayın ve güncelleme tarihleri, olgusal iddiaların kaynakları.
9. Bu cümlelerin her birinin arkasındaki düz bilgi ne? «Günümüzün hızla değişen dünyasında kahve sadece bir içecek değil, bir yaşam tarzıdır. Kavruk, eşsiz lezzetleri kusursuz bir deneyimle buluşturarak kahve yolculuğunuzu bir üst seviyeye taşıyor.» «Kahve tutkunları için tasarlanmış, her yudumda fark yaratan benzersiz özellikler.» «En son teknolojiyle korunan güvenli ve kolay ödeme altyapısı.» «Binlerce mutlu müşterimizin deneyimlerini keşfedin.»
10. Gerçekten sana ait bir renk var mı (logo, kanal görseli, ürün)? Yeni palet ondan başlayacak.
11. Bu yer tutucuların gerçek içeriğe ihtiyacı var: Lorem ipsum, John Doe, (555) 000, ₺XXX. Her birinin yerine ne gelsin, yoksa blok kaldırılsın mı?
12. Şu efektler kaldırılacak: daktilo efekti, uçuşan şekiller. Kalmasını istediğin var mı?
13. Tam isim, unvan ve şirketle, yayınlama izniyle 2-3 gerçek yorum paylaşabilir misiniz?
14. Bunlar nereye gitmeli: Hemen Başla, Hemen Başla 🚀, Daha Fazla Bilgi, Ücretsiz Deneyin →, 📸, 🐦?
15. Koyu tema bilinçli bir tercih mi, yoksa sayfa açık açılıp ziyaretçinin ayarını mı izlesin?
16. Bu rakamlardan hangilerinin kaynağını gösterebilirsiniz ve nasıl: 10.000+ · 50+ · %99? Diğerleri kaldırılacak.
17. Başlık şu an «Kahvede Deneyimi Yeniden Tanımlıyoruz» diyor. Kendi kelimelerinle: ne yapıyor, kimin için?

## Aşama 2. Özensiz detayları temizleyin · tahmini −16 puan → ~58
En bariz "kimse kontrol etmemiş" işaretlerini kaldıran hızlı, mekanik düzeltmeler.

- **Şablon dolgu metni kalmış** (`placeholder`, +5.3, 3 sayfa) — `hakkimizda.html:41`, `hakkimizda.html:50`, `hakkimizda.html:51`, `hakkimizda.html:52`
  Her birini gerçek içerikle değiştirin ya da bloğu silin. Gerçek isim, yorum ve linkleri sahibine sorun.
  Kanıt: Lorem ipsum / John Doe
- **Bölüm anlatan kod yorumları** (`section-comments`, +3, 6 sayfa) — `index.html:13`, `index.html:27`, `index.html:38`, `index.html:46`
  Silin ya da yayın derlemesinde yorumları temizleyin.
  Kanıt: Navbar / Hero Section
- **Hiçbir yere gitmeyen linkler** (`dead-links`, +3, 6 sayfa) — `index.html:24`, `index.html:33`, `index.html:34`, `index.html:75`
  Her birini gerçek bir sayfaya ya da eyleme bağlayın veya kaldırın.
  Kanıt: Hemen Başla / Hemen Başla 🚀
- **Emojili başlık ve butonlar** (`emoji-headings`, +1.9, 2 sayfa) — `blog.html:36`, `blog.html:38`, `blog.html:40`, `blog.html:42`
  Kaldırın; hiyerarşiyi yazı boyutu, kalınlık ve boşlukla kurun.
  Kanıt: 1. 🌱 Kaliteli Çekirdek Seçin / 2. 💧 Suyun Önemi
- **Genel geçer eylem butonları** (`generic-cta`, +1.4, 3 sayfa) — `kahveler.html:24`, `kahveler.html:37`, `index.html:24`, `index.html:34`
  Sonucu ya da sonraki ekranı adlandırın: "20 dakikalık demo ayarla", "Menüyü gör".
  Kanıt: Hemen Başla / Keşfet
- **Anlamlı alt metni olmayan görseller** (`missing-alt`, +1, 2 sayfa) — `index.html:65`, `index.html:66`, `index.html:67`, `hakkimizda.html:50`
  Her görselin ne gösterdiğini yazın; süs görselleri için alt="" kullanın.
  Kanıt: https://i.pravatar.cc/150?img=1 / https://i.pravatar.cc/150?img=3
- **Eski telif yılı** (`stale-copyright`, +1, 6 sayfa) — `index.html:89`, `blog.html:63`, `kahveler.html:64`, `hakkimizda.html:67`
  Güncelleyin ya da yılı otomatik yazdırın.
  Kanıt: © 2023
- **Varsayılan favicon ya da yer tutucu görsel** (`default-favicon`, +1, 6 sayfa) — `index.html:8`, `blog.html:8`, `kahveler.html:8`, `hakkimizda.html:8`
  Marka işaretiyle değiştirin.
  Kanıt: href="/vite.svg"
- **Eksik sayfa metadatası** (`missing-meta`, +0.5, 5 sayfa)
  Sayfaya özel açıklama ve paylaşım önizlemesi ekleyin; dili belirtin.
  Kanıt: Open Graph

## Aşama 3. Metni bu bilgilerle yeniden yazın · tahmini −30 puan → ~28
Skorun ve okuyucunun yargısının en büyük kısmını içerik ve dil taşır.

- **Somut bilgi az** (`specificity`, +10, 4 sayfa)
  Genel iddiaları yalnızca bu işletmenin sahip olduğu bilgilerle değiştirin: rakamlar, müşteri isimleri, fiyatlar, tarihler, süreç detayları. Bunları sahibine sorun, asla uydurmayın.
  Kanıt: names found: Kavruk / names found: Kavruk'a
- **Klişe ifade yoğunluğu** (`lexicon`, +9, 6 sayfa) — `index.html:31`, `index.html:49`, `index.html:56`, `index.html:63`
  Her ifadeyi silin ya da arkasındaki somut bilgiyle değiştirin. Bir klişeyi eş anlamlısıyla değiştirmeyin.
  Kanıt: bir üst seviyeye ×2 · üst seviyeye taşı ×2 · yolculuğunuz ×2 · keşfedin ×2 · günümüzün hızla · hızla değişen dünya · kusursuz bir deneyim · oyunun kurallarını · en son teknoloji · fark yaratan / Günümüzün hızla değişen dünyasında kahve sadece bir içecek değil, bir yaşam tarzıdır.
- **Genel geçer ya da stok sosyal kanıt** (`fake-proof`, +3.9, 2 sayfa) — `index.html:65`, `index.html:66`, `index.html:67`, `index.html:40`
  Gerçek yorumları tam isim, unvan, şirket ve tarihle (izin alarak) kullanın, orijinal yoruma link verin ya da bölümü kaldırın. Asla yorum üretmeyin.
  Kanıt: i.pravatar.cc / TechCorp
- **Üçlü sıralama alışkanlığı** (`triads`, +2.3, 3 sayfa) — `index.html:52`, `index.html:53`, `index.html:55`, `index.html:66`
  En önemli tek özelliği bırakın ve bir örnekle kanıtlayın.
  Kanıt: Siparişleriniz hızlı, güvenli ve sorunsuz / Çevreye duyarlı, etik ve sürdürülebilir
- **Kaynaksız vitrin rakamları** (`vanity`, +1.8) — `index.html:40`, `index.html:41`, `index.html:42`
  Bir rakamı yalnızca sahibi kaynağını gösterebiliyorsa tutun ve neyin ne zaman ölçüldüğünü yazın. Gerisini silin.
  Kanıt: 10.000+ · 50+ · %99
- **"Sadece X değil, Y" kalıbı** (`neg-parallel`, +1.8) — `index.html:31`, `index.html:67`
  Ne olduğunu doğrudan söyleyin, olmadığı şeyle karşılaştırmayı bırakın.
  Kanıt: sadece bir içecek değil, bir / sadece bir kahve değil, bir
- **Şablondan çıkmış başlık** (`headline-formula`, +1.5)
  Başlığı ne yaptığını ve kimin için olduğunu tek somut detayla söyleyen düz bir cümle olarak yazın.
  Kanıt: Kahvede Deneyimi Yeniden Tanımlıyoruz
- **Hazır açılış sayfası kalıpları** (`stock-microcopy`, +1) — `index.html:24`, `index.html:29`, `index.html:33`, `index.html:34`
  Her butonu tıklayınca ne olacağına göre adlandırın, her rakibin de söylediği güven cümlelerini çıkarın.
  Kanıt: hemen başla / daha fazla bilgi
- **Kaynaksız ödünç otorite** (`weasel`, +0.9) — `blog.html:37`
  Araştırmayı ya da uzmanı adlandırıp link verin veya iddiayı silin.
  Kanıt: şüphesiz ki
- **Kalıp giriş ve kapanışlar** (`formulaic-frame`, +0.6) — `blog.html:47`
  Doğrudan konuyla başlayın; son somut bilgiyle ya da net bir sonraki adımla bitirin.
  Kanıt: Sonuç olarak, mükemmel kahve demlemek bilgi, sabır ve tutku gerektiren bir yolculuktur. B…

Yöntem:
- Hero: kimin için olduğunu, ne yaptığını ve tek bir kanıtı ziyaretçinin kelimeleriyle söyleyin. "Potansiyelinizi", "bir sonraki seviye" yok.
- Her iddiaya bir bilgi: kaynağıyla bir rakam, isimli bir müşteri, bir fiyat, bir süre, sürecin bir adımı.
- Başka birinin sitesinde aynen durabilecek cümleleri silin. Bir bölümde hiçbir şey kalmıyorsa bölümü silin.
- Butonlar sonucu adlandırsın ("Bu haftanın menüsünü gör", "20 dakikalık görüşme ayarla").

## Aşama 4. Şablon görünümünü geride bırakın · tahmini −28 puan → ~0
Görsel varsayılanlar, ziyaretçi tek kelime okumadan sayfanın üretildiğini söyler.

- **Mor-indigo gradyan** (`purple-gradient`, +6, 6 sayfa) — `assets/style.css:23`, `assets/style.css:45`, `assets/style.css:63`, `assets/style.css:79`
  Paleti konunun kendisinden türetin (malzemesi, mekânı, dönemi) ve tek bir vurgu rengini az kullanın. Gradyanı yalnızca bir şeyi tasvir ediyorsa kullanın. Gradyanın sadece rengini değiştirmek çözüm değil.
  Kanıt: radial-gradient(circle, rgba(139, 92, 246, 0.35), transparent 70%) / linear-gradient(135deg, var(--primary), var(--secondary))
- **Efekt kiti bileşenleri** (`gimmick-effects`, +5, 6 sayfa) — `index.html:30`, `index.html:12`, `assets/app.js:3`, `blog.html:12`
  Eklemesi kolay olması eklemek için sebep değil. Kaldırın; o emeği gerçek görsellere ya da ürünün tek bir etkileşimli demosuna verin.
  Kanıt: typing effect / floating shapes
- **Parlama, bulanıklık ve cam efekti** (`glow-glass`, +4, 6 sayfa) — `assets/style.css:23`, `assets/style.css:30`, `assets/style.css:34`, `assets/style.css:51`
  Efektleri kaldırın. Derinliği düzen, ölçek farkı ve gerçek görsellerle kurun.
  Kanıt: radial-gradient( / backdrop-filter: blur(16px)
- **İkon yerine emoji** (`emoji-icons`, +3.1, 6 sayfa) — `index.html:15`, `index.html:33`, `index.html:53`, `index.html:54`
  Konuya uygun tek ve tutarlı bir ikon seti kullanın ya da hiç kullanmayın; gerçek fotoğraf veya şema çoğu zaman daha çok şey anlatır.
  Kanıt: ☕ 🚀 🌱 🎯 💎 🔒 ⭐⭐⭐⭐⭐ ⭐⭐⭐⭐⭐ ⭐⭐⭐⭐⭐ 📸 🐦 👍 / ✨ 📸 🐦 👍
- **Tailwind'in varsayılan renkleri** (`default-palette`, +3, 6 sayfa) — `assets/style.css:1`, `assets/style.css:63`, `assets/style.css:113`, `assets/style.css:132`
  Konudan (bir fotoğraf, ürün, mekân) 4-6 renk türetin, onlara isim verin ve sadece onları kullanın.
  Kanıt: #8b5cf6 / #6366f1
- **Her şey aynı kart şablonunda** (`card-template`, +2.5, 3 sayfa)
  Her bölüme içeriğine uyan bir düzen verin: karşılaştırma tablosu, adım sırası, tek büyük kanıt, açıklamalı fotoğraf. Hero'yu tekrar eden bölümleri silin.
- **Varsayılan "güvenli" yazı tipi** (`default-font`, +2.5, 6 sayfa)
  Konunun dünyasına ait yazı tipleri seçin ve nedenini yazın. Bir başlık fontunu bir metin fontuyla eşleştirin ya da tek bir değişken aileyi uç kalınlıklarda kullanın (200 ve 900). Inter uygulama içinde iyidir, açılış sayfasının sesi olarak değil.
  Kanıt: Inter
- **Sebepsiz yere varsayılan karanlık** (`perma-dark`, +2.5, 6 sayfa)
  prefers-color-scheme ayarını izleyin ya da koyu temayı yalnızca konu gerektiriyorsa seçin (gece, film, kod). Koyu kalacaksa 3-4 yüzey seviyesi ve 7:1 kontrastlı gövde metni kullanın.
  Kanıt: background: var(--bg-color) = #0a0a12
- **Her şey hareketli** (`motion-everywhere`, +2.5, 6 sayfa) — `assets/style.css:50`, `assets/style.css:90`, `assets/style.css:50`, `assets/style.css:90`
  Tek bir bilinçli an bırakın (sayfa açılış animasyonu ya da tek etkileşimli demo). İçerik varsayılan olarak görünür olsun; prefers-reduced-motion'a uyun.
  Kanıt: :hover translateY/scale
- **Gradyanlı başlık yazısı** (`gradient-text`, +2, 6 sayfa) — `assets/style.css:63`, `assets/style.css:63`, `assets/style.css:63`, `assets/style.css:63`
  Başlığı karakterli bir yazı tipi ve tek düz renk taşısın.
  Kanıt: background-clip: text
- **Her şey ortalanmış** (`centred-everything`, +1.7, 4 sayfa)
  Gövde metnini ve çoğu başlığı sola hizalayın; ortalamayı bir iki ana bırakın (hero, kapanış satırı).
  Kanıt: 88% centred / 89% centred
- **Her başlığın altında kısa renkli çizgi** (`accent-underline`, +1.5, 6 sayfa) — `assets/style.css:79`, `assets/style.css:79`, `assets/style.css:79`, `assets/style.css:79`
  Bölümleri boşluk ve yazı boyutu ayırsın. Ayırıcı gerekiyorsa sayfa genelinde tek tutarlı bir çizgi kullanın.
  Kanıt: .section-title::after { content: ''; display: block; width: 60px; height: 4px;…
- **Her şeyde büyük köşe yarıçapı** (`rounded-everything`, +0.7, 2 sayfa)
  Köşe yarıçapını role göre (girdi, kart, hap) küçük bir ölçekten verin.
  Kanıt: 26 large-radius boxes (measured) / 24 large-radius boxes (measured)

Yöntem:
- Konunun kendi dünyasını tek satırda adlandırın: malzemeleri, mekânı, dönemi, aletleri, müşterilerin kullandığı kelimeler. Her görsel karar bu satırdan çıkmalı.
- Palet: vurguya doğru hafif renklendirilmiş 1 zemin nötrü, 1 mürekkep rengi, konudan alınmış 1 vurgu (bir malzeme, ürün ya da tabela rengi), yüzeyin %10'undan azında. Kontrastı kontrol edin (metin için 4.5:1).
- Yazı: karakterli bir başlık fontuyla sakin bir metin fontunu eşleştirin; kimliği tek başına Inter/Space Grotesk/Poppins'e bırakmayın. Tek bir yazı ölçeği belirleyip ona uyun.
- Düzen: her bölüme içeriğinin şeklini verin (karşılaştırma için tablo, yalnızca gerçek sıralar için numaralı adımlar, altı küçük kart yerine tek büyük kanıt). Her şey ortada değil, her şey yuvarlak kartta değil.
- Görsel ve ikon: ürünün, mekânın ya da insanların gerçek fotoğrafları illüstrasyondan iyidir; ikon kalacaksa tek ve tutarlı bir set, emoji yok.

## Aşama 5. Sayfanın arkasında kim olduğunu gösterin
Gerçek isimler, ulaşılabilir iletişim ve doğrulanabilir detaylar en güçlü anti-slop işaretidir ve skoru düşürür.

- Doğrudan iletişim ekleyin: gerçek bir e-posta ya da bir insana ulaşan iletişim sayfası.
- İçeriğe tarih koyun ve son güncellemeyi gösterin.

## Aşama 6. AI aramada okunur hale getirin
ChatGPT, Claude, Perplexity ve Gemini soruları okuyabildikleri, kime ait olduğunu anlayabildikleri ve alıntılayabildikleri sayfalarla cevaplar. Slop skorunu değiştirmez; AI arama hazırlığı puanını yükseltir.

Şu an 4/11. Eksikler:
- **Yapısal veri (JSON-LD)** (6 sayfanın 0 tanesinde): Kim olduğunuzu söyleyen bir JSON-LD bloğu ekleyin (Organization, LocalBusiness ya da Person); yazılarda yazar ve tarihli Article.
- **Link önizlemesi (Open Graph)** (6 sayfanın 0 tanesinde): og:title, og:description ve og:image ekleyin; paylaşılan linkler ve AI cevapları düzgün bir önizleme göstersin.
- **Asıl adres (canonical)** (6 sayfanın 0 tanesinde): Sayfanın tek asıl adresiyle <link rel="canonical"> ekleyin.
- **Yazar ve tarih** (5 sayfanın 0 tanesinde): Kimin ne zaman yazdığını gösterin (imza ve <time datetime>); ikisini de Article JSON-LD'ye koyun.
- **Alıntılanabilir paragraflar** (6 sayfanın 1 tanesinde): Sayfanın ana sorusunu tam cümlelerden oluşan düz paragraflarla cevaplayın. Yalnızca başlık ve buton, bir AI'ın alıntılayacağı bir şey bırakmaz.
- **llms.txt** (yok): /llms.txt ekleyin: sitenin kısa bir Markdown özeti ve önemli sayfalarına linkler (llmstxt.org).
- **Site haritası** (yok): /sitemap.xml yayınlayın ve robots.txt'te belirtin.

## Aşama 7. Yeniden ölçün
Aynı hedefi yeniden tarayın; AI Slop Meter önce/sonra tablosunu ve açık kalan bulguları gösterir.

Aynı hedefle `slop_scan` çağırın (CLI: `npx aislopmeter http://localhost:5801/`). Skor 20 altına inene ya da kalan bulgular yalnızca sahibin bilebileceği bilgiler gerektirene kadar tekrarlayın. Ayrıntılı yöntem: `slop_guide` → playbook, copy, design.
