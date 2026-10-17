# AI Slop Meter kullanım kılavuzu

[English](USAGE.md) · [README](../README.tr.md)

Bu kılavuz sırayla ilerler: önce kurulum, sonra ilk tarama, raporu okuma, yapay zekâna düzelttirme ve tekrar ölçme. Sonda bütün komutların ve araçların tam listesi, hazır tarifler ve sorun giderme var.

- [1. Hangi yolu seçmeliyim?](#1-hangi-yolu-seçmeliyim)
- [2. Adım adım: ilk taramadan temiz sayfaya](#2-adım-adım-ilk-taramadan-temiz-sayfaya)
- [3. Yapay zekâna ne demelisin (örnek cümleler)](#3-yapay-zekâna-ne-demelisin)
- [4. MCP araçları ve sırası](#4-mcp-araçları-ve-sırası)
- [5. Komut satırı (CLI) tam liste](#5-komut-satırı-cli)
- [6. Hazır tarifler](#6-hazır-tarifler)
- [7. Ayar dosyası ve ortam değişkenleri](#7-ayar-dosyası-ve-ortam-değişkenleri)
- [8. Sorun giderme](#8-sorun-giderme)

---

## 1. Hangi yolu seçmeliyim?

Üç kullanım şekli var, aynı ölçümü yapar:

| Ne istiyorsun | Kullan | Neden |
|---|---|---|
| Yapay zekân (Claude, Cursor…) taray, planlasın, kodu düzeltsin | **MCP** | Bulguları dosya ve satırıyla görür, düzeltip tekrar ölçer |
| Hızlıca bir puan görmek, raporu tarayıcıda açmak | **CLI** (`npx`) | Kurulum yok, tek komut |
| Şu an baktığın sayfaya bir tıkla puan vermek | **Bookmarklet** | Hiçbir şey kurmadan, tarayıcıdan |
| Her pull request'te kontrol | **GitHub Action** | Skor limiti aşılırsa CI kırmızı olur |

Çoğu kişi için doğru sıra: önce CLI ile bir kez dene, beğenirsen MCP olarak kur ve işi yapay zekâna bırak.

**Gereken:** Node.js 20 ya da üstü (Claude Desktop eklentisi hariç). Chrome veya Edge kuruluysa ölçüm daha doğru olur (renkler, kontrast, fontlar gerçekten tarayıcıda ölçülür); yoksa da çalışır.

---

## 2. Adım adım: ilk taramadan temiz sayfaya

### Adım 1: Kur (bir kez)

**Claude Code** (bütün projelerinde çalışır):
```
claude mcp add --scope user aislopmeter -- npx -y aislopmeter mcp
```
Sadece bu klasörde istiyorsan `--scope user` kısmını sil. Ekiple paylaşmak için `--scope project` (bir `.mcp.json` dosyası oluşturur, repoya girer).

**Claude Desktop:** [aislopmeter.mcpb](https://github.com/omergocmen/aislopmeter/releases/latest/download/aislopmeter.mcpb) dosyasını indir, çift tıkla. Node.js gerekmez.

**Cursor / VS Code:** README'deki tek tık butonları, ya da ayar dosyasına şu blok:
```json
{
  "mcpServers": {
    "aislopmeter": { "command": "npx", "args": ["-y", "aislopmeter", "mcp"] }
  }
}
```
Cursor için `~/.cursor/mcp.json` (her projede), VS Code için `.vscode/mcp.json` (orada anahtar `"servers"`), Gemini CLI için `~/.gemini/settings.json`.

Kurulduğunu kontrol et: Claude Code'da `/mcp` yaz, listede `aislopmeter` görünmeli. Yeni eklediysen editörü bir kez yeniden başlat.

### Adım 2: İlk taramayı yap

Yapay zekâna yaz:
```
https://siten.com adresini AI slop açısından tara, en önemli üç sorunu söyle.
```
ya da terminalde:
```
npx -y aislopmeter https://siten.com --lang tr --open
```
Site için en fazla 30 sayfa taranır (site haritası ve iç linklerden bulunur, robots.txt'ye uyulur). Her sayfanın kendi puanı olur.

### Adım 3: Raporu oku

Puan 0-100 arası; yüksek = daha çok slop.

| Puan | Anlamı |
|---|---|
| 0–19 | temiz |
| 20–39 | iz düzeyinde |
| 40–59 | belirgin |
| 60–79 | yoğun |
| 80–100 | saf slop |

Görsel raporda üç ekran var:
- **Rapor:** puan, beş alanın çubukları, bulgular (en çok puan getiren en üstte). Her bulguda kanıt ve dosya:satır var.
- **Ne yapmalı:** kontrol listesi, tahmini süreler, sahibine sorulacak sorular.
- **Sayfalar** (site taramasında): her sayfanın puanı, en kötüsü en üstte.

Raporun altında ayrıca **AI arama hazırlığı** puanı var (0-100). ChatGPT, Claude, Perplexity ve Gemini sayfayı okuyabiliyor mu, kimin olduğunu anlayabiliyor mu, alıntılayabiliyor mu diye 11 maddeye bakar: JSON-LD yapısal veri, JavaScript olmadan okunabilirlik, başlık ve açıklama, Open Graph, canonical, tek h1, yazar ve tarih, alıntılanabilir paragraflar, robots.txt'nin AI arama tarayıcılarına açık olması, `llms.txt` ve site haritası. Slop skorunu değiştirmez; eksikler kurtarma planında ayrı bir aşama olarak çıkar.

Her bulgunun yanında **"Prompt olarak kopyala"** düğmesi var: o tek sorunu düzeltmek için yapay zekâna yapıştırabileceğin hazır metin.

### Adım 4: Düzelt

İki yol var:

**Hepsini planla (önerilen):**
```
Sitemi slop'tan kurtar. Bitince raporu tarayıcımda aç.
```
Yapay zekân önce sana tek mesajda sorular sorar (kime hitap ediyorsun, gerçek fiyatlar, müşteri yorumları, kim yapıyor…). **Bunları cevapla**: araç uydurma bilgi yazdırmaz, gerçek bilgi olmadan metin düzelmez. Sonra aşama aşama ilerler: temizlik → metin → tasarım → güven. Her aşamadan sonra tekrar ölçer.

**Tek tek, küçük adımlarla:**
```
En önemli slop sorununu düzelt, tekrar tara, ne değiştiğini göster.
```
Her seferinde bir sorun düzelir, sonra sıradakini önerir.

Korumak istediğin bir şey varsa baştan söyle: "Logo ve mor marka rengi kalsın."

### Adım 5: Tekrar ölç

Aynı hedefi tekrar taradığında rapor neyin düştüğünü, neyin açık kaldığını ve neyin yeni çıktığını gösterir:
```
Tekrar tara ve öncesiyle karşılaştır.
```
Hedef varsayılan olarak 20'nin altı.

### Adım 6: Temiz kalsın (isteğe bağlı)

- README'ye rozet: `npx -y aislopmeter . --badge aislopmeter.svg`
- Her PR'da kontrol: [GitHub Action](#github-action)

---

## 3. Yapay zekâna ne demelisin

Bunları olduğu gibi yazabilirsin. Türkçe yazarsan rapor Türkçe gelir.

| Ne istiyorsun | Yaz |
|---|---|
| Sadece puan | `https://siten.com için slop skorunu ver.` |
| Bütün site, sayfa sayfa | `https://siten.com sitesinin bütün sayfalarını tara, en kötü 3 sayfayı ve nedenlerini söyle.` |
| Tek sayfa | `Sadece https://siten.com/fiyatlar sayfasını tara.` |
| Proje klasörü | `Bu projeyi AI slop açısından tara, dosya ve satırlarıyla göster.` |
| Çalışan yerel uygulama | `localhost:3000'de çalışan uygulamamı tara, kodu bu klasörde. Kodda düzelt, her adımdan sonra localhost'u tekrar tara.` |
| Kurtarma planı | `Bu tarama için kurtarma planı çıkar, hedef 15. Logo ve renkler kalsın.` |
| Tek bulgu | `"dead-links" bulgusunu nasıl düzeltirim, adım adım?` |
| Tek sayfanın detayı | `/hakkimizda sayfasının raporunu göster.` |
| Önce/sonra | `İlk tarama ile son taramayı karşılaştır.` |
| Görsel rapor | `Raporu tarayıcımda aç.` |
| Kuralları öğrenmek | `AI Slop Meter neye göre puan veriyor? Kriterleri göster.` |
| Yapıştırdığın HTML | `Şu HTML'i slop açısından tara: <html>…` |
| AI arama | `ChatGPT ve Claude sitemi okuyabiliyor mu? AI arama hazırlığını göster ve eksikleri tamamla.` |
| Tasarım sistemi | `Bu projede DESIGN.md var; dışına çıkan renk, font ve köşeleri bul, düzelt.` |

**Hazır komutlar.** İki hazır prompt var; Claude Code'da `/` yazınca görünür:
- `/mcp__aislopmeter__rescue`: tarar, soruları sorar, planı uygular, hedef puana kadar tekrar ölçer.
- `/mcp__aislopmeter__fix`: sadece en önemli sorunu düzeltir, tekrar tarar, farkı gösterir.

Claude Desktop'ta bunlar "+" menüsünde, MCP prompt desteği olan diğer araçlarda kendi prompt menülerinde. Desteklemeyen araçlarda yukarıdaki cümleleri yazman yeterli.

**Plugin olarak (Claude Code):** `/plugin marketplace add omergocmen/aislopmeter` ve `/plugin install aislopmeter@aislopmeter`. Bu, MCP'ye ek olarak bir "rescue" becerisi kurar; "sitem çok AI kokuyor" gibi bir şey dediğinde Claude kendiliğinden doğru sırayla çalışır.

---

## 4. MCP araçları ve sırası

Yapay zekân bunları kendisi çağırır; ne yaptıklarını bilmek neyi isteyebileceğini gösterir. Tipik sıra:

```
slop_scan ──► slop_rescue_plan ──► (slop_fix / slop_page, düzelt) ──► slop_scan ──► slop_compare ──► slop_report
```

| Araç | Ne yapar | Önemli parametreler |
|---|---|---|
| `slop_scan` | URL, localhost, klasör ya da .html tarar; bir tarama no verir (`s1`, `s2`…) | `target`, `pages` (1–200, varsayılan 30), `render` (`auto`/`always`/`never`), `lang`, `ignore`, `open_report` |
| `slop_scan_html` | Yapıştırılmış ya da üretilmiş HTML'i tarar | `html`, `url`, `label` |
| `slop_rescue_plan` | Taramayı aşamalı plana çevirir: sorular, temizlik, metin, tasarım, güven | `scan_id`, `keep`, `target_score` (varsayılan 20) |
| `slop_fix` | Tek bulgu için adımlar, dosya:satır, önce/sonra örneği | `scan_id`, `finding_id` (boşsa en önemlisi), `page` |
| `slop_page` | Site taramasında tek sayfanın tam raporu | `scan_id`, `page` (`/fiyatlar` ya da tam URL) |
| `slop_compare` | İki taramanın farkı | `before_id`, `after_id` |
| `slop_report` | Görsel raporu yazar, istersen açar | `scan_id`, `open` |
| `slop_guide` | Kriterler, yöntem, metin ve tasarım rehberleri | `topic`: `criteria`, `playbook`, `copy`, `design`, `interview` |

Notlar:
- Aynı hedef aynı oturumda tekrar taranırsa karşılaştırma otomatik eklenir.
- Rapor dosyaları `~/.aislopmeter/reports/` klasörüne yazılır; `open_report` sadece sen izin verirsen `true` olur.
- Tarama numaraları oturuma özeldir; MCP sunucusu yeniden başlarsa `s1`'den başlar.

---

## 5. Komut satırı (CLI)

```
npx -y aislopmeter <hedef> [seçenekler]
npx -y aislopmeter mcp            # MCP sunucusu olarak çalıştır (editörler bunu kullanır)
```

`<hedef>` şunlardan biri olabilir:

| Hedef | Örnek | Ne olur |
|---|---|---|
| Canlı site | `https://siten.com` | 30 sayfaya kadar tarar, her sayfaya puan |
| Tek sayfa | `https://siten.com/fiyatlar --pages 1` | Sadece o sayfa |
| Yerel uygulama | `localhost:3000` | http ile açılır, site gibi taranır |
| Proje klasörü | `.` ya da `./my-app` | Kaynak dosyaları okur, bulgular dosya:satır ile |
| Build çıktısı | `./dist` | Yayınlanacak dosyalar |
| Tek HTML dosyası | `./index.html` | Tek sayfa |

### Seçenekler

| Seçenek | Ne yapar | Örnek |
|---|---|---|
| `--pages <n\|all>` | Site: kaç sayfa (varsayılan 30, `all` = 200'e kadar, `1` = sadece bu sayfa) | `--pages all` |
| `--render <mod>` | `auto` (varsayılan): Chrome/Edge varsa onunla ölç ve JavaScript'le çizilen sayfaları aç. `always`: her sayfayı tarayıcıda aç. `never`: sadece HTML ve CSS | `--render never` |
| `--lang <en\|tr>` | Rapor dili | `--lang tr` |
| `--plan` | Kurtarma planını da yazdır | `--plan` |
| `--html` | Görsel raporu yaz, yolunu yazdır | `--html` |
| `--open` | Görsel raporu yaz ve tarayıcıda aç | `--open` |
| `--json` | Ham sonucu JSON olarak yazdır | `--json` |
| `--json-file <dosya>` | Ham sonucu ayrıca dosyaya yaz | `--json-file sonuc.json` |
| `--badge <dosya>` | Rozet yaz: `.svg` ya da shields.io için `.json` | `--badge aislopmeter.svg` |
| `--fail-above <n>` | Puan n'den büyükse çıkış kodu 1 (CI için) | `--fail-above 40` |
| `--ignore <a,b>` | Klasör: atlanacak alt yollar | `--ignore docs,src/legacy` |
| `--include-ui` | Klasör: `components/ui` (shadcn) dosyalarını da tara | `--include-ui` |
| `--no-config` | `.aislopmeter.json` dosyasını yok say | `--no-config` |
| `-v`, `--version` | Sürümü yazdır | |
| `-h`, `--help` | Yardım | |

**Çıkış kodları:** `0` tamam, `1` puan `--fail-above` limitini aştı, `2` hata (hedef bulunamadı, site açılmadı, yanlış seçenek).

**Klasör taramasında otomatik atlananlar:** `node_modules`, gizli klasörler, `components/ui`; klasörün en üstündeki `dist`, `build`, `out`, `test`, `docs`, `examples` ve README/CHANGELOG gibi repo belgeleri. Bunlardan birini taramak istersen doğrudan onu hedef ver (`./dist`).

**Windows PowerShell:** Komutları `&&` ile birleştirme (PowerShell 5 desteklemez); her birini ayrı satırda çalıştır ya da `;` kullan. Boşluklu yolları tırnağa al: `npx -y aislopmeter "C:\Projeler\benim site"`.

---

## 6. Hazır tarifler

### Canlı siteyi baştan sona incele
```
npx -y aislopmeter https://siten.com --pages all --lang tr --open
```

### Sadece ana sayfa, hızlı
```
npx -y aislopmeter https://siten.com --pages 1
```

### Lovable / Bolt / v0 ile yaptığın uygulama (Vite, React)
Bu uygulamalar ilk anda boş bir `<div id="root">` gönderir. Chrome/Edge kuruluysa sayfa tarayıcıda açılıp gerçekten görünen hali ölçülür.
```
npm run dev
npx -y aislopmeter localhost:5173 --open
npx -y aislopmeter . --plan --lang tr
```
İlki ekranda göreni ölçer, ikincisi bulguları kaynak dosyalarında satırıyla gösterir. Yapay zekâna ikisini birlikte ver: "localhost:5173'te çalışıyor, kodu bu klasörde. Kodda düzelt, localhost'u tekrar tara."

### Next.js / Astro / statik site
```
npm run build
npx -y aislopmeter ./out --open        # Next.js static export
npx -y aislopmeter ./dist --open       # Astro, Vite
```

### Önce / sonra kaydı tut
```
npx -y aislopmeter https://siten.com --json-file once.json --badge once.svg
# … değişiklikler …
npx -y aislopmeter https://siten.com --json-file sonra.json --badge sonra.svg
```
MCP içinde aynı hedefi tekrar taramak karşılaştırmayı kendisi yapar.

### README rozeti
```
npx -y aislopmeter . --badge aislopmeter.svg
```
README'ye: `![AI slop](aislopmeter.svg)`

### GitHub Action
`.github/workflows/slop.yml`:
```yaml
name: slop
on: [pull_request]
jobs:
  slop:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: omergocmen/aislopmeter@v0
        with:
          target: .          # ya da önizleme URL'in
          fail-above: 40     # isteğe bağlı
          lang: tr
```
Rapor işin özetine (job summary) yazılır; `score` ve `band` çıktı olarak da gelir.

### Bookmarklet (kurulum yok)
Yeni bir yer imi oluştur, adresine bunu yapıştır:
```
javascript:(()=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/aislopmeter@0/dist/aislopmeter.browser.js';s.onload=()=>AISlopMeter.overlay();document.head.appendChild(s)})()
```
Herhangi bir sayfada tıkla: puan, en önemli bulgular ve her biri için "yapay zekâna kopyala" düğmesi çıkar. Tek sayfa ölçer; bütün site ve dosya:satır için CLI ya da MCP kullan. Dış script'leri engelleyen sitelerde (Content-Security-Policy) çalışmaz.

---

## 7. Ayar dosyası ve ortam değişkenleri

Projenin köküne (ya da komutu çalıştırdığın klasöre) `.aislopmeter.json`:
```json
{
  "disable": ["purple-gradient"],
  "keep": "Logomuzun moru ve ana sayfa fotoğrafı",
  "ignore": ["legacy"],
  "lang": "tr",
  "pages": 30,
  "targetScore": 20,
  "failAbove": 40,
  "design": "docs/DESIGN.md"
}
```

| Anahtar | Ne yapar |
|---|---|
| `disable` | Kapatılacak kontroller (id'ler raporda yazar, örn. `purple-gradient`, `em-dash`) |
| `keep` | Kurtarma planına "buna dokunma" olarak gider |
| `ignore` | Klasör taramasında atlanacak yollar |
| `lang` | Varsayılan rapor dili |
| `pages` | Varsayılan sayfa sayısı |
| `targetScore` | Kurtarma planının hedefi |
| `render` | `auto`, `always` ya da `never` |
| `failAbove` | CLI ve Action için limit |
| `design` | Karşılaştırılacak tasarım dosyası. Klasör taramasında kökteki ya da `docs/` içindeki `DESIGN.md` kendiliğinden bulunur; site taramasında burada belirt |

**DESIGN.md.** Projende renkleri, yazı tiplerini ve köşe yarıçaplarını yazdığın bir `DESIGN.md` varsa, araç stil dosyalarında bu listenin dışına çıkan değerleri `design-drift` bulgusu olarak gösterir. Biçim serbest: renkler hex kodu olarak, yazı tipleri tırnak içinde, yarıçaplar px olarak yazılsın yeter. Örnek: [examples/kavruk/after/DESIGN.md](../examples/kavruk/after/DESIGN.md).

Rapor, hangi kontrollerin kapatıldığını yazar. `--no-config` dosyayı yok sayar.

**Ortam değişkenleri**

| Değişken | Ne yapar |
|---|---|
| `AISLOPMETER_CHROME` | Chrome/Edge bulunamazsa yolunu ver (`C:\Program Files\Google\Chrome\Application\chrome.exe`) |
| `AISLOPMETER_BROWSER=off` | Tarayıcıyı hiç açma |
| `AISLOPMETER_REPORT_DIR` | Raporların yazılacağı klasör |
| `AISLOPMETER_DEBUG=1` | Hata veren kontrolleri konsola yazdır |

---

## 8. Sorun giderme

| Belirti | Neden ve çözüm |
|---|---|
| Editörde `aislopmeter` araçları görünmüyor | Editörü yeniden başlat. Claude Code'da `/mcp` ile durumuna bak. `node -v` 20 ya da üstü olmalı. |
| Eski sürüm çalışıyor | npx önbelleği: `npx -y aislopmeter@latest …` ya da MCP ayarında `"args": ["-y", "aislopmeter@latest", "mcp"]` |
| Raporda tarayıcı ölçümü yok | Chrome ya da Edge kur, ya da `AISLOPMETER_CHROME` ile yolunu ver. Tarayıcısız da çalışır, sadece renk ve kontrast ölçümü tahmini olur. |
| Sayfa boş görünüyor, kelime sayısı çok düşük | JavaScript ile çizilen sayfa ve tarayıcı yok. Chrome/Edge kur ya da `--render always` dene. |
| `localhost` açılmıyor | Geliştirme sunucusu çalışıyor mu? Portu doğru yaz (`localhost:5173`). |
| Bazı sayfalar taranmadı | robots.txt engelliyor ya da sayfa sınırına geldin: `--pages all`. |
| Site 403 veriyor | Bazı siteler bot isteklerini engeller. Kendi sitense proje klasörünü tara. |
| Bookmarklet bir şey yapmıyor | Site dış script'leri engelliyor (CSP). CLI kullan. |
| Bir bulgu bence yanlış | `.aislopmeter.json` içinde `disable` ile kapat ve lütfen [yanlış alarm bildir](https://github.com/omergocmen/aislopmeter/issues/new?template=false-alarm.yml). |
| PowerShell'de `&&` hatası | PowerShell 5'te yok; komutları ayrı satırlarda çalıştır. |

Hâlâ takıldıysan: [issue aç](https://github.com/omergocmen/aislopmeter/issues).
