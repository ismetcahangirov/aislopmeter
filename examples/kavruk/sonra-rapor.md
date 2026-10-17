# AI Slop Meter raporu: http://localhost:5802/

**Slop skoru: 0/100 · Temiz.** Kayda değer slop işareti yok.

| | | |
|---|---|---|
| İçerik özü | `░░░░░░░░░░░░` | 0/30 |
| Dil kalıpları | `░░░░░░░░░░░░` | 0/22 |
| Şablon tasarım | `░░░░░░░░░░░░` | 0/28 |
| Özensiz detaylar | `░░░░░░░░░░░░` | 0/15 |
| Üretici izleri | `░░░░░░░░░░░░` | 0/5 |

Tarama no: `s1` · 1001 kelime · sayfa dili: tr

## Sayfalar (6)
Taranan her sayfa, en kötüden başlayarak. Site skorunun yarısı ortalama sayfadan (ana sayfa iki kat sayılır, yasal metin ve giriş sayfaları hariç), yarısı en kötü sayfadan gelir.

| sayfa | Slop skoru | Bulgu | En büyük sorunlar |
|---|---|---|---|
| `/` | 0 · Temiz | 0 |  |
| `/kahveler.html` | 0 · Temiz | 0 |  |
| `/blog.html` | 0 · Temiz | 0 |  |
| `/hakkimizda.html` | 0 · Temiz | 0 |  |
| `/iletisim.html` | 0 · Temiz | 0 |  |
| `/abonelik.html` | 0 · Temiz | 0 |  |

## Bulgular, etkisi en yüksekten
Yok.

## Şimdiden işe yarayanlar (skoru düşürür)
- `-0.5` Somut fiyatlar: 450 TL, 560 TL
- `-1` Çalışma saatleri: 11:00–16:00, 10:00–18:00
- `-1` Hakkımızda / ekip sayfası: Biz kimiz
- `-2` Gerçek e-posta adresi: merhaba@kavruk.coffee, merhaba@kavruk.coffee.
- `-2` Şirket ya da yasal bilgi: Ltd. Şti
- `-3` Fiziksel adres: Kavruk Kahve Gıda Ltd. Şti. · Kurşunlu Sokak No: 14, Odunpazarı, Eskişehir · merhaba, Kurşunlu Sokak No: 14, Kurşunlu Sokak No: 14, Odunpazarı, Eskişehir.

## AI arama hazırlığı: 11/11 (100)
ChatGPT, Claude, Perplexity ve Gemini bunu okuyabiliyor, arkasında kimin olduğunu anlayıp alıntılayabiliyor mu? Ayrı bir puan; slop skorunu değiştirmez.

- ✓ **Yapısal veri (JSON-LD)** — 6 sayfanın 6 tanesinde
- ✓ **JavaScript olmadan okunabiliyor** — 6 sayfanın 6 tanesinde
- ✓ **Başlık ve açıklama** — 6 sayfanın 6 tanesinde
- ✓ **Link önizlemesi (Open Graph)** — 6 sayfanın 6 tanesinde
- ✓ **Asıl adres (canonical)** — 6 sayfanın 6 tanesinde
- ✓ **Tek ana başlık** — 6 sayfanın 6 tanesinde
- ✓ **Alıntılanabilir paragraflar** — 6 sayfanın 3 tanesinde
- ✓ **Yazar ve tarih** — 1 sayfanın 1 tanesinde
- ✓ **AI tarayıcılarına izin var** — hiçbiri engelli değil
- ✓ **llms.txt** — var
- ✓ **Site haritası** — var

## Notlar
- Site haritasında 6 sayfa bulundu.

## Sonraki adım
Öncelik sıralı dönüşüm planı için `slop_rescue_plan` aracını `scan_id: "s1"` ile çağırın, sonra değişimi ölçmek için yeniden tarayın.
Tek bir sayfanın kendi adımlarıyla tam raporu için `slop_page` aracını `scan_id: "s1"` ve sayfa yoluyla çağırın.
