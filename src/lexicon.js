// Word lists and patterns. Phrases match from a word start, lower-cased (tr-TR aware), so suffixes still match.
// Rationale, thresholds and sources for every list: docs/CRITERIA.md
//
// STRONG = rare in human writing (EQ-Bench slop lists, Kobak et al. excess vocabulary, Wikipedia
// "Signs of AI writing", GPTZero ratios). WEAK = common in human prose too; only density counts.

export const MONTHS = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık',
  'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/* ---------- English ---------- */
export const SLOP_EN_STRONG = [
  'delve', 'tapestry', 'testament to', 'nestled', 'multifaceted', 'meticulous', 'intricacies', 'showcasing', 'underscores',
  'boasts a', 'boasts an', 'boasts over', 'bolstered', 'garnered', 'realm of', 'interplay', 'beacon of', 'symphony of',
  'myriad of', 'plethora of', 'cornerstone of', 'seamless', 'seamlessly', 'supercharge', 'unleash', 'unlock the power',
  'unlock your', 'unlock the full', 'elevate your', 'elevate the', 'game-changer', 'game changer', 'game-changing',
  'revolutionize', 'revolutionise', 'transformative', 'groundbreaking', 'cutting-edge', 'state-of-the-art', 'next-generation',
  'world-class', 'best-in-class', 'unparalleled', 'harness the power', 'skyrocket', 'reimagine', 'ever-evolving',
  'ever-changing landscape', 'rapidly evolving landscape', 'evolving landscape', 'digital landscape', "in today's fast-paced",
  'in today’s fast-paced', "in today's digital", 'in today’s digital', 'fast-paced world', 'digital age', 'in an era where',
  'increasingly interconnected world', 'navigate the complexities', 'unlock full potential', 'full potential',
  'take your business to the next level', 'to the next level', 'look no further', 'say goodbye to', 'imagine a world where',
  'welcome to the future', 'the future looks bright', 'exciting times ahead', 'the possibilities are endless',
  'join us on this journey', 'let that sink in', 'peace of mind', 'focus on what matters', 'designed with you in mind',
  "we've got you covered", 'we’ve got you covered', 'one-stop shop', 'all-in-one', 'end-to-end solution',
  'tailored to your needs', 'tailored solutions', 'unique value proposition', 'customer-centric approach',
  'drive meaningful results', 'make informed decisions', 'data-driven decisions', 'experience the difference',
  'discover the power of', 'transform the way you', 'start your journey', 'boost your productivity',
  'streamline your workflow', 'streamline workflows', 'like never before', 'at the intersection of', 'a wide range of',
  'a diverse array of', 'empowering', 'empowers', 'empower your', 'actionable insights', 'meaningful insights',
  // portfolio and agency voice
  'passionate about', 'my journey', 'scalable solutions', 'cutting-edge technologies', 'modern technologies', 'pixel-perfect',
  'bring ideas to life', 'bringing ideas to life', 'turning ideas into reality', 'turn your ideas into', 'crafting digital',
  'digital experiences', 'innovative solutions', 'elegant solutions', 'high-quality solutions', 'tech enthusiast', 'ai enthusiast',
  'lifelong learner', 'problem solver', 'results-driven', 'detail-oriented',
];
export const SLOP_EN_WEAK = [
  'robust', 'holistic', 'synergy', 'leverage', 'streamline', 'effortless', 'effortlessly', 'innovative', 'comprehensive',
  'curated', 'bespoke', 'tailored', 'invaluable', 'indispensable', 'vibrant', 'bustling', 'crucial', 'embark', 'foster',
  'paradigm', 'dive into', "let's dive", "let's explore", "here's the thing", "it's important to note",
  'it is important to note', "it's worth noting", 'when it comes to', 'in conclusion', 'in summary', 'ultimately,',
  'at the end of the day',
];

