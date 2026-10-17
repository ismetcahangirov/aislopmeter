// What to actually do about each finding: short numbered steps, a "done when" check,
// and for copy problems a before/after example. Used by the visual report, the markdown
// report (so the AI gets the same instructions) and the slop_fix tool.
const t = (en, tr) => ({ en, tr });

const A = {
  /* ---------- substance ---------- */
  specificity: {
    steps: [
      t('Pick the three vaguest sentences on the page (the ones that would fit any company).', 'Sayfadaki en genel üç cümleyi seçin (her şirkete uyabilecek olanlar).'),
      t('For each, write one fact only you can say: a number, a place, a customer, a date, a price, a name.', 'Her biri için sadece sizin söyleyebileceğiniz bir bilgi yazın: rakam, yer, müşteri, tarih, fiyat ya da isim.'),
      t('If there is no fact behind a sentence, delete it. A shorter page is better than a vaguer one.', 'Bir cümlenin arkasında bilgi yoksa silin. Kısa bir sayfa, belirsiz bir sayfadan iyidir.'),
    ],
    done: t('A stranger can tell what you sell, to whom, where and for how much from the first screen.', 'İlk ekrana bakan biri ne sattığınızı, kime, nerede ve kaça sattığınızı anlayabiliyor.'),
    example: t('Before: "We deliver innovative solutions that drive growth." After: "We fix leaking flat roofs in Leeds, usually within 48 hours, from £180."',
      'Önce: "Büyümeyi hızlandıran yenilikçi çözümler sunuyoruz." Sonra: "Kadıköy\'de düz çatı sızıntılarını genelde 48 saatte, 4.500 TL\'den başlayan fiyatla onarıyoruz."'),
  },
  inflation: {
    steps: [
      t('Find each "crucial / revolutionary / game-changing" word listed under evidence.', 'Kanıtta listelenen her "kritik / devrim niteliğinde / çığır açan" kelimesini bulun.'),
      t('Replace the adjective with what actually happened: for whom, how much, by when. Or just delete the adjective.', 'Sıfatın yerine gerçekte ne olduğunu yazın: kimin için, ne kadar, ne zamana kadar. Ya da sıfatı silin.'),
    ],
    done: t('No sentence claims importance without showing it.', 'Hiçbir cümle önemini göstermeden önemli olduğunu iddia etmiyor.'),
    example: t('Before: "A game-changing tool for teams." After: "Cuts our customers\' month-end close from 5 days to 2."',
      'Önce: "Ekipler için çığır açan bir araç." Sonra: "Müşterilerimizin ay sonu kapanışını 5 günden 2 güne indiriyor."'),
  },
  'thin-page': {
    steps: [
      t('Write down, for yourself, what a first-time visitor must know: what it is, who it is for, what it costs or how to get it, why you.', 'Kendiniz için, ilk kez gelen birinin bilmesi gerekenleri yazın: ne olduğu, kimin için olduğu, fiyatı ya da nasıl edinileceği, neden siz.'),
      t('Add one concrete example of it working (a screenshot, a sample result, a real case) under the headline.', 'Başlığın altına çalıştığını gösteren tek somut örnek ekleyin (ekran görüntüsü, örnek sonuç, gerçek bir vaka).'),
      t('Put the price or the next real step (a demo, a download, an address) on the page itself.', 'Fiyatı ya da gerçek bir sonraki adımı (demo, indirme, adres) sayfanın kendisine koyun.'),
    ],
    done: t('Someone who reads only this page can explain what it is and decide whether it is for them.', 'Yalnızca bu sayfayı okuyan biri bunun ne olduğunu anlatabiliyor ve kendisi için olup olmadığına karar verebiliyor.'),
  },
  vanity: {
    steps: [
      t('List every big number on the page (users, uptime, "10x", ratings).', 'Sayfadaki her büyük rakamı listeleyin (kullanıcı sayısı, uptime, "10 kat", puan).'),
      t('Keep only the ones you can source; add the source next to them (date, report, link).', 'Sadece kaynağını gösterebildiklerinizi bırakın, yanına kaynağı ekleyin (tarih, rapor, link).'),
      t('Delete the rest. A real small number beats a fake big one.', 'Gerisini silin. Gerçek küçük bir rakam sahte büyük bir rakamdan iyidir.'),
    ],
    done: t('Every number on the page has a source you could show a journalist.', 'Sayfadaki her rakamın bir gazeteciye gösterebileceğiniz bir kaynağı var.'),
  },
  'fake-proof': {
    steps: [
      t('Remove stock avatars, placeholder logos and "Trusted by" rows you cannot back up.', 'Arkasında duramayacağınız stok avatarları, örnek logoları ve "Bize güvenenler" satırlarını kaldırın.'),
      t('Ask 2–3 real customers for a quote with full name, role and company, and permission to publish.', '2-3 gerçek müşteriden tam isim, unvan ve şirketle, yayın izniyle bir yorum isteyin.'),
      t('No real quotes yet? Leave the section out, or link to your public reviews (Google, Trustpilot, G2).', 'Henüz gerçek yorum yoksa bölümü çıkarın ya da herkese açık yorumlarınıza link verin (Google, Trustpilot, G2).'),
    ],
    done: t('Every face, logo and quote belongs to a real, named customer.', 'Her yüz, logo ve yorum gerçek, isimli bir müşteriye ait.'),
  },
  'unverified-claims': {
    steps: [
      t('Find the "No. 1", "best", "guaranteed", "100%" claims listed under evidence.', 'Kanıttaki "1 numara", "en iyi", "garantili", "%100" iddialarını bulun.'),
      t('Keep a claim only with proof next to it (award name and year, guarantee terms, test result). Otherwise delete it.', 'Bir iddiayı ancak yanında kanıtı varsa bırakın (ödül adı ve yılı, garanti koşulları, test sonucu). Yoksa silin.'),
    ],
    done: t('No claim on the page would fail a consumer-protection check.', 'Sayfadaki hiçbir iddia tüketici koruma denetiminden geçemeyecek durumda değil.'),
  },
  'fake-urgency': {
    steps: [
      t('Remove countdowns that reset, "only 2 left" counters and "offer ends today" banners that are not true.', 'Sıfırlanan geri sayımları, "sadece 2 kaldı" sayaçlarını ve gerçek olmayan "kampanya bugün bitiyor" bantlarını kaldırın.'),
      t('If a deadline is real, show the real date.', 'Gerçek bir son tarih varsa gerçek tarihi yazın.'),
    ],
    done: t('Every deadline on the page has a real date behind it.', 'Sayfadaki her son tarihin arkasında gerçek bir tarih var.'),
  },
  'suspicious-rating': {
    steps: [
      t('Remove "4.9/5 from 10,000+ reviews" style ratings that do not link to a source.', 'Kaynağa link vermeyen "10.000+ yorumdan 4.9/5" türü puanları kaldırın.'),
      t('If you have a real rating, link to the page where it lives.', 'Gerçek bir puanınız varsa bulunduğu sayfaya link verin.'),
    ],
    done: t('Any rating shown can be clicked and checked.', 'Gösterilen her puana tıklanıp doğrulanabiliyor.'),
  },
  'ai-images': {
    steps: [
      t('Replace AI-generated or stock hero images with real photos: your team, your place, your product, your work.', 'AI ile üretilmiş ya da stok görselleri gerçek fotoğraflarla değiştirin: ekibiniz, mekânınız, ürününüz, işiniz.'),
      t('No photos yet? A clean screenshot of the product or no image at all is better.', 'Henüz fotoğraf yoksa ürünün temiz bir ekran görüntüsü ya da hiç görsel olmaması daha iyidir.'),
    ],
    done: t('Every image shows something real from this business.', 'Her görsel bu işletmeden gerçek bir şey gösteriyor.'),
  },

  /* ---------- language ---------- */
  lexicon: {
    steps: [
      t('Open each listed place and find the cliché phrase listed for this site.', 'Listelenen her yeri açıp bu site için listelenen klişe ifadeyi bulun.'),
      t('Rewrite the sentence around what was actually done or what it does, in plain words: what, for whom, with what result. Do not swap in a synonym.', 'Cümleyi gerçekte ne yapıldığı ya da ne işe yaradığı üzerinden sade kelimelerle yeniden yazın: ne, kimin için, hangi sonuçla. Eş anlamlısıyla değiştirmeyin.'),
      t('If the sentence says nothing once the word is gone, delete the whole sentence.', 'Kelime çıkınca cümle bir şey söylemiyorsa cümlenin tamamını silin.'),
    ],
    done: t('Read the page aloud: nothing sounds like an ad you have heard before.', 'Sayfayı sesli okuyun: hiçbir cümle daha önce duyduğunuz bir reklam gibi gelmiyor.'),
    example: t('Before: "Unlock seamless collaboration and elevate your workflow." After: "Everyone edits the same invoice at once; changes show up in a second."',
      'Önce: "Sorunsuz iş birliğinin kilidini açın, iş akışınızı bir üst seviyeye taşıyın." Sonra: "Herkes aynı faturayı aynı anda düzenler, değişiklik bir saniyede görünür."'),
  },
  'false-range': {
    steps: [
      t('Find each "from X to Y" range listed under evidence.', 'Kanıttaki her "X\'ten Y\'ye kadar" aralığını bulun.'),
      t('Replace it with the actual list, or with who it is really for.', 'Yerine gerçek listeyi ya da asıl kimin için olduğunu yazın.'),
    ],
    done: t('No range on the page means "everyone, everything".', 'Sayfadaki hiçbir aralık "herkes, her şey" anlamına gelmiyor.'),
    example: t('Before: "From startups to enterprises." After: "For agencies with 5 to 50 people."', 'Önce: "Girişimlerden büyük kurumlara kadar." Sonra: "5 ila 50 kişilik ajanslar için."'),
  },
  everyone: {
    steps: [
      t('Name the one group the page is really for.', 'Sayfanın asıl kimin için olduğunu tek bir grup olarak yazın.'),
      t('Replace "for everyone / for all businesses" with that group; say who it is not for if that helps.', '"Herkes için / tüm işletmeler için" ifadesini o grupla değiştirin, işe yarıyorsa kimin için olmadığını da yazın.'),
    ],
    done: t('The right visitor thinks "this is for me" in the first line.', 'Doğru ziyaretçi ilk satırda "bu benim için" diyor.'),
  },
  weasel: {
    steps: [
      t('Find "studies show", "experts agree", "many believe" listed under evidence.', 'Kanıttaki "araştırmalar gösteriyor", "uzmanlar hemfikir", "birçokları düşünüyor" ifadelerini bulun.'),
      t('Name the study or expert and link it, or delete the sentence.', 'Araştırmayı ya da uzmanı adıyla yazıp link verin, ya da cümleyi silin.'),
    ],
    done: t('Every appeal to authority names its source.', 'Otoriteye yapılan her atıf kaynağını adıyla veriyor.'),
  },
  'formulaic-frame': {
    steps: [
      t('Delete the warm-up openers ("In today\'s fast-paced world…") and the summary closers ("In conclusion…").', 'Isınma girişlerini ("Günümüzün hızla değişen dünyasında…") ve özet kapanışlarını ("Sonuç olarak…") silin.'),
      t('Start with the first useful sentence; end with the last one, or with the next step.', 'İlk işe yarar cümleyle başlayın, son işe yarar cümleyle ya da sonraki adımla bitirin.'),
    ],
    done: t('The first sentence of each section already says something.', 'Her bölümün ilk cümlesi zaten bir şey söylüyor.'),
  },
  'tr-register': {
    steps: [
      t('Find the stiff bureaucratic phrasing listed under evidence ("gerçekleştirilmektedir", "sağlanmaktadır", "bu doğrultuda").', 'Kanıttaki resmî ve kalıp ifadeleri bulun ("gerçekleştirilmektedir", "sağlanmaktadır", "bu doğrultuda").'),
      t('Rewrite in the active, spoken form: "yapıyoruz", "veriyoruz", "bu yüzden".', 'Etken ve konuşur gibi yazın: "yapıyoruz", "veriyoruz", "bu yüzden".'),
    ],
    done: t('The Turkish reads like a person talking, not a press release.', 'Türkçe bir basın bülteni gibi değil, konuşan bir insan gibi okunuyor.'),
    example: t('Before: "Müşteri memnuniyeti sağlanmaktadır." After: "Siparişinizi 2 günde teslim ediyoruz."', 'Önce: "Müşteri memnuniyeti sağlanmaktadır." Sonra: "Siparişinizi 2 günde teslim ediyoruz."'),
  },
  'neg-parallel': {
    steps: [
      t('Find each "not just X, it\'s Y" sentence listed under evidence.', 'Kanıttaki her "sadece X değil, Y" cümlesini bulun.'),
      t('Say Y directly. Drop the X that nobody claimed.', 'Y\'yi doğrudan söyleyin. Kimsenin iddia etmediği X\'i çıkarın.'),
    ],
    done: t('At most one contrast sentence on the whole page.', 'Tüm sayfada en fazla bir karşıtlık cümlesi var.'),
    example: t('Before: "It\'s not just a CRM, it\'s a growth partner." After: "A CRM that reminds you who to call back today."', 'Önce: "Bu sadece bir CRM değil, bir büyüme ortağı." Sonra: "Bugün kimi geri aramanız gerektiğini hatırlatan bir CRM."'),
  },
  'ing-tail': {
    steps: [
      t('Find sentences that end in a tacked-on "…, ensuring / highlighting / fostering X".', '"…, böylece X\'i sağlayarak / güçlendirerek" gibi sonradan eklenmiş kuyruklarla biten cümleleri bulun.'),
      t('Cut the tail, or turn it into its own sentence with a fact.', 'Kuyruğu kesin ya da bir bilgiyle ayrı bir cümleye çevirin.'),
    ],
    done: t('Sentences end where the information ends.', 'Cümleler bilgi bittiği yerde bitiyor.'),
  },
  triads: {
    steps: [
      t('Find the "fast, simple and secure" style lists of three listed under evidence.', 'Kanıttaki "hızlı, kolay ve güvenli" türü üçlü listeleri bulun.'),
      t('Keep the one item you can prove and say how. Drop the other two.', 'Kanıtlayabildiğiniz tek maddeyi bırakıp nasıl olduğunu yazın. Diğer ikisini çıkarın.'),
    ],
    done: t('Lists have the length the facts need, not always three.', 'Listeler her zaman üç değil, bilginin gerektirdiği uzunlukta.'),
  },
  'em-dash': {
    steps: [
      t('Replace most em dashes (—) with a full stop, comma or colon.', 'Uzun tirelerin (—) çoğunu nokta, virgül ya da iki nokta ile değiştirin.'),
      t('Keep one or two where a real aside needs it.', 'Gerçekten ara söz gereken bir iki yerde bırakın.'),
    ],
    done: t('Dashes are rare enough that nobody notices them.', 'Tireler kimsenin fark etmeyeceği kadar seyrek.'),
  },
  'emoji-headings': {
    steps: [t('Remove the emoji from headings and buttons.', 'Başlık ve butonlardaki emojileri kaldırın.'), t('If a section needs an icon, use one consistent icon set, or none.', 'Bir bölüme ikon gerekiyorsa tek ve tutarlı bir ikon seti kullanın ya da hiç kullanmayın.')],
    done: t('Headings carry meaning with words alone.', 'Başlıklar anlamı yalnızca kelimelerle taşıyor.'),
  },
  'generic-headings': {
    steps: [
      t('Rename "Features", "Why choose us", "Our services" headings listed under evidence.', 'Kanıttaki "Özellikler", "Neden biz", "Hizmetlerimiz" başlıklarını yeniden adlandırın.'),
      t('Make each heading a claim a reader could skim: what this section proves.', 'Her başlığı göz gezdiren birinin okuyacağı bir iddia yapın: bu bölüm neyi kanıtlıyor.'),
    ],
    done: t('Reading only the headings tells the story of the page.', 'Sadece başlıkları okumak sayfanın hikâyesini anlatıyor.'),
    example: t('Before: "Why choose us". After: "Same-day repair, or the call-out is free".', 'Önce: "Neden biz". Sonra: "Aynı gün onarım, yoksa servis ücreti bizden".'),
  },
  bold: {
    steps: [t('Remove bold from everything except one key phrase per section, at most.', 'Bölüm başına en fazla bir anahtar ifade dışında her yerden kalını kaldırın.')],
    done: t('Bold marks the few things a skimmer must not miss.', 'Kalın yazı sadece göz gezdirenin kaçırmaması gereken birkaç şeyi işaretliyor.'),
  },
  exclaim: {
    steps: [t('Replace exclamation marks with full stops.', 'Ünlem işaretlerini noktayla değiştirin.'), t('Keep one, if any, where the excitement is real.', 'Varsa heyecanın gerçek olduğu tek bir yerde bırakın.')],
    done: t('The page sounds calm and sure of itself.', 'Sayfa sakin ve kendinden emin okunuyor.'),
  },
  'generic-cta': {
    steps: [
      t('Find buttons like "Get started", "Learn more", "Submit" listed under evidence.', 'Kanıttaki "Hemen başla", "Daha fazla bilgi", "Gönder" gibi butonları bulun.'),
      t('Say what happens when clicked: "Book a 15-min call", "See prices", "Start a free invoice".', 'Tıklayınca ne olacağını yazın: "15 dk görüşme ayarla", "Fiyatları gör", "Ücretsiz fatura oluştur".'),
    ],
    done: t('Every button tells you what you get.', 'Her buton ne elde edeceğinizi söylüyor.'),
  },
  repetition: {
    steps: [t('Find the sections that say the same thing in different words.', 'Aynı şeyi farklı kelimelerle söyleyen bölümleri bulun.'), t('Merge them into one and delete the rest.', 'Hepsini bir bölümde birleştirip gerisini silin.')],
    done: t('Each idea appears once.', 'Her fikir bir kez geçiyor.'),
  },
  'uniform-sentences': {
    steps: [t('Mix lengths: break one long sentence in two, join two short ones.', 'Uzunlukları karıştırın: uzun bir cümleyi ikiye bölün, kısa iki cümleyi birleştirin.'), t('Let one sentence per section be very short.', 'Her bölümde bir cümle çok kısa olsun.')],
    done: t('Read aloud, the rhythm changes from line to line.', 'Sesli okununca ritim satırdan satıra değişiyor.'),
  },

  /* ---------- design ---------- */
  'purple-gradient': {
    steps: [
      t('Replace the purple/indigo gradient with one solid brand colour taken from your logo, product or place.', 'Mor/çivit gradyanı logonuzdan, ürününüzden ya da mekânınızdan alınmış tek, düz bir marka rengiyle değiştirin.'),
      t('Use that colour for one thing (the main button or links), and keep backgrounds plain.', 'O rengi tek bir iş için kullanın (ana buton ya da linkler), arka planları sade bırakın.'),
      t('Ask your AI for the full palette with the design guide: slop_guide → design.', 'Tüm palet için yapay zekânıza tasarım rehberini verin: slop_guide → design.'),
    ],
    done: t('Someone could guess your industry from the colours.', 'Renklere bakan biri sektörünüzü tahmin edebiliyor.'),
  },
  'gradient-text': {
    steps: [t('Make gradient headline text solid (your ink colour).', 'Gradyanlı başlık yazısını düz renk yapın (yazı renginiz).'), t('Draw attention with size and words instead.', 'Dikkati boyut ve kelimelerle çekin.')],
    done: t('No text on the page uses background-clip gradients.', 'Sayfada hiçbir yazı gradyan dolgu kullanmıyor.'),
  },
  'glow-glass': {
    steps: [t('Remove glows, blurred blobs and frosted-glass panels.', 'Parlamaları, bulanık lekeleri ve buzlu cam panelleri kaldırın.'), t('Separate sections with spacing, a thin rule or a plain background change.', 'Bölümleri boşluk, ince bir çizgi ya da sade bir arka plan değişimiyle ayırın.')],
    done: t('Nothing on the page glows.', 'Sayfada hiçbir şey parlamıyor.'),
  },
  'emoji-icons': {
    steps: [t('Replace emoji used as feature icons.', 'Özellik ikonu olarak kullanılan emojileri değiştirin.'), t('Use a real image of the feature (screenshot, photo), one consistent icon set, or no icon.', 'Özelliğin gerçek görüntüsünü (ekran görüntüsü, fotoğraf), tek tutarlı bir ikon seti kullanın ya da ikon kullanmayın.')],
    done: t('No emoji does the job of an icon.', 'Hiçbir emoji ikon işi görmüyor.'),
  },
  'card-template': {
    steps: [
      t('Find the grid of identical cards (icon, title, two lines) at the listed places.', 'Listelenen yerlerdeki birbirinin aynı kart ızgarasını (ikon, başlık, iki satır) bulun.'),
      t('Keep the one or two features that matter most and show them big, with a real screenshot or example.', 'En önemli bir iki özelliği bırakıp gerçek bir ekran görüntüsü ya da örnekle büyük gösterin.'),
      t('Put the rest in a plain list.', 'Gerisini sade bir listeye koyun.'),
    ],
    done: t('The page has no row of three or six look-alike cards.', 'Sayfada birbirine benzeyen üçlü ya da altılı kart dizisi yok.'),
  },
  'default-font': {
    steps: [
      t('Replace Inter/Poppins/Roboto with a type pairing that fits your subject (the design guide lists pairings).', 'Inter/Poppins/Roboto yerine konunuza uyan bir font eşleşmesi seçin (tasarım rehberinde öneriler var).'),
      t('Use one face for headings and one for text; set them once in the theme.', 'Başlıklar için bir, metin için bir font kullanın; temada bir kez tanımlayın.'),
    ],
    done: t('The headline font looks chosen, not defaulted.', 'Başlık fontu varsayılan değil, seçilmiş görünüyor.'),
  },
  'perma-dark': {
    steps: [t('Add a light theme and follow the visitor\'s system setting (prefers-color-scheme).', 'Açık tema ekleyin ve ziyaretçinin sistem ayarını izleyin (prefers-color-scheme).'), t('Keep dark only if it suits the subject (a night club, a code tool).', 'Koyu temayı yalnızca konuya uyuyorsa koruyun (gece kulübü, kod aracı gibi).')],
    done: t('The page reads well in daylight.', 'Sayfa gün ışığında rahat okunuyor.'),
  },
  'accent-stripe': {
    steps: [t('Remove the coloured left border on cards and quotes.', 'Kart ve alıntılardaki renkli sol kenarlığı kaldırın.'), t('Use spacing or a plain rule instead.', 'Yerine boşluk ya da sade bir çizgi kullanın.')],
    done: t('No card has a decorative side stripe.', 'Hiçbir kartta süs amaçlı yan şerit yok.'),
  },
  'icon-tiles': {
    steps: [t('Remove the rounded coloured squares behind icons.', 'İkonların arkasındaki yuvarlak köşeli renkli kareleri kaldırın.'), t('Show the icon plain at text size, or drop it.', 'İkonu yazı boyutunda sade gösterin ya da çıkarın.')],
    done: t('Icons sit in the text, not in tiles.', 'İkonlar karo içinde değil, metnin içinde.'),
  },
  'motion-everywhere': {
    steps: [t('Remove fade-in-on-scroll from every section.', 'Her bölümdeki kaydırınca beliren animasyonları kaldırın.'), t('Keep at most one meaningful motion (showing how the product works) and respect prefers-reduced-motion.', 'En fazla bir anlamlı hareket bırakın (ürünün nasıl çalıştığını gösteren) ve prefers-reduced-motion ayarına uyun.')],
    done: t('Content is there when you scroll, without waiting.', 'Kaydırınca içerik beklemeden orada.'),
  },
  'gimmick-effects': {
    steps: [t('Remove the effects listed for this site.', 'Bu sitede listelenen efektleri kaldırın.'), t('Spend that space on a real example of your work.', 'O alanı işinizden gerçek bir örneğe ayırın.')],
    done: t('Nothing moves just to look busy.', 'Hiçbir şey sadece meşgul görünmek için hareket etmiyor.'),
  },
  'default-theme': {
    steps: [
      t('Change the untouched theme tokens (shadcn/Tailwind defaults) to your own colours, radius and font.', 'Hiç değiştirilmemiş tema değerlerini (shadcn/Tailwind varsayılanları) kendi renk, köşe ve fontunuza çevirin.'),
      t('Do it once in the theme file so every component follows.', 'Bunu tema dosyasında bir kez yapın ki tüm bileşenler uysun.'),
    ],
    done: t('Your buttons would not be mistaken for a component library demo.', 'Butonlarınız bir bileşen kütüphanesi demosuyla karıştırılmıyor.'),
  },
  'cream-terracotta': {
    steps: [t('Cream background with terracotta and a serif is the new default look. Pick colours from your own subject instead.', 'Krem arka plan, kiremit rengi ve serif font yeni varsayılan görünüm. Bunun yerine renkleri kendi konunuzdan seçin.'), t('Test: would this palette fit a candle shop, a law firm and a SaaS equally? Then change it.', 'Test: bu palet bir mum dükkânına, bir hukuk bürosuna ve bir yazılıma aynı derecede uyuyor mu? Uyuyorsa değiştirin.')],
    done: t('The palette belongs to this business only.', 'Palet sadece bu işletmeye ait.'),
  },
  'acid-on-black': {
    steps: [t('Acid green or lime on black is the new default "bold" look. Pick colours from your own subject.', 'Siyah üstüne asit yeşili ya da limon rengi yeni varsayılan "cesur" görünüm. Renkleri kendi konunuzdan seçin.')],
    done: t('The palette belongs to this business only.', 'Palet sadece bu işletmeye ait.'),
  },
  'rounded-everything': {
    steps: [t('Choose one corner radius for the whole site (often small: 2–6px) and apply it in the theme.', 'Tüm site için tek bir köşe yuvarlaklığı seçin (genelde küçük: 2-6px) ve temada uygulayın.')],
    done: t('Corners are consistent and deliberate.', 'Köşeler tutarlı ve bilinçli.'),
  },
  'pill-badges': {
    steps: [t('Remove "✨ New" / "Introducing" pill badges above headlines.', 'Başlıkların üstündeki "✨ Yeni" / "Karşınızda" hap rozetlerini kaldırın.'), t('If something is new, say what and when in the headline or text.', 'Yeni bir şey varsa ne olduğunu ve ne zaman çıktığını başlıkta ya da metinde yazın.')],
    done: t('No badge floats above a headline.', 'Hiçbir başlığın üstünde rozet yok.'),
  },

  'headline-formula': {
    steps: [
      t('Write down, in one sentence, what the product does and for whom, as if telling a friend.', 'Ürünün ne yaptığını ve kimin için olduğunu bir arkadaşınıza anlatır gibi tek cümleyle yazın.'),
      t('Add one concrete detail only you can say: a number, a place, a name, a price.', 'Sadece sizin söyleyebileceğiniz tek somut detay ekleyin: rakam, yer, isim, fiyat.'),
      t('Use that as the headline; move any slogan to the line below, or drop it.', 'Başlık olarak onu kullanın; slogan varsa alt satıra alın ya da silin.'),
    ],
    done: t('A stranger reading only the headline knows what you sell.', 'Sadece başlığı okuyan biri ne sattığınızı biliyor.'),
    example: t('Before: "Your all-in-one workspace for modern teams." After: "Shared to-do lists for agencies of 5 to 50 people, from $6 a seat."', 'Önce: "Modern ekipler için hepsi bir arada çalışma alanı." Sonra: "5-50 kişilik ajanslar için ortak görev listesi, kişi başı 150 TL."'),
  },
  'stock-microcopy': {
    steps: [
      t('Go through the phrases listed under evidence one by one.', 'Kanıttaki kalıpları tek tek gözden geçirin.'),
      t('Rename buttons by what happens next ("See a sample report", "Book 20 minutes with Ayşe").', 'Butonları tıklayınca ne olacağına göre adlandırın ("Örnek raporu gör", "Ayşe ile 20 dakika ayarla").'),
      t('Delete reassurance lines every competitor also has ("No credit card required", "Trusted by…") unless they are true and matter here.', 'Her rakipte olan güven cümlelerini ("Kredi kartı gerekmez", "Bize güvenenler…") doğru ve burada önemli değilse silin.'),
    ],
    done: t('No button or line on the page could be pasted onto a competitor\'s site unchanged.', 'Sayfadaki hiçbir buton ya da satır bir rakibin sitesine aynen yapıştırılamaz.'),
  },
  'landing-template': {
    steps: [
      t('List the sections in order and ask for each: would a visitor miss it if it were gone?', 'Bölümleri sırayla listeleyin ve her biri için sorun: kaldırılsa ziyaretçi eksikliğini hisseder mi?'),
      t('Delete the ones nobody would miss (logo strip without real customers, stats row, generic FAQ).', 'Kimsenin eksikliğini hissetmeyeceklerini silin (gerçek müşterisi olmayan logo şeridi, istatistik satırı, genel SSS).'),
      t('Give the remaining ones a form that fits: a real screenshot, a comparison table, one customer story with a name and a number.', 'Kalanlara uygun bir biçim verin: gerçek ekran görüntüsü, karşılaştırma tablosu, isim ve rakam içeren tek müşteri hikâyesi.'),
    ],
    done: t('The page has fewer sections, and each one shows something only this product has.', 'Sayfada daha az bölüm var ve her biri sadece bu ürünün sahip olduğu bir şeyi gösteriyor.'),
  },
  'portfolio-template': {
    steps: [
      t('Put two or three projects at the top: screenshot, the problem, what you built, the stack, a link.', 'En üste iki üç proje koyun: ekran görüntüsü, problem, ne yaptığınız, teknoloji, link.'),
      t('Remove the typing effect and the custom cursor.', 'Daktilo efektini ve özel imleci kaldırın.'),
      t('Replace the skill boxes with the tools named inside each project.', 'Yetenek kutularının yerine her projenin içinde kullanılan araçları yazın.'),
    ],
    done: t('Someone can judge your work in 30 seconds without reading a list of skills.', 'Biri yetenek listesi okumadan 30 saniyede işinizi değerlendirebiliyor.'),
  },
  'no-work-shown': {
    steps: [
      t('Pick your two or three best projects (work, side projects, open source, videos).', 'En iyi iki üç projenizi seçin (iş, yan proje, açık kaynak, video).'),
      t('For each: a screenshot, one line on the problem, what you did, the stack, and a link.', 'Her biri için: ekran görüntüsü, problemi anlatan bir satır, ne yaptığınız, teknoloji ve link.'),
    ],
    done: t('Every claim on the page has a project that proves it.', 'Sayfadaki her iddianın onu kanıtlayan bir projesi var.'),
  },
  'default-palette': {
    steps: [
      t('Pick 4-6 colours from something real in your subject (a product photo, your logo, the place).', 'Konunuzdaki gerçek bir şeyden 4-6 renk seçin (ürün fotoğrafı, logonuz, mekân).'),
      t('Define them once as named variables (--ink, --paper, --accent…) and replace the Tailwind hex values listed.', 'Bunları bir kez isimli değişkenler olarak tanımlayın (--ink, --paper, --accent…) ve listelenen Tailwind renklerini değiştirin.'),
    ],
    done: t('No colour on the page comes straight from Tailwind\'s default palette.', 'Sayfadaki hiçbir renk doğrudan Tailwind\'in varsayılan paletinden gelmiyor.'),
  },
  'accent-underline': {
    steps: [t('Remove the ::after bar under section titles.', 'Bölüm başlıklarının altındaki ::after çizgisini kaldırın.'), t('Separate sections with spacing and type size instead.', 'Bölümleri bunun yerine boşluk ve yazı boyutuyla ayırın.')],
    done: t('Headings stand on their own.', 'Başlıklar kendi başına duruyor.'),
  },
  'centred-everything': {
    steps: [t('Left-align paragraphs and section headings.', 'Paragrafları ve bölüm başlıklarını sola hizalayın.'), t('Keep centred text only where it marks a single moment, such as the hero.', 'Ortalanmış metni sadece tek bir anı işaret ettiği yerde bırakın, örneğin hero.')],
    done: t('The eye can follow one left edge down the page.', 'Göz sayfa boyunca tek bir sol kenarı izleyebiliyor.'),
  },
  'stock-icons': {
    steps: [t('Remove icons that only decorate a heading.', 'Sadece başlığı süsleyen ikonları kaldırın.'), t('Keep icons where they help scanning, and draw or pick ones that show this product.', 'Taramaya yardım ettiği yerlerde ikon bırakın; bu ürünü gösteren ikonlar çizin ya da seçin.')],
    done: t('No ✨ Sparkles icon and no icon that could sit on any other site.', '✨ Sparkles ikonu ve başka herhangi bir sitede durabilecek ikon yok.'),
  },
  'client-shell': {
    steps: [
      t('Check the page with JavaScript turned off (or "View source"): if it is empty, search engines see it empty too.', 'Sayfaya JavaScript kapalıyken (ya da "Kaynağı görüntüle" ile) bakın: boşsa arama motorları da boş görüyor.'),
      t('Prerender the public pages (vite-plugin-ssg or react-snap, Next.js static export, or move them to Astro).', 'Herkese açık sayfaları önceden oluşturun (vite-plugin-ssg ya da react-snap, Next.js static export ya da Astro\'ya taşıyın).'),
      t('At minimum, put a real title, description and the main heading and text into index.html.', 'En azından index.html içine gerçek başlık, açıklama, ana başlık ve metni koyun.'),
    ],
    done: t('"View source" shows the page\'s words.', '"Kaynağı görüntüle" sayfanın kelimelerini gösteriyor.'),
  },

  /* ---------- unfinished details ---------- */
  placeholder: {
    steps: [t('Open each listed location; every lorem ipsum, [Your name], John Doe or 555 number is listed.', 'Listelenen her konumu açın; her lorem ipsum, [Adınız], John Doe ya da sahte numara listelenmiş.'), t('Replace each with the real thing, or delete the whole block.', 'Her birini gerçeğiyle değiştirin ya da bloğun tamamını silin.')],
    done: t('Searching the page for "lorem", "example" and "[" finds nothing.', 'Sayfada "lorem", "örnek" ve "[" aramak hiçbir şey bulmuyor.'),
  },
  'section-comments': {
    steps: [t('Delete the <!-- Hero Section --> style comments at the listed places.', 'Listelenen <!-- Hero Section --> türü yorumları silin.')],
    done: t('Comments only explain things that are not obvious.', 'Yorumlar sadece açık olmayan şeyleri açıklıyor.'),
  },
  'dead-links': {
    steps: [t('Open each link listed (href="#", empty, or a social network\'s home page).', 'Listelenen her linki açın (href="#", boş ya da bir sosyal ağın ana sayfası).'), t('Point it at the real page or profile, or remove the link.', 'Gerçek sayfaya ya da profile yönlendirin, ya da linki kaldırın.')],
    done: t('Every link goes somewhere useful.', 'Her link işe yarar bir yere gidiyor.'),
  },
  'heading-hierarchy': {
    steps: [t('Use exactly one h1 per page, then h2 for sections and h3 inside them; do not skip levels.', 'Sayfa başına tek bir h1, bölümler için h2, onların içinde h3 kullanın; seviye atlamayın.'), t('Change the size with CSS, not by picking a different heading level.', 'Boyutu farklı başlık seviyesi seçerek değil, CSS ile değiştirin.')],
    done: t('The outline of headings reads like a table of contents.', 'Başlıkların sırası bir içindekiler tablosu gibi okunuyor.'),
  },
  'placeholder-images': {
    steps: [t('Replace placeholder images (placehold.co, picsum, unsplash/source) with real photos or screenshots.', 'Yer tutucu görselleri (placehold.co, picsum, unsplash/source) gerçek fotoğraf ya da ekran görüntüleriyle değiştirin.'), t('No image yet? Remove the slot.', 'Henüz görsel yoksa o alanı kaldırın.')],
    done: t('Every image is yours.', 'Her görsel sizin.'),
  },
  noindex: {
    steps: [t('Remove the leftover noindex meta tag / header if the page should appear in search.', 'Sayfa aramada görünmeliyse kalmış noindex etiketini ya da başlığını kaldırın.')],
    done: t('The page can be indexed.', 'Sayfa dizine eklenebiliyor.'),
  },
  'hidden-ai-instructions': {
    steps: [t('Delete hidden text addressed to AI models (instructions, prompt text, "ignore previous").', 'Yapay zekâ modellerine yönelik gizli metni silin (talimatlar, prompt metni, "öncekileri yok say").'), t('Search engines treat it as spam.', 'Arama motorları bunu spam sayar.')],
    done: t('No hidden text is left on the page.', 'Sayfada gizli metin kalmadı.'),
  },
  'missing-alt': {
    steps: [t('Give each listed image an alt text that says what is in it ("Ayşe repairing a roof in Moda").', 'Listelenen her görsele içinde ne olduğunu söyleyen bir alt metin yazın ("Ayşe Moda\'da bir çatıyı onarıyor").'), t('Use alt="" for purely decorative images. Never "image" or "photo".', 'Sadece süs olan görseller için alt="" kullanın. Asla "görsel" ya da "fotoğraf" yazmayın.')],
    done: t('A screen reader user gets the same information.', 'Ekran okuyucu kullanan biri aynı bilgiyi alıyor.'),
  },
  'low-contrast': {
    steps: [t('Darken the light grey text listed under evidence until it reaches 4.5:1 contrast.', 'Kanıttaki açık gri yazıları 4.5:1 kontrasta ulaşana kadar koyulaştırın.')],
    done: t('All text is readable on a phone in sunlight.', 'Tüm yazılar güneş altında telefonda okunabiliyor.'),
  },
  'focus-removed': {
    steps: [t('Remove outline:none / focus:outline-none, or replace it with a visible :focus-visible style.', 'outline:none / focus:outline-none kullanımını kaldırın ya da görünür bir :focus-visible stiliyle değiştirin.')],
    done: t('Tabbing through the page shows where you are.', 'Sayfada Tab ile gezerken nerede olduğunuz görünüyor.'),
  },
  'raw-markdown': {
    steps: [t('Fix the visible **asterisks**, ## hashes and [links](…) at the listed places: render them or remove the symbols.', 'Listelenen yerlerde görünen **yıldızları**, ## işaretlerini ve [link](…) kalıplarını düzeltin: işleyin ya da işaretleri silin.')],
    done: t('No Markdown symbols show on the page.', 'Sayfada Markdown işareti görünmüyor.'),
  },
  'chatbot-leftover': {
    steps: [t('Delete the chatbot sentences pasted in by mistake ("Certainly! Here is…", "As an AI…", "I hope this helps").', 'Yanlışlıkla yapıştırılmış sohbet botu cümlelerini silin ("Elbette! İşte…", "Bir yapay zekâ olarak…", "Umarım yardımcı olur").')],
    done: t('Nothing on the page talks to the person who wrote the prompt.', 'Sayfada prompt\'u yazan kişiye hitap eden hiçbir şey yok.'),
  },
  'chatbot-links': {
    steps: [t('Remove utm_source=chatgpt.com and similar tracking, and leftover citation markers ([oaicite], 【…】).', 'utm_source=chatgpt.com gibi izleme eklerini ve kalmış atıf işaretlerini ([oaicite], 【…】) kaldırın.')],
    done: t('Links are clean and citations are gone.', 'Linkler temiz, atıf işaretleri yok.'),
  },
  'stale-copyright': {
    steps: [t('Update the copyright year, or print it from the current date.', 'Telif yılını güncelleyin ya da güncel tarihten otomatik yazdırın.')],
    done: t('The footer shows this year.', 'Altbilgide bu yıl yazıyor.'),
  },
  'default-title': {
    steps: [t('Replace the default page title ("Vite + React + TS", "Create Next App") with: what it is · who it is for · your name.', 'Varsayılan sayfa başlığını ("Vite + React + TS", "Create Next App") şöyle değiştirin: ne olduğu · kimin için · adınız.')],
    done: t('The browser tab says what this is.', 'Tarayıcı sekmesi bunun ne olduğunu söylüyor.'),
  },
  'default-description': {
    steps: [t('Write a meta description of 1–2 sentences with a real fact (what, where, price or proof).', 'Gerçek bir bilgi içeren 1-2 cümlelik bir meta açıklama yazın (ne, nerede, fiyat ya da kanıt).')],
    done: t('The search result snippet would make you click.', 'Arama sonucundaki özet tıklatacak kadar net.'),
  },
  'default-favicon': {
    steps: [t('Replace the framework\'s default favicon (vite.svg, the Next logo) with your own mark.', 'Çerçevenin varsayılan favicon\'unu (vite.svg, Next logosu) kendi işaretinizle değiştirin.')],
    done: t('The tab icon is yours.', 'Sekme ikonu sizin.'),
  },
  'missing-meta': {
    steps: [t('Add a title, a meta description and an og:image to the page head.', 'Sayfanın head kısmına başlık, meta açıklama ve og:image ekleyin.')],
    done: t('Shared links show a proper preview.', 'Paylaşılan linkler düzgün bir önizleme gösteriyor.'),
  },
  'duplicate-meta': {
    steps: [t('Give each page its own title and description that says what is on that page.', 'Her sayfaya o sayfada ne olduğunu söyleyen kendi başlığını ve açıklamasını verin.')],
    done: t('No two pages share a title.', 'Hiçbir iki sayfanın başlığı aynı değil.'),
  },
};

