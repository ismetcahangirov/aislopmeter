# AI Slop Meter

**Türkçe** · [English](README.md) · [Web sitesi](https://aislopmeter.netlify.app)

[![npm](https://img.shields.io/npm/v/aislopmeter?color=14232b)](https://www.npmjs.com/package/aislopmeter)
[![ci](https://github.com/omergocmen/aislopmeter/actions/workflows/ci.yml/badge.svg)](https://github.com/omergocmen/aislopmeter/actions/workflows/ci.yml)
[![lisans](https://img.shields.io/badge/lisans-MIT-14232b)](LICENSE)

**Bir sitedeki AI slop'u ölç. Sonra temizle.**

AI Slop Meter bir web sitesini, yerelde çalışan bir uygulamayı ya da web projesini *slop* açısından puanlar: genel geçer metin, AI site araçlarının varsayılan görünümü ve özensiz detaylar.

- Her puanın kanıtını dosya ve satırına kadar gösterir.
- Her bulgu için ne yapacağını söyler: adımlar ve yapay zekâna verebileceğin bir prompt.
- Sonra planı kendi yapay zekân (Claude, Cursor, Gemini CLI ve diğerleri) kodunda uygulayabilir.

Kendi bilgisayarında **MCP sunucusu**, **komut satırı aracı** ve **yer imi (bookmarklet)** olarak çalışır. API anahtarı ya da hesap gerekmez. Taramasını istediğin siteye yapılan istekler dışında hiçbir yere veri gönderilmez.

## Hızlı başlangıç

1. **Bir kez dene**, kurulum yok: `npx -y aislopmeter https://siten.com --lang tr --open`
2. **Yapay zekâna ekle** (Claude Code, bütün projeler için bir kez): `claude mcp add --scope user aislopmeter -- npx -y aislopmeter mcp`
3. **Söyle:** "Sitemi slop'tan kurtar, bitince raporu aç." Sorduğu soruları cevapla; düzeltir, tekrar tarar, önce/sonra farkını gösterir.

**[Kullanım kılavuzu](docs/KULLANIM.md)** her şeyi sırasıyla anlatıyor: bütün komutlar, MCP araçları, hazır tarifler (Lovable/Vite uygulamaları, Next.js, CI) ve sorun giderme.

## Tek tıkla kurulum

[![Cursor'a ekle](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=aislopmeter&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImFpc2xvcG1ldGVyIiwibWNwIl19)
[![VS Code'a kur](https://img.shields.io/badge/VS_Code-AI_Slop_Meter_kur-0098FF?logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22aislopmeter%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22aislopmeter%22%2C%22mcp%22%5D%7D)
[![Claude Desktop](https://img.shields.io/badge/Claude_Desktop-Eklentiyi_indir-14232b)](https://github.com/omergocmen/aislopmeter/releases/latest/download/aislopmeter.mcpb)

| Nerede | Nasıl |
|---|---|
| **Claude Code** | `claude mcp add --scope user aislopmeter -- npx -y aislopmeter mcp`<br>ya da kurtarma becerisiyle birlikte plugin olarak: `/plugin marketplace add omergocmen/aislopmeter`, sonra `/plugin install aislopmeter@aislopmeter` |
| **Claude Desktop** | [aislopmeter.mcpb](https://github.com/omergocmen/aislopmeter/releases/latest/download/aislopmeter.mcpb) dosyasını indir ve çift tıkla. Node.js gerekmez. |
| **Cursor** | Yukarıdaki düğme ya da aşağıdaki bloğu `~/.cursor/mcp.json` dosyasına ekle |
| **VS Code** | Yukarıdaki düğme ya da `.vscode/mcp.json` içine `"servers": { "aislopmeter": { "type": "stdio", "command": "npx", "args": ["-y", "aislopmeter", "mcp"] } }` |
| **Gemini CLI, Windsurf ve diğerleri** | Aşağıdaki bloğu aracın MCP ayarlarına ekle (Gemini CLI için `~/.gemini/settings.json`) |
| **Kurulumsuz** | `npx -y aislopmeter https://siten.com --open --lang tr` ya da [yer imi](#tarayıcıda-yer-imi) |

```json
{
  "mcpServers": {
    "aislopmeter": { "command": "npx", "args": ["-y", "aislopmeter", "mcp"] }
  }
}
```

Claude Desktop eklentisi dışında [Node.js](https://nodejs.org) 20 ya da üstü gerekir. Claude Code'daki `--scope user` bir kez kurar, bütün projelerinde çalışır. Sadece bir klasöre eklemek için o kısmı sil; ekibinle paylaşmak için `--scope project` kullan, `.mcp.json` dosyasına yazılır.

Sonra yapay zekâna yaz: **"https://sitem.com adresini AI slop açısından tara ve ne yapmam gerektiğini göster."**

| Önce: 83 / 100, saf slop | Sonra: 1 / 100, temiz |
|---|---|
| ![Önce](docs/img/before.png) | ![Sonra](docs/img/after.png) |

İki sayfa da [`examples/novaflow`](examples/novaflow) klasöründe. "Sonra" sayfası, kurtarma planının sorularına sahibin verdiği cevaplarla yeniden yazıldı ([FACTS.md](examples/novaflow/FACTS.md)). Ürün ve rakamlar kurgudur.

## Ne yapar

1. **Tarar.** Bütün bir web sitesini, `localhost`'ta çalışan bir uygulamayı, bir proje klasörünü (Next.js, Vite/React, Astro, Vue, Svelte, düz HTML, Markdown içerik…) ya da tek bir `.html` dosyasını tarar. Sitelerde sayfaları `sitemap.xml` ve iç linklerden bulur (`robots.txt`'ye uyar), varsayılan olarak 30 sayfaya kadar tarar (`--pages all` ile 200'e kadar) ve **her sayfaya kendi skorunu ve yapılacaklar listesini** verir. Birçok sayfada tekrarlanan bir sorun tek maddede, bulunduğu sayfaların listesiyle gösterilir.
2. **Sayfanın gerçekte nasıl göründüğüne bakar.** Sitenin kendi stil ve script dosyalarını okur. Bilgisayarında Chrome ya da Edge varsa sayfayı açıp ölçer: hesaplanmış renkler ve gerçek kontrast, gerçekten kullanılan fontlar, ne kadarının ortalandığı, kartların gerçekten birbirinin aynısı olup olmadığı, satır uzunluğu ve yazı boyutu, taşan ya da başka öğenin altında kalan içerik, sayfa açılırken çıkan hatalar. Tarayıcı yoksa HTML ve CSS ile çalışmaya devam eder.
3. **Puanlar.** Araştırmaya dayalı 80'den fazla kontrolle beş alana puan verir ([kriterler ve kaynaklar](docs/CRITERIA.md)):
   - **İçerik özü:** somut bilgi, doğrulanabilir iddia, gerçek kanıt, içinde gerçekten iş olan bir portfolyo
   - **Dil kalıpları:** klişeler, kalıp başlıklar, "sadece X değil, Y", hazır buton ve kısa metinler
   - **Şablon tasarım:** mor gradyan, parlama, emoji ve hazır ikonlar, standart açılış sayfası ve portfolyo şablonları, Tailwind'in varsayılan renkleri, ızgara desenli arka planlar, her başlığın üstündeki küçük etiketler, zıplayan ve yanıp sönen hareketler, kart içinde kart ve kendi `DESIGN.md` dosyandan sapmalar
   - **Özensiz detaylar:** lorem ipsum, `href="#"`, "Vite + React + TS", sohbet botu kalıntıları, JavaScript olmadan boş kalan sayfalar, kırık görseller, yükleme hataları, çok küçük, çok uzun satırlı ya da başka öğenin altında kalan metin
   - **Üretici izleri:** Lovable, Bolt, v0, Replit, Base44 (yalnızca bilgi)
   - Ayrıca ayrı bir **AI arama hazırlığı** puanı: ChatGPT, Claude, Perplexity ve Gemini sayfayı okuyabiliyor, arkasında kimin olduğunu anlayıp alıntılayabiliyor mu (JSON-LD, AI tarayıcıları için robots.txt, `llms.txt`, site haritası, JavaScript olmadan okunabilirlik, alıntılanabilir paragraflar)
4. **Her bulgu için ne yapacağını söyler:** tek satırlık düzeltme, numaralı adımlar, tam `dosya:satır` konumları ve sitenin kendi cümleleri, önce/sonra örneği, "bitti sayılır" kontrolü ve **Yapay zekân için prompt olarak kopyala** düğmesi.
5. **Siteye göre kurtarma planı çıkarır:** önce sitenin türüne uygun sorular (yapay zekâ bilgi uydurmasın diye), sonra temizlik, metin, tasarım ve güven adımları; her birinin tahmini skoruyla.
6. **Gösterir ve yeniden ölçer.** **Rapor**, **Yapılacaklar** ve sitelerde **Sayfalar** ekranlı görsel rapor yazar; her değişiklikten sonra önce/sonra tablosu verir.

| Rapor | Yapılacaklar |
|---|---|
| ![Rapor ekranı](docs/img/report-tr.png) | ![Yapılacaklar ekranı](docs/img/plan-tr.png) |

Her bulgu aynı "ne yapmalısın" kutusuyla açılır:

![Adımlar, önce/sonra örneği, tam satırlar ve prompt kopyalama düğmesiyle bir bulgu](docs/img/findings-tr.png)

## Yapay zekânla kullanım

> Projemi AI slop açısından tara ve neyi düzeltmem gerektiğini göster.
> https://sitem.com adresini slop'tan kurtar, bitince raporu tarayıcımda aç.

**`rescue` prompt'u** tüm döngüyü çalıştırır. Claude Code'da adı `/mcp__aislopmeter__rescue`. Yapay zekâ sırasıyla:

1. Bitince raporu tarayıcında açıp açmayacağını bir kere sorar. Böylece bilgisayarın başından kalkabilirsin.
2. Hedefi tarar; en önemli üç bulguyu ve sitelerde en kötü üç sayfayı özetler.
3. Planı çıkarır ve sahibine sorulacak soruları tek mesajda sorar.
4. Planı aşama aşama uygular. Projede tam `dosya:satır` konumlarını düzenler, canlı bir URL için yeniden yazılmış metni ve tasarım tarifini verir.
5. Her aşamadan sonra hedef skora (varsayılan 20) inene kadar yeniden tarar.
6. Görsel raporu yazar, izin verdiysen açar ve önce/sonra özetini verir.

Küçük adımlarla ilerlemek istersen **`fix` prompt'u** (`/mcp__aislopmeter__fix`) sadece en önemli sorunu düzeltir, yeniden tarar, neyin değiştiğini gösterir ve sıradakini önerir.

| Araç | Ne yapar |
|---|---|
| `slop_scan` | Web sitesini (`pages` kadar sayfa, varsayılan 30, en fazla 200), `localhost` uygulamasını, klasörü ya da `.html` dosyasını tarar. Görsel raporu yazar, `open_report` ile açar. Aynı hedef yeniden tarandığında otomatik karşılaştırır. |
| `slop_scan_html` | Yapıştırılmış ya da üretilmiş HTML'i tarar. |
| `slop_rescue_plan` | Taramayı siteye özel, aşamalı plana çevirir; `keep` ve `target_score` alır. |
| `slop_page` | Site taramasındaki tek bir sayfanın tam raporu. |
| `slop_fix` | Tek bir bulgu için adım adım talimat; istersen tek bir `page` için. |
| `slop_report` | Görsel raporu yazar ya da açar. |
| `slop_compare` | İki tarama arasında önce/sonra karşılaştırması. |
| `slop_guide` | Rehberler: `criteria`, `playbook`, `copy`, `design`, `interview` (MCP kaynağı olarak da: `aislopmeter://guide/...`). |

## Yerel uygulamalar (localhost, proje klasörü)

AI Slop Meter senin bilgisayarında çalıştığı için henüz yayında olmayan bir uygulamayı da kontrol edebilir. Üç yolu var, birlikte kullanınca en iyi sonucu verir.

**1. Çalışan geliştirme sunucusu.** Uygulamanı başlat (`npm run dev`), sonra adresini tara. `localhost` http ile açılır ve canlı bir site gibi dolaşılır.
```bash
npx -y aislopmeter localhost:3000 --open --lang tr            # bütün uygulama, en fazla 30 sayfa
npx -y aislopmeter localhost:5173/fiyatlar --pages 1 --lang tr  # tek sayfa
```
Vite, Create React App ve diğer tek sayfalık uygulamalar önce boş bir `<div id="root">` gönderir. AI Slop Meter bunları senin Chrome ya da Edge'inle çizer, yani skor gerçekten gördüğün sayfaya göre çıkar. Bu uygulamalar `client-shell` bulgusunu da alır: önceden oluşturmazsan arama motorları da aynı boş sayfayı görür.

**2. Proje klasörü.** Bulgular kaynak kodundaki `dosya:satır` ile gelir. Yapay zekânın düzenleyeceği yer burası.
```bash
cd uygulamam
npx -y aislopmeter . --plan --lang tr
```

**3. Derlenmiş site.** Statik sitelerde yayına çıkacak dosyaları tara.
```bash
npm run build
npx -y aislopmeter ./dist --open --lang tr
```

**Yapay zekânla:**

> Uygulamam localhost:3000'de çalışıyor, kodu bu klasörde. İkisini de AI slop açısından tara, kodda düzelt ve her adımdan sonra localhost'u yeniden tara.

Çevrimiçi araçlar `localhost`'a ulaşamaz; bu araç senin bilgisayarında çalıştığı için ulaşır. Hiçbir şey dışarı yüklenmez.

## Tarayıcıda (yer imi)

Baktığın sayfayı hiçbir şey kurmadan tara. Yeni bir yer imi oluştur ve adres kısmına bunu yapıştır:

```text
javascript:(()=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/aislopmeter@0/dist/aislopmeter.browser.js';s.onload=()=>AISlopMeter.overlay();document.head.appendChild(s)})()
```

Herhangi bir sayfada tıkla: skoru, en önemli bulguları ve her biri için "yapay zekâ için kopyala" düğmesini gösteren bir panel açılır. Tek sayfaya bakar; bütün site ve `dosya:satır` için komut satırını ya da MCP'yi kullan. Bazı siteler dışarıdan script'i engeller (Content-Security-Policy); orada yer imi çalışmaz.

## Komut satırı

```bash
npx -y aislopmeter https://ornek.com                  # bütün site, en fazla 30 sayfa
npx -y aislopmeter https://ornek.com --pages all      # en fazla 200 sayfa
npx -y aislopmeter https://ornek.com --pages 1        # sadece bu sayfa
npx -y aislopmeter ./projem --plan --lang tr          # proje klasörü ve Türkçe kurtarma planı
npx -y aislopmeter ./projem --open                    # görsel raporu yaz ve aç
npx -y aislopmeter ./projem --render never            # tarayıcısız, sadece HTML ve CSS
npx -y aislopmeter ./projem --json                    # ham sonuç
```

Raporlar `~/.aislopmeter/reports/` klasörüne yazılır (`AISLOPMETER_REPORT_DIR` ile değişir).

**Tarayıcı kullanımı.** `--render auto` (varsayılan) ile ve bilgisayarda Chrome, Edge ya da Chromium varsa sayfalar `playwright-core` üzerinden tarayıcıda da ölçülür; hiçbir şey indirilmez. Tarayıcı bulunamazsa `AISLOPMETER_CHROME` ile yolunu göster, hiç açılmasın istersen `AISLOPMETER_BROWSER=off` kullan.

Klasör taramasında `node_modules`, gizli klasörler ve `components/ui` içindeki hazır bileşenler atlanır. Taranan klasörün en üst seviyesindeki `dist`, `build`, `out`, `test`, `docs`, `examples` ve README, CHANGELOG gibi depo belgeleri de atlanır. Bunlardan birini taramak için doğrudan onu göster; başka bir yolu dışarıda bırakmak için `--ignore yol1,yol2` kullan.

## Rozet ve GitHub Action

Skorunu README'nde göster:

```bash
npx -y aislopmeter . --badge aislopmeter.svg
```

```markdown
![AI slop](aislopmeter.svg)
```

Her pull request'i kontrol et, rapor iş özetine yazılsın:

```yaml
- uses: actions/checkout@v4
- uses: omergocmen/aislopmeter@v0
  with:
    target: .            # ya da bir önizleme URL'i
    fail-above: 40       # isteğe bağlı
    lang: tr
```

Action ayrıca `score` ve `band` çıktılarını verir. Komut satırında `--fail-above 40` sınırın üstünde 1 koduyla çıkar.

## Yapılandırma

Sana uymayan bir kontrolü kapatmak ya da varsayılanları belirlemek için projene (ya da komutu çalıştırdığın klasöre) bir `.aislopmeter.json` koy:

```json
{
  "disable": ["purple-gradient"],
  "keep": "Logomuzun moru ve hero fotoğrafı",
  "ignore": ["legacy"],
  "lang": "tr",
  "pages": 30,
  "failAbove": 40
}
```

`disable` rapordaki kontrol id'lerini alır. `keep` kurtarma planına "dokunma" olarak geçer. Rapor hangi kontrollerin kapatıldığını yazar. `--no-config` dosyayı yok sayar.

## Skor nasıl hesaplanır

Her bulgu puan ekler ve her kategorinin bir tavanı vardır:

| Kategori | Tavan |
|---|---|
| İçerik özü | 30 |
| Dil | 22 |
| Tasarım | 28 |
| Özensiz detaylar | 15 |
| Üretici izleri | 5 |

Arkasında gerçek bir işletme ya da kişi olduğunu gösteren işaretler skoru düşürür: adres, isimli kişiler, fiyat, yasal bilgi, bağımsız yorum linkleri.

Yüksek skor için birden fazla alanda sorun olmalı: sadece bir alanda sorun varsa skor 35, iki alanda varsa 60 ile sınırlanır. Sadece mor bir marka rengi asla yoğun slop sayılmaz. Sitelerde skorun yarısı ortalama sayfadan (ana sayfa iki kat, yasal metin ve giriş sayfaları hariç), yarısı en kötü sayfadan gelir.

| Skor | Bant |
|---|---|
| 0–19 | temiz |
| 20–39 | iz miktarda |
| 40–59 | belirgin |
| 60–79 | yoğun |
| 80–100 | saf slop |

Neden yapay zekâ hakem değil de kurallar? Bu konudaki en kapsamlı çalışmada "bu slop mu?" diye sorulan dil modellerinin insan editörlerle uyumu κ ≈ 0 çıktı. İnsan yargısını en iyi bilgi yoğunluğu ve alakalılık açıklıyordu. Bu yüzden AI Slop Meter açıklanabilir kurallarla ölçer, senin yapay zekânı yalnızca düzeltmek için kullanır.

## Ne değildir

- **AI ile yazıldığını tespit eden bir araç değildir.** Tamamen AI ile yapılmış bir sayfa temiz çıkabilir, elle yazılmış bir sayfa yüksek skor alabilir.
- **Arama sıralaması tahmini değildir.** Kontroller Google'ın faydalı içerik ve spam yönergelerine dayanır ama skor bir sıralama değildir.
- **Türkçe listeler yeni.** Türkçe kaynaklardan ve İngilizce işaretlerin karşılıklarından derlendi; ayar katkısı memnuniyetle karşılanır.
- **Şimdiye kadar 34 gerçek sitede ayarlandı.** AI araçlarıyla yapılan sayfaların medyan puanı 25, elle yapılanlarınki 12 civarında; elle yapılmış hiçbir sayfa 20'ye ulaşmadı ([yöntem ve siteler](docs/CALIBRATION.md)).

## Gizlilik

Her şey yerelde çalışır.
- **URL taraması:** yalnızca gösterdiğin sitenin sayfalarını çeker, `robots.txt`'ye uyar ve sayfa sınırında durur.
- **Klasör taraması:** dosyaları yalnızca okur, hiçbirini değiştirmez.
- **Raporlar:** yalnızca senin bilgisayarına, `~/.aislopmeter/reports/` klasörüne yazılır.
- **Telemetri yok.** Yapay zekâ istemcin, her araç çıktısında olduğu gibi rapor metnini görür.

## Katkı

[CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bak: yeni kontrol nasıl eklenir, ayar nasıl çalışır, yanlış skor nasıl bildirilir. En çok işe yarayanlar: gerçek, elle yapılmış sitelerdeki yanlış alarmlar ve Türkçe kelime listeleri.

## Lisans

MIT