/* ---------- Turkish (unmeasured: see docs/CRITERIA.md, calibrate before trusting thresholds) ---------- */
export const SLOP_TR_STRONG = [
  'günümüzün hızla', 'hızla değişen dünya', 'hızla gelişen dünya', 'dijital çağda', 'dijital çağın', 'dijital dünyada',
  'bir sonraki seviyeye', 'bir üst seviyeye', 'üst seviyeye taşı', 'potansiyelinizi', 'potansiyelini ortaya', 'potansiyelini açığa',
  'kusursuz deneyim', 'kusursuz bir deneyim', 'sorunsuz bir deneyim', 'oyunun kurallarını', 'yenilikçi çözüm', 'devrim niteliğinde',
  'çığır açan', 'uçtan uca', 'ihtiyaçlarınıza özel', 'ihtiyaçlarınıza uygun', 'yolculuğunuz', 'yolculuğa çık', 'dönüşüm yolculuğu',
  'büyüme yolculuğu', 'dünyasını keşfedin', 'gücünü keşfedin', 'farkı deneyimleyin', 'farkı hemen', 'geleceği bugün', 'geleceği şekillendir',
  'hayalinizdeki', 'hadi başlayalım', 'gelin birlikte', 'unutmayın ki', 'bu yazımızda', 'işte bilmeniz gerekenler',
  'tek bir platformda', 'hepsi bir arada', 'tek noktadan', 'ihtiyacınız olan her şey', 'müşteri memnuniyetini ön planda',
  'kaliteli hizmet anlayışı', 'alanında uzman kadro', 'geniş bir yelpaze', 'bünyesinde barındır', 'dijital manzara',
  'kucaklayın', 'derinlemesine dal', 'karmaşıklıkları', 'vazgeçilmez bir parçası', 'uyum sağlama yeteneği',
  'gelecek parlak', 'bu yolculukta yanınızdayız', 'bir adım önde', 'rekabette öne', 'işinizi büyütün', 'verimliliğinizi artır',
  'zahmetsizce', 'en son teknoloji', 'son teknoloji ürünü', 'benzersiz deneyim', 'eşsiz deneyim', 'sınırları zorla',
  'fark yaratın', 'değer katın', 'akıllı çözüm',
  // özgeçmiş, portfolyo ve ajans dili
  'yazılım yolculuğum', 'yolculuğuma', 'kodlama yolculuğum', 'modern teknolojiler', 'ölçeklenebilir çözümler', 'yenilikçi çözümler',
  'katma değer', 'fark yaratan', 'tutkuyla', 'tutkulu bir', 'hayallerinizi gerçeğe', 'fikirlerinizi gerçeğe', 'dijital deneyimler',
  'kullanıcı odaklı çözümler', 'yüksek kaliteli çözümler', 'son teknolojiler', 'teknoloji tutkunu', 'yapay zeka meraklısı',
];
export const SLOP_TR_WEAK = [
  'inovatif', 'keşfedin', 'vazgeçilmez', 'sonuç olarak', 'özetle', 'kısacası', 'güçlendirin', 'dönüştürün', 'kapsamlı',
  'çok yönlü', 'sayısız', 'sürekli gelişen', 'bütüncül', 'ekosistem', 'sinerji', 'vizyoner', 'öncü', 'dönüştürücü',
  'aktif rol', 'katkıda bulun', 'göz atabilirsiniz', 'yazılım dünyası', 'meraklısı', 'kendimi sürekli', 'sürekli öğren',
  'kullanıcı dostu', 'modern web', 'çözümler üret', 'deneyimlerimi paylaş',
];

/* ---------- inflation (content) ---------- */
export const INFLATE_STRONG = [
  'stands as a testament', 'stands as a symbol', 'is a testament to', 'role in shaping', 'indelible mark', 'enduring legacy',
  'lasting legacy', 'setting the stage for', 'reflects a broader', 'reflects the broader', 'deeply rooted', 'unwavering commitment',
  'steadfast dedication', 'marking a pivotal', 'pivotal moment', 'rich tapestry', 'cannot be overstated',
  'kalıcı bir iz bırak', 'dönüm noktası niteliğinde', 'yeni bir çağın', 'zemin hazırl', 'yol haritası çiz', 'önem arz et',
  'sarsılmaz bağlılı', 'kanıtı niteliğinde', 'yadsınamaz', 'silinmez',
];
export const INFLATE_WEAK = [
  'pivotal', 'crucial role', 'vital role', 'key role', 'turning point', 'significant milestone', 'landmark', 'underscores the importance',
  'highlights the importance', 'kritik bir rol', 'kritik rol', 'hayati bir rol', 'önemli bir rol', 'dönüm noktası', 'kilometre taşı', 'önemini vurgula',
  'altını çiziyor', 'büyük önem taşı',
];