const BUILDER = {
  steps: [t('Optional: remove the builder badge or tagging script if you do not want it public.', 'İsteğe bağlı: herkese görünmesini istemiyorsanız üretici rozetini ya da etiketleme script\'ini kaldırın.'), t('The other findings matter more than this one.', 'Diğer bulgular bundan daha önemli.')],
  done: t('Only what you chose to show is visible.', 'Sadece göstermeyi seçtiğiniz şeyler görünüyor.'),
};

export function actionsFor(f) {
  if (!f) return null;
  if (A[f.id]) return A[f.id];
  if (String(f.id).startsWith('builder')) return BUILDER;
  return null;
}

/** Attach steps / done / example to each issue so every output shows the same "what to do". */
export function attachActions(findings) {
  for (const f of findings) {
    if (f.kind !== 'issue' && !String(f.id).startsWith('builder')) continue;
    const a = actionsFor(f);
    if (!a) continue;
    f.steps = a.steps;
    f.doneWhen = a.done;
    if (a.example) f.example = a.example;
  }
  return findings;
}

const pick = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : o[lang] || o.en || '');

/**
 * What exactly to change on THIS site: the evidence the check found and the places it found it.
 * Returns { found: 'a · b · c' | '', places: [{ where, text }] }.
 */
// evidence labels produced in English by the checks
const EVIDENCE_TR = {
  'typing effect': 'daktilo efekti', 'custom cursor': 'özel imleç', 'floating shapes': 'uçuşan şekiller', particles: 'parçacıklar',
  'tilt cards': 'eğilen kartlar', 'scramble text': 'karışan yazı', 'matrix rain': 'matrix yağmuru',
  '"Hi, I\'m" greeting': '"Merhaba, ben" selamlaması', 'rotating job titles': 'yazılıp silinen unvanlar', 'standard section menu': 'standart bölüm menüsü',
  '"X+ years" stat cards': '"X+ yıl" kartları', 'skill category cards': 'yetenek kutuları', 'glowing timeline': 'parlayan zaman çizelgesi',
  '0 project images, 0 project links': '0 proje görseli, 0 proje linki', 'hero with two buttons': 'iki butonlu hero', 'logo strip': 'logo şeridi',
  'feature grid': 'özellik kartları', 'how it works': '"nasıl çalışır" bölümü', testimonials: 'yorumlar', 'stats row': 'istatistik satırı',
  'three pricing plans': '3\'lü fiyat planı', 'FAQ accordion': 'SSS akordeonu', 'closing call to action': 'kapanış çağrısı', 'four-column footer': '4 sütunlu footer',
  'meta description': 'meta açıklama', 'Open Graph': 'paylaşım önizlemesi (Open Graph)',
};
export const evidenceText = (e, lang) => (lang === 'tr' && EVIDENCE_TR[e]) || e;

export function targetsOf(f, { max = 6, lang = 'en' } = {}) {
  const ev = (f.evidence || []).filter(Boolean).map((e) => evidenceText(String(e).replace(/\s+/g, ' ').trim(), lang));
  const places = [];
  const seen = new Set();
  for (const l of (f.locations || []).filter(Boolean)) {
    const k = `${l.file}:${l.line}`;
    if (seen.has(k)) continue;
    seen.add(k);
    places.push({ where: k, text: l.snippet ? String(l.snippet).replace(/\s+/g, ' ').trim() : '' });
    if (places.length >= max) break;
  }
  // evidence that is not already visible in a snippet
  const shown = places.map((p) => p.text).join(' ');
  const extra = ev.filter((e) => e.length > 1 && !shown.includes(e.slice(0, 30))).slice(0, 4);
  return { found: extra.map((e) => (e.length > 140 ? e.slice(0, 137) + '…' : e)).join(' / '), places };
}

/** The same as lines of text, for prompts. */
export function targetLines(f, lang = 'en', indent = '') {
  const tr = lang === 'tr';
  const { found, places } = targetsOf(f, { lang });
  const out = [];
  if (found) out.push(`${indent}${tr ? 'Bu sitede' : 'On this site'}: ${found}`);
  for (const p of places) out.push(`${indent}${p.where}${p.text ? `  «${p.text}»` : ''}`);
  if (f.pages?.length > 1) out.push(`${indent}${tr ? 'Sayfalar' : 'Pages'}: ${f.pages.slice(0, 8).join(', ')}${f.pages.length > 8 ? ` +${f.pages.length - 8}` : ''}`);
  return out;
}