export const TRUSTED_BY = [
  'trusted by thousands', 'trusted by teams', 'trusted by leading', 'trusted by industry', 'loved by thousands', 'join thousands',
  'join over', 'trusted by 1', 'trusted by 2', 'trusted by 5', 'thousands of happy', 'binlerce kişi', 'binlerce kullanıcı',
  'binlerce ekip', 'binlerce işletme', 'mutlu müşteri', 'mutlu kullanıcı', 'siz de aramıza katılın',
];

/* ---------- rhetorical patterns ---------- */
export const NEGPAR_EN = [
  /(?<![\p{L}])not (?:just|only|merely|simply) [^.!?\n]{1,80}?,? but(?![\p{L}])/gu,
  /(?<![\p{L}])(?:it'?s|it’s|this is|this isn'?t|isn'?t|isn’t) (?:not )?(?:just|only|merely) [^.!?\n]{1,60}?[,;—–-]\s*(?:it'?s|it’s|it is|but)(?![\p{L}])/gu,
  /(?<![\p{L}])(?:it'?s|it’s) not (?:about )?[^.!?\n]{1,50}?[,;—–.]\s*(?:it'?s|it’s) /gu,
  /(?<![\p{L}])no longer [^.!?\n]{1,50}?\. it(?:'s| is) /gu,
];
export const NEGPAR_TR = [
  /(?<![\p{L}])(?:sadece|yalnızca|salt|sırf) [^.!?\n]{1,80}? değil(?:dir|iz|im)?[,;—–]?\s*(?:aynı zamanda|ayrıca|bilakis|aksine|bir|tam|çok daha)/gu,
  /(?<![\p{L}])[\p{L}]+(?:mekle|makla) kalmay(?:ıp|arak|ın)(?![\p{L}])/gu,
  /(?<![\p{L}])bu bir [\p{L}]+ değil\.\s+bu bir(?![\p{L}])/gu,
  /(?<![\p{L}])(?:mesele|konu|önemli olan) [^.!?\n]{0,60} değil(?![\p{L}])/gu,
];

export const ING_TAIL_EN = /, (?:highlighting|underscoring|emphasizing|emphasising|showcasing|reflecting|symbolizing|symbolising|ensuring|fostering|cultivating|contributing to|paving the way for|cementing|solidifying) [^.!?\n]{3,100}/gu;
export const ING_TAIL_TR = /, [^,.!?\n]{3,80}?(?:vurgula|yansıt|pekiştir|güçlendir|öne çıkar|gözler önüne ser|katkı sağla|zemin hazırla|perçinle)(?:yarak|erek|arak)(?![\p{L}])/gu;

// "from beginners to experts" with no real scale; "KOBİ'lerden büyük kurumlara kadar"
export const FALSE_RANGE_EN = /(?<![\p{L}])from (?!\d)([a-z][a-z' -]{2,30}?) to (?!\d)([a-z][a-z' -]{2,30}?)(?=[,.;!?]|$| and )/gu;
export const FALSE_RANGE_TR = /(?<![\p{L}])([\p{L}'’ ]{3,30}?)(?:dan|den|tan|ten)\s+([\p{L}'’ ]{3,30}?)(?:y?[ae]|n[ae]) kadar(?![\p{L}])/gu;
export const RANGE_OK = /\d|morning|night|start|finish|beginning|end|a to z|top to bottom|monday|friday|sabah|akşam|baştan|sona|pazartesi|cuma/i;

export const AUDIENCE_EN = /whether you(?:'re|’re| are) an? [^.!?\n]{1,40} or an? |(?:teams|businesses|companies|organi[sz]ations) of all sizes|for everyone|no matter (?:your|what|who)|whatever your needs/giu;
export const AUDIENCE_TR = /(?<![\p{L}])ister [^.!?\n]{1,40} ister [^.!?\n]{1,40} olun|her ölçekte(?:ki)? (?:işletme|şirket|ekip)|herkes için|ihtiyaçlarınız ne olursa olsun|konu ne olursa olsun/giu;

export const WEASEL = /(?<![\p{L}])(?:experts|studies|research|industry reports|observers|critics) (?:say|show|suggest|argue|believe|agree)|it is (?:widely )?believed|(?:uzmanlar|araştırmalar|çalışmalar)[^.!?\n]{0,30}(?:gösteriyor|belirtiyor|ortaya koyuyor|söylüyor)|bilinen bir gerçektir|şüphesiz ki|aşikârdır|aşikardır/giu;

export const CLOSER_OPENER = /^(?:in conclusion|in summary|to sum up|ultimately|overall|sonuç olarak|özetle|kısacası|netice itibarıyla|toparlamak gerekirse|son olarak|unutmayın),|^(?:are you looking for|have you ever wondered|picture this:|imagine a world|hiç [^.?]{1,40} merak ettiniz mi)/iu;

export const TR_TRANSITIONS = /^(?:ayrıca|dahası|ek olarak|bunun yanı sıra|öte yandan|sonuç olarak|bununla birlikte|bu bağlamda|bu noktada),/iu;
export const TR_BUREAU = /(?<![\p{L}])[\p{L}]+m(?:a|e)kt(?:a|e)d(?:ı|i|u|ü)r(?:lar|ler)?(?![\p{L}])/gu;

export const GENERIC_CTA = [
  /^(?:get started|get started (?:today|now|for free)|start now|learn more|try it now|try now|try (?:it )?for free|sign up now|join now|explore now|discover more|let'?s go!?|start for free|start your free trial|request a demo|book a demo|get in touch|contact us today)\s*[!→›»]*$/i,
  /^(?:hemen başla|hemen başlayın|şimdi başla|daha fazla bilgi|daha fazlasını keşfet|keşfet|keşfedin|hemen dene|hemen deneyin|ücretsiz dene|ücretsiz deneyin|ücretsiz başla|bize katıl|siz de aramıza katılın|hadi başlayalım|bize ulaşın)\s*[!→›»]*$/i,
];

/* ---------- unfinished / leftovers ---------- */
export const PLACEHOLDER = [
  ['lorem', /lorem ipsum|dolor sit amet|consectetur adipiscing/i],
  ['company', /your company(?: name)?|company name(?: here)?|your name here|şirket ad[ıi]n[ıi]z|şirket ad[ıi]|firma ad[ıi]|acme (?:inc|corp)/i],
  ['person', /john doe|jane doe|jane smith|john smith|ali veli/i],
  ['insert', /\[(?:insert|your |buraya|şirket|adınız|firma|ürün|şehir|company|client|product|name|city|isim)[^\]]{0,30}\]|INSERT_[A-Z_]{3,}|PASTE_[A-Z_]*_HERE|\b20\d\d-XX-XX\b/i],
  // an unrendered {{ variable }} is a leftover only in a rendered page; in Vue/Handlebars sources it is normal
  ['template-var', /\{\{\s*[a-z_]+\s*\}\}/i, 'page'],
  ['example', /example\.com|placeholder text|123 main st|\(555\) ?\d{3}|555-0\d{3}|your-?email@/i],
];

export const SECTION_COMMENT = /^(?:the |main |new )?(?:hero|features?|testimonials?|pricing|cta|call to action|footer|header|navbar|nav(?:igation)?|about(?: us)?|faq|contact|benefits|how it works|stats|statistics|newsletter|logos?|trusted by|social proof|team|services|portfolio|gallery|blog|background (?:glow|blobs?|gradient)|decorative)(?: section| area| block| component| grid| cards?)?\s*(?:start|end)?\s*$/i;

export const CHATBOT = /as an ai(?: language model)?|as a large language model|i hope this helps|(?:^|\s)(?:certainly|of course|sure|absolutely)! here(?:'s| is)|(?:great|excellent) question|you'?re absolutely right|here(?:'s| is) (?:a|the|an) (?:revised|rewritten|updated|improved|draft) |i cannot browse|as of my (?:last|latest) (?:knowledge|training) (?:update|cutoff)|my knowledge cutoff|up to my last training|bir yapay zek[âa] (?:dil )?modeli olarak|ben bir yapay zek[âa]y[ıi]m|umarım (?:bu )?(?:size )?(?:yardımcı|faydalı) ol|(?:elbette|tabii|tabi|kesinlikle)! işte|harika bir soru|bilgi kesim tarihim|son (?:bilgi )?güncellememe göre/i;

export const CHAT_CITATIONS = /utm_source=(?:chatgpt\.com|openai|copilot(?:\.com)?|perplexity|claude\.ai|gemini)|referrer=grok\.com|contentReference\[oaicite:\d+\]|oai_citation|\bcite?turn\d+(?:search|news|file|image)\d+|\{"attribution":\{"attributableIndex"|【\d+†L\d+-\d+】|\[cite:\s*\d+\]|\[span_\d+\]\((?:start|end)_span\)|\[(?:web|attached_file):\d+\]|<grok-card|\uE200(?:file)?cite/g;

export const DEFAULT_TITLES = /^(?:vite \+ react(?: \+ ts)?|vite app|react app|create next app|next\.js app|my v0 project|v0 app|lovable(?: app| generated project)?|bolt(?: app)?|my app|my website|untitled|document|home|astro|sveltekit app|nuxt app|landing page|new project)$/i;
export const DEFAULT_DESCRIPTIONS = /^(?:lovable generated project|created with v0|generated by create next app|web site created using create-react-app|a vite \+ react app|my (?:new )?website)$/i;

/* ---------- builder residue ---------- */
export const BUILDER_HOSTS = [
  ['Lovable', /\.lovable\.(?:app|dev)$|\.lovableproject\.com$/],
  ['Bolt', /\.bolt\.(?:host|new)$|^bolt\.new$/],
  ['Replit', /\.replit\.app$|\.repl\.co$|\.replit\.dev$/],
  ['Base44', /\.base44\.app$/],
  ['v0', /\.v0\.(?:app|dev)$|vusercontent\.net$/],
  ['GPT Engineer', /\.gptengineer\.app$/],
  ['Create', /\.created\.app$|\.createanything\.com$/],
];
export const BUILDER_MARKS = [
  ['Lovable', /lovable-uploads|data-lov-id|gptengineer\.js|cdn\.gpteng\.co|lovable-tagger|edit with lovable|lovable-badge|lovable generated project|content=["']lovable["']|lovable\.dev\/(?:projects|opengraph)|vite_react_shadcn_ts|gpt-engineer-app/i],
  ['Bolt', /made (?:with|in) bolt|built with bolt|bolt\.new|stackblitz\.io\/bolt|bolt-vite-react-ts/i],
  ['v0', /built with v0|created with v0|v0\.dev|content=["']v0\.app["']|my-v0-project/i],
  ['Base44', /@base44\/sdk|base44\.app|base44\.com\/(?:apps|api)|(?:made|built) (?:with|on) base44|base44-badge/i],
  ['Replit', /made with replit|replit-badge|replit\.com\/badge|@replit\/vite-plugin|replit-dev-banner/i],
];

/* ---------- content & trust ---------- */
export const AVATAR_HOSTS = /(?:i\.)?pravatar\.cc|randomuser\.me|xsgames\.co\/randomusers|thispersondoesnotexist|generated\.photos|api\.dicebear\.com|robohash\.org|ui-avatars\.com|images\.unsplash\.com\/photo-[\w-]+\?[^"' )]*(?:crop=faces|facearea)/gi;
export const PLACEHOLDER_IMG = /placehold\.co|via\.placeholder\.com|placeholder\.com\/|picsum\.photos|loremflickr\.com|dummyimage\.com|source\.unsplash\.com|placekitten\.com|placeimg\.com|\/placeholder\.(?:svg|png|jpg)/gi;
export const LOGO_PLACEHOLDER = /logoipsum|\bglobex\b|\binitech\b|umbrella corp|acme corp|\bhooli\b|vandelay|pied piper|massive dynamic|\btechcorp\b|startupxyz/gi;
export const AI_IMAGE = /ChatGPT[ _-]?Image[ _]|Gemini_Generated_Image_|DALL[·.]?E[ _-]\d{4}-\d{2}-\d{2}|dall-e|midjourney|cdn\.midjourney\.com|\bmj_\w+|leonardo[_-]ai|cdn\.leonardo\.ai|ideogram\.ai\/api\/images|firefly[ _-]|stable[_-]?diffusion|\bsdxl\b|oaidalleapiprodscus|files\.oaiusercontent\.com|replicate\.delivery|fal\.media|image\.lexica\.art|trainedAlgorithmicMedia|compositeSynthetic/gi;
export const TESTIMONIAL_GENERIC = [
  'game-changer', 'game changer', 'highly recommend', 'exceeded my expectations', 'exceeded our expectations',
  'transformed our business', 'transformed the way', "couldn't be happier", 'could not be happier', 'amazing team',
  'changed my life', 'best decision', 'five stars', '5 stars', 'a must-have', 'oyunun kurallarını', 'kesinlikle tavsiye',
  'herkese tavsiye', 'hayatımı değiştirdi', 'işimizi dönüştürdü', 'çalışma şeklimizi', 'harika bir deneyim',
  'beklentilerimi aştı', 'beklentilerimizi aştı', 'en iyi karar',
];
export const CLAIMS_EN = [
  'award-winning', 'award winning', 'number one', '#1 ', 'industry-leading', 'industry leading', 'market-leading',
  'leading provider', 'best-in-class', 'best in class', "world's first", 'world’s first', 'as seen on', 'as seen in',
  'featured in', 'trusted by industry leaders', 'unmatched', 'most trusted', 'most advanced',
];
export const CLAIMS_TR = [
  'ödüllü', 'sektörün lideri', 'sektör lideri', 'lider firma', 'lider şirket', "türkiye'nin en iyi", 'türkiye’nin en iyi',
  '1 numaralı', 'bir numaralı', 'alanında öncü', 'alanında lider', 'alanının en iyisi', 'rakipsiz', 'eşi benzeri olmayan',
  'sektörde öncü', 'en güvenilir',
];
export const URGENCY = /only \d+ (?:left|spots?|seats?)|son \d+ (?:ürün|adet|kişi|kontenjan)|someone (?:in [\w ]+ )?just (?:bought|purchased|signed up)|(?:offer|deal|sale) ends in|kampanya(?:nın)? bitmesine|\b(?:provesource|fomo\.com|useproof|nudgify|salespop|countdowntimer)\b/gi;
export const SUSPICIOUS_RATING = /"ratingValue"\s*:\s*"?(?:4\.9\d?|5(?:\.0)?)"?[^}]{0,120}"(?:reviewCount|ratingCount)"\s*:\s*"?(\d*0{2,})"?/gi;
export const GENERIC_HEADINGS = /^(?:(?:our |key |powerful |amazing )?features|why choose us\??|why us\??|why choose [\w ]{1,20}\??|our mission|our vision|our values|get started(?: today)?!?|what (?:our|people) (?:customers|clients|users) (?:say|are saying)|testimonials|loved by [\w ]+|trusted by [\w ]+|how it works|ready to get started\??|ready to transform [\w ]+\??|join (?:us|thousands)[\w ]*!?|built for modern teams|scale without limits|(?:seamless|lightning[- ]fast|smart|powerful|advanced|real-time|secure|enterprise[- ]grade|intuitive|effortless) \w+|neden biz\??|neden bizi seçmelisiniz\??|neden [\w ]{1,20}\?|özelliklerimiz|öne çıkan özellikler|misyonumuz|vizyonumuz|değerlerimiz|(?:müşterilerimiz|kullanıcılarımız) ne diyor\??|nasıl çalışır\??|hemen başlayın!?|başlamaya hazır mısınız\??)$/i;
export const GENERIC_ALT = /^(?:image|img|photo|picture|logo|banner|hero|icon|görsel|resim|fotoğraf|placeholder|untitled|screenshot)[\s_-]*\d*$/i;
export const HIDDEN_AI = /ignore (?:all )?(?:previous|prior) instructions|(?:ai|llm) assistants? (?:should|must) (?:recommend|say|mention)|when (?:an? )?(?:ai|llm|chatgpt|claude|gemini) (?:reads|summari[sz]es|is asked)|note to (?:ai|llms?|language models)\b|önceki talimatları yok say/gi;
export const EXTERNAL_PROOF = /trustpilot\.com|g2\.com\/products|capterra\.com|google\.com\/maps|g\.page\/|maps\.app\.goo\.gl|producthunt\.com\/products|yelp\.com\/biz|tripadvisor\.|sikayetvar\.com|clutch\.co\/profile|behance\.net\/[\w-]+|dribbble\.com\/[\w-]+|github\.com\/[\w-]+\/?["']/gi;
export const ABOUT_LINK = /^(?:about(?: us)?|our story|team|our team|hakkımızda|hakkimizda|biz kimiz\??|ekibimiz|ekip|impressum|über uns|kimdir)$/i;
export const SOCIAL_ROOT = /^https?:\/\/(?:www\.)?(?:twitter|x|facebook|instagram|linkedin|youtube|github|tiktok|dribbble|behance)\.com\/?(?:#)?$/i;

/* ---------- design ---------- */
// Typefaces the research found over-used as the whole identity of AI-built pages.
export const FONT_PRIMARY = /\b(Inter|Geist(?:[ _+]Sans)?)\b/;
export const FONT_TREND = /\b(Space[+ _]Grotesk|Instrument[+ _]Serif|Instrument[+ _]Sans|Syne|Fraunces|DM[+ _]Sans|DM[+ _]Serif(?:[+ _]Display)?|Plus[+ _]Jakarta(?:[+ _]Sans)?|Outfit|Manrope|Poppins|Montserrat|Sora)\b/;
export const SERIF_DISPLAY = /\b(Fraunces|Playfair(?:[+ _]Display)?|Cormorant(?:[+ _]Garamond)?|Lora|Crimson(?:[+ _]Pro|[+ _]Text)?|Newsreader|Instrument[+ _]Serif|DM[+ _]Serif|EB[+ _]Garamond|Libre[+ _]Baskerville)\b/;
export const GIMMICK_COMPONENTS = /<(Meteors|BackgroundBeams(?:WithCollision)?|Spotlight|SparklesCore|AuroraBackground|BorderBeam|ShimmerButton|AnimatedGradientText|Particles|RetroGrid|DotPattern|GridPattern|TextGenerateEffect|TypewriterEffect(?:Smooth)?|BackgroundGradientAnimation|WavyBackground|LampContainer|ShootingStars|StarsBackground|Vortex|GlowingStarsBackgroundCard|MagicCard|NeonGradientCard)\b/g;
export const DEFAULT_THEME_TOKENS = /--radius:\s*0\.625rem|--primary:\s*oklch\(0\.205 0 0\)|--foreground:\s*oklch\(0\.145 0 0\)|--muted-foreground:\s*oklch\(0\.556 0 0\)|--primary:\s*222\.2 47\.4% 11\.2%|--foreground:\s*222\.2 84% 4\.9%|--muted-foreground:\s*215\.4 16\.3% 46\.9%/g;


/* ---------- 2026 template signals (sources: Sailop 21 signs, Slopdar, 925 Studios, CodeMySpec, Krebs) ---------- */
// Hero headline formulas: say "better" without saying what
export const HEADLINE_FORMULA = [
  /\b(?:supercharge|transform|elevate|unlock|empower|revolutioni[sz]e|reimagine|accelerate|amplify|turbocharge|10x) your\b/i,
  /,\s*reimagined\.?$/i, /\bthe future of [\w ]{2,30}(?: is here)?\.?$/i, /\b[\w ]{2,30} made (?:simple|easy|effortless)\.?$/i,
  /\byour all-in-one\b/i, /\ball-in-one (?:platform|solution|workspace|hub)\b/i, /\b(?:build|ship|grow|scale|work) (?:faster|smarter)\b/i,
  /\bfor the modern [\w ]{2,25}\b/i, /\bwhere [\w ]{2,25} meets [\w ]{2,25}\b/i, /\bscale without limits\b/i, /\bbuild the future\b/i,
  /\bthat (?:just )?works\.?$/i, /\beverything you need to\b/i, /\bthe (?:only|last) [\w ]{2,25} you(?:'ll|’ll| will)? ever need\b/i,
  /\bturn (?:your )?[\w ]{2,25} into\b/i, /\ba smarter way to\b/i, /\bat the speed of\b/i, /\bnext[- ]gen(?:eration)? [\w ]{2,25}\b/i,
  /\bin (?:just )?(?:a few|one|minutes|seconds)\b.*\.?$/i, /\bai[- ]powered [\w ]{2,25}\b/i,
  /geleceği(?:ni)?\s*(?:bugün|şimdi|şekillendir)/i, /(?:hiç olmadığı|olmadığı) kadar (?:kolay|hızlı|akıllı)/i, /tek (?:bir )?platformda/i,
  /yeniden tanımlı?y/i, /bir sonraki seviyeye/i, /yapay zek[âa] destekli/i, /(?:işinizi|ekibinizi|verimliliğinizi) (?:büyütün|güçlendirin|artırın)/i,
];
// Canonical microcopy; three or more on a page is a template
export const STOCK_MICROCOPY = [
  'get started', 'get started for free', 'start for free', 'try it free', 'try for free', 'start your free trial', 'start free trial',
  'learn more', 'watch demo', 'watch the demo', 'book a demo', 'request a demo', 'schedule a demo', 'see how it works',
  'no credit card required', 'cancel anytime', '14-day free trial', 'free forever', 'join thousands', 'trusted by', 'loved by',
  'ready to get started', 'ready to transform', 'ready to take', 'ready to level up', 'in just a few clicks', 'powered by ai',
  'ai-powered', 'built for', 'designed for', 'all rights reserved', 'most popular', 'contact sales', 'join the waitlist',
  'hemen başla', 'ücretsiz dene', 'ücretsiz başla', 'daha fazla bilgi', 'demo talep et', 'kredi kartı gerekmez', 'istediğin zaman iptal',
  'binlerce kullanıcı', 'tüm hakları saklıdır', 'en popüler', 'yapay zeka destekli', 'birkaç tıkla', 'başlamaya hazır mısınız',
];
// Tailwind's default palette written out as hex in hand-made CSS
export const TW_HEX = new Set(['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc',
  '#111827', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#f9fafb', '#09090b', '#18181b',
  '#27272a', '#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7', '#f4f4f5', '#a855f7', '#9333ea', '#7e22ce', '#c084fc',
  '#8b5cf6', '#7c3aed', '#6d28d9', '#a78bfa', '#6366f1', '#4f46e5', '#4338ca', '#818cf8', '#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa',
  '#ec4899', '#db2777', '#f472b6', '#d946ef', '#c026d3', '#06b6d4', '#0891b2', '#22d3ee', '#10b981', '#059669', '#34d399', '#14b8a6',
  '#22c55e', '#16a34a', '#f59e0b', '#eab308', '#ef4444', '#dc2626', '#f97316', '#0ea5e9', '#38bdf8']);
// effects people paste from snippets and libraries, outside React components
export const GIMMICK_CODE = [
  ['typing effect', /isDeleting|new Typed\(|typed\.js|typewriter(?:-effect)?|class=["'][^"']*\btyp(?:ing|ed)\b/i],
  ['custom cursor', /cursor-follower|cursor-dot|cursor-outline|custom-cursor|class=["'][^"']*\bcursor\b["']|\.cursor\s*\{[^}]*position\s*:\s*(?:fixed|absolute)/i],
  ['particles', /particles\.js|particlesJS|tsparticles|particles-js/i],
  ['floating shapes', /class=["'][^"']*\b(?:cube|blob|orb|floating-shape|shape-\d)\b[^"']*["'][\s\S]{0,200}class=["'][^"']*\b(?:cube|blob|orb|floating-shape|shape-\d)\b/i],
  ['tilt cards', /vanilla-tilt|data-tilt\b|tilt\.js/i],
  ['scramble text', /scramble|glitch-text|class=["'][^"']*\bglitch\b/i],
  ['matrix rain', /matrix-rain|matrixRain/i],
];
export const PORTFOLIO_SECTIONS = /^(?:about(?: me)?|skills|tech stack|experience|work experience|projects|my projects|portfolio|contact(?: me)?|services|education|hakkımda|yetenekler(?:im)?|beceriler(?:im)?|deneyim(?:ler(?:im)?)?|projeler(?:im)?|iletişim|hizmetler(?:im)?|eğitim)$/i;