/** A focused prompt for one finding: paste it into any AI that can edit the site. */
export function fixPrompt(f, scan, lang = 'en') {
  const tr = lang === 'tr';
  const out = [];
  out.push(tr ? `Şu sitede/projede tek bir sorunu düzelt: ${scan.display || scan.target}` : `Fix one problem on this site/project: ${scan.display || scan.target}`);
  out.push('');
  out.push(`${tr ? 'Sorun' : 'Problem'}: ${pick(f.title, lang)}`);
  if (f.detail) out.push(pick(f.detail, lang));
  const tl = targetLines(f, lang, '- ');
  if (tl.length) { out.push(''); out.push(tr ? 'Bu sitede değişecek yerler:' : 'What to change on this site:'); out.push(...tl); }
  if (f.pages?.length && scan.kind === 'site') {
    const base = scan.url || scan.target;
    const abs = (p) => { try { return new URL(p, base).toString(); } catch { return p; } };
    out.push(''); out.push(tr ? `Sayfalar (${f.pages.length}):` : `Pages (${f.pages.length}):`);
    for (const p of f.pages.slice(0, 25)) out.push(`- ${abs(p)}`);
    if (f.pages.length > 25) out.push(`- … +${f.pages.length - 25}`);
  } else if (f.page && scan.kind === 'site') {
    out.push(''); out.push(`${tr ? 'Sayfa' : 'Page'}: ${(() => { try { return new URL(f.page, scan.url || scan.target).toString(); } catch { return f.page; } })()}`);
  }
  const ls = (f.locations || []).filter(Boolean);
  if (ls.length > 6) { out.push(`- … +${ls.length - 6}`); }
  out.push('');
  out.push(tr ? 'Yapılacaklar:' : 'Steps:');
  (f.steps || []).forEach((s, i) => out.push(`${i + 1}. ${pick(s, lang)}`));
  if (!f.steps?.length && f.fix) out.push(`1. ${pick(f.fix, lang)}`);
  if (f.example) { out.push(''); out.push(`${tr ? 'Örnek' : 'Example'}: ${pick(f.example, lang)}`); }
  if (f.doneWhen) { out.push(''); out.push(`${tr ? 'Bitti sayılır' : 'Done when'}: ${pick(f.doneWhen, lang)}`); }
  out.push('');
  out.push(tr
    ? 'Kurallar: bilgi uydurma (isim, rakam, yorum, adres); bilmediğin yere [yer tutucu] koy ve bana sor. Klişeyi eş anlamlısıyla değiştirme. Sadece bu sorunla ilgili yerleri değiştir. Bitince hangi dosyada neyi değiştirdiğini kısaca yaz.'
    : 'Rules: never invent facts (names, numbers, quotes, addresses); put a [placeholder] where you do not know and ask me. Do not swap a cliché for a synonym. Change only what this problem needs. When done, list briefly what you changed in which file.');
  return out.join('\n');
}
