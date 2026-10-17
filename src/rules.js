// Every rule reads the shared corpus and returns zero or more findings.
// A finding: { id, cat, pts, kind: 'issue'|'strength'|'info', title, detail, fix (all {en,tr}),
//              evidence: string[], locations: {file,line,snippet}[], effort, needsFacts }
import {
  lowTR, lowEN, clip, uniq, round1, wordsOf, splitSentences, isTitleCase, detectLang,
  countPhrases, sumHits, hitList, colorsIn, isPurple, hexToHsl, gzipRatio, EMOJI, isEmojiOnly, reEsc,
} from './util.js';
import * as LX from './lexicon.js';

const t = (en, tr) => ({ en, tr });

/* ---------- context ---------- */
export function buildContext(C, { now = new Date() } = {}) {
  const text = C.text || '';
  const lines = text.split('\n').filter(Boolean);
  const words = wordsOf(text);
  const proseLines = lines.filter((l) => wordsOf(l).length >= 6 && !isTitleCase(l));
  const sentences = proseLines.flatMap(splitSentences).filter((s) => wordsOf(s).length >= 4);
  const lang = detectLang(text);
  const sources = C.sources || [{ file: null, content: C.raw || '', lineAt: () => null }];
  return {
    C, now, text, lines, words, W: words.length, proseLines, sentences, lang,
    // a short phrase in quotation marks is being talked about, not used: 'avoid words like "seamless"'
    loTR: lowTR(stripMentions(text)), loEN: lowEN(stripMentions(text)),
    per1k: (n) => (words.length ? (n / words.length) * 1000 : 0),
    project: C.kind === 'project',
    sources,
    classTokens: C.classes.flatMap((c) => c.value.split(/\s+/).filter(Boolean).map((tok) => ({ tok, loc: c.loc }))),
    cssText: C.css.map((c) => c.text).join('\n'),
    vars: cssVarMap(C.css.map((c) => c.text).join('\n')),
    jsText: C.jsText || '',
    // measurements from a real browser, when one was available (src/visual.js)
    vis: C.visual || null,
  };
}

const MAXLOC = 8;
// CSS custom properties: the first definition wins (that is the default theme)
function cssVarMap(css) {
  const m = new Map();
  for (const x of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]{1,200})/g)) if (!m.has(x[1])) m.set(x[1], x[2].trim());
  return m;
}
function resolveVars(str, vars, depth = 0) {
  if (depth > 4 || !str.includes('var(')) return str;
  return resolveVars(str.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]+))?\)/g, (a, n, fb) => (vars.has(n) ? vars.get(n) : fb || a)), vars, depth + 1);
}
function stripMentions(text) {
  return text.replace(/(["“«‘])([^"“”«»‘’\n]{1,80})(["”»’])/g, (m, a, inner, b) => (inner.trim().split(/\s+/).length <= 8 ? ' ' : m));
}
const locOf = (item, snippet) => (item && item.loc ? { file: item.loc.file, line: item.loc.line, snippet: clip(snippet ?? item.text ?? '', 220) } : null);
const locs = (arr) => {
  const seen = new Set();
  const out = [];
  for (const l of arr) {
    if (!l || !l.file) continue;
    const k = `${l.file}:${l.line}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(l);
  }
  return out.slice(0, MAXLOC);
};

/** Copy items (with locations) that contain any of the phrases. */
function copyWith(ctx, phrases) {
  const out = [];
  for (const c of ctx.C.copy) {
    const a = lowTR(c.text), b = lowEN(c.text);
    const hit = phrases.find((p) => {
      const re = new RegExp(`(?<![\\p{L}])${reEsc(p)}`, 'u');
      return re.test(a) || re.test(b);
    });
    if (hit) out.push({ item: c, hit });
  }
  return out;
}

/** Regex over raw sources, with file:line when scanning a project. */
function findAll(ctx, re, max = 50, { copyOnly = false } = {}) {
  const out = [];
  for (const s of ctx.sources) {
    // a site's linked bundles hold library code, i18n templates and licence headers, not the page's copy
    if (copyOnly && s.asset) continue;
    for (const m of s.content.matchAll(re)) {
      out.push({ match: m[0], m, loc: s.file ? { file: s.file, line: s.lineAt(m.index) } : null });
      if (out.length >= max) return out;
    }
  }
  return out;
}
const examples = (ctx, list, n = 2) => {
  const res = [];
  for (const s of ctx.sentences) {
    const a = lowTR(s), b = lowEN(s);
    if (list.some((x) => a.includes(x) || b.includes(x))) res.push(clip(s));
    if (res.length >= n) break;
  }
  return res;
};

/* ================= CONTENT SUBSTANCE ================= */
const content = [
  function specificity(ctx) {
    if (ctx.W < 120) return null;
    const prose = ctx.proseLines.join('\n');
    const pw = Math.max(1, wordsOf(prose).length);
    if (pw < 80) return null;
    // an archive of dated posts or news is concrete by nature, even when each teaser is short
    const dates = (lowTR(ctx.text).match(new RegExp(`(?:${LX.MONTHS.join('|')})[^\\n]{0,4}(?:19|20)\\d{2}|(?:19|20)\\d{2}-\\d{2}-\\d{2}|\\d{1,2}[./]\\d{1,2}[./](?:19|20)\\d{2}`, 'gu')) || []).length;
    if (dates >= 4) return null;
    const nums = (prose.match(/(?<![\p{L}])\d[\d.,:/]*/gu) || []).length;
    const money = (prose.match(/[₺$€£]\s?\d|\d\s?(?:TL|USD|EUR|₺|€|\$)/g) || []).length;
    const months = (lowTR(prose).match(new RegExp(`(?<![\\p{L}])(?:${LX.MONTHS.join('|')})(?![\\p{L}])`, 'gu')) || []).length;
    let propers = 0;
    const ex = [];
    for (const s of ctx.sentences) {
      for (const w of s.split(/\s+/).slice(1)) {
        const clean = w.replace(/^[^\p{L}]+|[^\p{L}\p{N}]+$/gu, '');
        if (/^\p{Lu}[\p{Ll}]{2,}/u.test(clean)) { propers++; if (ex.length < 8) ex.push(clean); }
      }
    }
    const ratio = ((nums + money + months + propers * 0.5) / pw) * 100;
    const pts = ratio < 1 ? 12 : ratio < 2 ? 8 : ratio < 3.5 ? 4 : 0;
    if (!pts) return null;
    return {
      id: 'specificity', cat: 'content', pts, effort: 'rewrite', needsFacts: true,
      title: t('Little concrete information', 'Somut bilgi az'),
      detail: t(
        `Body copy has ${round1(ratio)} concrete items per 100 words (numbers, dates, prices, names). Below 3.5 reads as generic.`,
        `Metin gövdesinde her 100 kelimeye ${round1(ratio)} somut öğe düşüyor (sayı, tarih, fiyat, isim). 3,5'in altı genel geçer okunur.`),
      evidence: ex.length ? [`names found: ${uniq(ex).join(', ')}`] : [],
      fix: t('Replace general claims with facts only this business has: numbers, customer names, prices, dates, process details. Ask the owner for them; never invent them.',
        'Genel iddiaları yalnızca bu işletmenin sahip olduğu bilgilerle değiştirin: rakamlar, müşteri isimleri, fiyatlar, tarihler, süreç detayları. Bunları sahibine sorun, asla uydurmayın.'),
    };
  },

  function inflation(ctx) {
    const strong = Object.assign(countPhrases(ctx.loEN, LX.INFLATE_STRONG.filter((x) => /^[a-z ]+$/.test(x))), countPhrases(ctx.loTR, LX.INFLATE_STRONG.filter((x) => !/^[a-z ]+$/.test(x))));
    const weak = Object.assign(countPhrases(ctx.loEN, LX.INFLATE_WEAK.filter((x) => /^[a-z ]+$/.test(x))), countPhrases(ctx.loTR, LX.INFLATE_WEAK.filter((x) => !/^[a-z ]+$/.test(x))));
    const nS = sumHits(strong), nW = sumHits(weak);
    if (!nS && nW < 2) return null;
    const hits = { ...strong, ...weak };
    const where = copyWith(ctx, Object.keys(hits));
    return {
      id: 'inflation', cat: 'content', pts: Math.min(8, nS * 2 + nW), effort: 'rewrite', needsFacts: true,
      title: t('Inflated importance', 'Önem şişirme'),
      detail: t(`${nS + nW} phrases assert significance ("a testament to", "pivotal role in shaping") without showing a consequence.`, `${nS + nW} ifade bir şeyin önemli olduğunu sonucunu göstermeden söylüyor ("kritik bir rol", "dönüm noktası").`),
      evidence: [hitList(hits).join(' · '), ...examples(ctx, Object.keys(hits))],
      locations: locs(where.map((w) => locOf(w.item))),
      fix: t('Keep the fact, drop the significance claim. If it matters, show the consequence with a number.', 'Bilgiyi tutun, önem iddiasını atın. Gerçekten önemliyse sonucunu bir rakamla gösterin.'),
    };
  },

  // a landing page with headings and buttons but almost nothing said: thin content in Google's sense
  function thinPage(ctx) {
    if (ctx.project || ctx.W < 12 || ctx.W >= 120) return null;
    const heads = ctx.C.headings.length;
    const ctas = ctx.C.buttons.filter((b) => b.text && wordsOf(b.text).length <= 5).length;
    if (heads < 2 || ctas < 1) return null;
    // sign-in, checkout and error pages are short on purpose (a "Log in" link in the menu does not make one)
    const first = ctx.C.headings[0]?.text || '';
    if (ctx.sources.some((x) => !x.asset && /type=["']?password/i.test(x.content))
      || /sign in|log in|login|welcome back|create (?:an |your )?account|giriş|kayıt ol|404|not found|bulunamadı|checkout|ödeme|sepet/i.test(first)
      // a contact page is short by nature
      || /contact|get in touch|iletişim|bize (?:yaz|ulaş)/i.test(`${first} ${ctx.C.meta?.title || ''} ${ctx.C.url || ''}`) || /iletisim|contact/i.test(ctx.C.url || '')) return null;
    return {
      id: 'thin-page', cat: 'content', pts: ctx.W < 60 ? 6 : 4, effort: 'rewrite', needsFacts: true,
      title: t('A landing page that says almost nothing', 'Neredeyse hiçbir şey söylemeyen sayfa'),
      detail: t(`${ctx.W} words in ${heads} headings and ${ctas} buttons. Visitors and search engines get a headline and a button, not what it is, for whom, at what price.`,
        `${heads} başlık ve ${ctas} butonda toplam ${ctx.W} kelime. Ziyaretçi ve arama motoru bir başlık ve buton görüyor; ne olduğunu, kimin için ve ne fiyata olduğunu görmüyor.`),
      evidence: [`${ctx.W} words`, ...ctx.C.headings.slice(0, 2).map((h) => clip(h.text, 60))],
      locations: locs(ctx.C.headings.slice(0, 3).map((h) => locOf(h, h.text))),
      fix: t('Add what only the owner knows: what it does in one concrete example, who it is for, the price or how to get it, a real screenshot.', 'Yalnızca sahibinin bildiklerini ekleyin: tek somut örnekle ne yaptığı, kimin için olduğu, fiyatı ya da nasıl edinileceği, gerçek bir ekran görüntüsü.'),
    };
  },

  function vanity(ctx) {
    const found = [];
    for (const c of ctx.C.copy) {
      // stat tiles and badges, not numbers inside reporting prose
      if (wordsOf(c.text).length > 18) continue;
      const ms = [
        ...(c.text.match(/\d{1,3}(?:[.,]\d{3})+\s?\+|\d+\s?(?:k|K|bin|B|M|million|milyon)\+|\b\d+\+(?=\s|$)/g) || []),
        ...(c.text.match(/%\s?\d{2,3}(?:[.,]\d)?|\d{2,3}(?:[.,]\d)?\s?%/g) || []),
        ...(c.text.match(/(?<![\p{L}\d])\d{1,3}\s?(?:x|X|kat)(?![\p{L}])/gu) || []),
      ];
      for (const m of ms) found.push({ m, item: c });
    }
    const vals = uniq(found.map((f) => f.m.trim()));
    if (vals.length < 3) return null;
    return {
      id: 'vanity', cat: 'content', pts: Math.min(5, vals.length), effort: 'rewrite', needsFacts: true,
      title: t('Unsourced vanity numbers', 'Kaynaksız vitrin rakamları'),
      detail: t('Round percentages, "10,000+" and "5x" claims sit there without what, who or when.', 'Yuvarlak yüzdeler, "10.000+" ve "5 kat" türü iddialar neyi, kimin, ne zaman ölçtüğü belirtilmeden duruyor.'),
      evidence: [vals.slice(0, 8).join(' · ')],
      locations: locs(found.map((f) => locOf(f.item, f.item.text))),
      fix: t('Keep a number only if the owner can source it; then say what was measured and when. Delete the rest.', 'Bir rakamı yalnızca sahibi kaynağını gösterebiliyorsa tutun ve neyin ne zaman ölçüldüğünü yazın. Gerisini silin.'),
    };
  },

  function fakeProof(ctx) {
    const ev = [];
    const L = [];
    let n = 0;
    for (const r of [...findAll(ctx, LX.AVATAR_HOSTS, 20), ...findAll(ctx, LX.LOGO_PLACEHOLDER, 10)]) { n++; ev.push(r.match); L.push(r.loc && { ...r.loc, snippet: clip(r.match, 80) }); }
    for (const w of copyWith(ctx, LX.TRUSTED_BY)) { n++; ev.push(clip(w.item.text, 80)); L.push(locOf(w.item)); }
    // quoted testimonials built from stock praise
    const quoted = ctx.C.copy.filter((c) => /^["“«„']/.test(c.text.trim()) || /["”»]$/.test(c.text.trim()));
    for (const c of quoted) {
      const lo = lowTR(c.text);
      if (LX.TESTIMONIAL_GENERIC.some((p) => lo.includes(p))) { n++; ev.push(clip(c.text, 90)); L.push(locOf(c)); }
    }
    if (!n) return null;
    return {
      id: 'fake-proof', cat: 'content', pts: Math.min(6, 2 + n), effort: 'rewrite', needsFacts: true,
      title: t('Generic or stock social proof', 'Genel geçer ya da stok sosyal kanıt'),
      detail: t('Placeholder avatars, nameless "trusted by thousands" lines and testimonials made of stock praise read as invented proof. Fake reviews are also illegal in the US (FTC rule, 2024) and UK (DMCC Act, 2025).',
        'Yer tutucu avatarlar, isimsiz "binlerce kişi güveniyor" cümleleri ve kalıp övgülerden oluşan yorumlar uydurma kanıt gibi okunur. Sahte yorumlar ABD\'de (FTC, 2024) ve Birleşik Krallık\'ta (DMCC, 2025) ayrıca yasa dışı.'),
      evidence: uniq(ev).slice(0, 6),
      locations: locs(L),
      fix: t('Use real testimonials with full name, role, company and date (with permission), link the original review, or remove the section. Never generate testimonials.',
        'Gerçek yorumları tam isim, unvan, şirket ve tarihle (izin alarak) kullanın, orijinal yoruma link verin ya da bölümü kaldırın. Asla yorum üretmeyin.'),
    };
  },

  function unverifiedClaims(ctx) {
    const hits = Object.assign(countPhrases(ctx.loEN, LX.CLAIMS_EN), countPhrases(ctx.loTR, LX.CLAIMS_TR));
    const n = sumHits(hits);
    if (!n) return null;
    const where = copyWith(ctx, Object.keys(hits).map((s) => s.trim()));
    return {
      id: 'unverified-claims', cat: 'content', pts: Math.min(4, n * 1.5), effort: 'rewrite', needsFacts: true,
      title: t('Claims nobody can check', 'Kimsenin doğrulayamayacağı iddialar'),
      detail: t('"Award-winning", "#1", "industry-leading", "as seen in" without naming the award, ranking or outlet.', '"Ödüllü", "sektörün lideri", "1 numaralı" gibi iddialar; ödül, sıralama ya da yayın adı verilmeden.'),
      evidence: [hitList(hits).join(' · '), ...examples(ctx, Object.keys(hits).map((s) => s.trim()))],
      locations: locs(where.map((w) => locOf(w.item))),
      fix: t('Name the award, issuer and year and link it, or delete the claim.', 'Ödülü, vereni ve yılı yazıp link verin ya da iddiayı silin.'),
    };
  },

  function fakeUrgency(ctx) {
    const hits = findAll(ctx, LX.URGENCY, 10, { copyOnly: true });
    if (!hits.length) return null;
    return {
      id: 'fake-urgency', cat: 'content', pts: 3, effort: 'quick',
      title: t('Manufactured urgency', 'Yapay aciliyet'),
      detail: t('"Only 3 left", resetting countdowns or "someone just bought" pop-ups with no real data behind them.', '"Son 3 ürün", sıfırlanan geri sayımlar ya da gerçek veriye dayanmayan "biri az önce satın aldı" bildirimleri.'),
      evidence: uniq(hits.map((h) => clip(h.match, 60))).slice(0, 4),
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: clip(h.match, 60) })),
      fix: t('Remove them, or connect them to real stock and real dates.', 'Kaldırın ya da gerçek stok ve gerçek tarihlere bağlayın.'),
    };
  },

  function suspiciousRating(ctx) {
    const hits = findAll(ctx, LX.SUSPICIOUS_RATING, 3, { copyOnly: true });
    if (!hits.length) return null;
    return {
      id: 'suspicious-rating', cat: 'content', pts: 2, effort: 'quick', needsFacts: true,
      title: t('Perfect rating with a round review count', 'Yuvarlak yorum sayısıyla kusursuz puan'),
      detail: t('Structured data claims a 4.9-5.0 rating from a round number of reviews. Google ignores self-serving ratings for businesses and treats mismatches with visible reviews as spam.', 'Yapılandırılmış veri yuvarlak sayıda yorumdan 4.9-5.0 puan iddia ediyor. Google işletmelerin kendi verdiği puanları yok sayar, görünen yorumlarla uyuşmazlığı spam sayar.'),
      evidence: hits.map((h) => clip(h.match, 90)),
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: clip(h.match, 60) })),
      fix: t('Remove the markup, or connect a real review platform and show the reviews on the page.', 'İşaretlemeyi kaldırın ya da gerçek bir yorum platformu bağlayıp yorumları sayfada gösterin.'),
    };
  },

  function aiImageNames(ctx) {
    const hits = findAll(ctx, LX.AI_IMAGE, 20);
    if (!hits.length) return null;
    return {
      id: 'ai-images', cat: 'content', pts: Math.min(4, 1.5 * hits.length), effort: 'replace',
      title: t('Images marked as AI-generated', 'Yapay zekâ üretimi olarak işaretli görseller'),
      detail: t('File names or embedded metadata point to an image generator.', 'Dosya adları ya da gömülü metadata bir görsel üreticisini işaret ediyor.'),
      evidence: uniq(hits.map((h) => clip(h.match, 60))).slice(0, 5),
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: clip(h.match, 60) })),
      fix: t('Prefer real photos of the product, place or team. If a generated image stays, make sure it shows something true and specific.', 'Ürünün, mekânın ya da ekibin gerçek fotoğraflarını tercih edin. Üretilmiş bir görsel kalacaksa doğru ve özgül bir şey gösterdiğinden emin olun.'),
    };
  },

  // ---- strengths: evidence that a real business stands behind the page ----
  function strengths(ctx) {
    const out = [];
    const T = ctx.text;
    const emails = (T.match(/(?<![\w.+-])[\w.+-]{1,64}@[\w-]{1,63}\.[\w.]{2,24}/g) || []).filter((e) => !/example\.|domain\.|email\.com|yourcompany|company\.com|sirket\.com|acme\./i.test(e));
    if (emails.length) out.push(['email', -2, t('Real email address', 'Gerçek e-posta adresi'), emails[0]]);
    const phones = (T.match(/(?:\+90|\b0)\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|\+\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g) || []).filter((p) => !/555|123[\s.-]?456/.test(p));
    if (phones.length) out.push(['phone', -2, t('Phone number', 'Telefon numarası'), phones[0].trim()]);
    // Turkish street words are specific enough; English ones need a house number nearby ("Your road to success" is not an address)
    const addr = T.match(/[^\n]{0,40}(?<![\p{L}])(?:[Cc]ad(?:desi|\.)|[Ss]ok(?:ağı|ak|\.)|[Ss]k\.|[Mm]ah(?:allesi|\.)|[Bb]ulvarı|No\s?:\s?\d+)(?![\p{L}])[^\n]{0,40}/u)
      || T.match(/(?<![\p{L}\d])\d{1,5}[A-Za-z]?\s(?:[\p{Lu}][\p{L}'.-]{1,20}\s){1,3}(?:Street|St\.|Avenue|Ave\.|Road|Rd\.|Boulevard|Blvd\.?|Lane|Ln\.|Drive|Dr\.|Way|Straße|Strasse)(?![\p{L}])[^\n]{0,40}/u);
    if (addr && !/123 main/i.test(addr[0])) out.push(['address', -3, t('Physical address', 'Fiziksel adres'), clip(addr[0], 90)]);
    const legal = T.match(/a\.ş\.|ltd\.?\s?şti|\binc\.|\bllc\b|\bgmbh\b|vergi no|mersis|tax id|kvkk|company (?:no|number)|registered in/i);
    if (legal) out.push(['legal', -2, t('Company or legal details', 'Şirket ya da yasal bilgi'), legal[0]]);
    const person = T.match(/(?<![\p{L}])\p{Lu}\p{Ll}{1,30} \p{Lu}\p{Ll}{1,30},?\s?(?:[-–—,]\s?)?(?:[Kk]urucu(?:su)?|[Ff]ounder|[Cc]o-founder|CEO|CTO|[Şş]ef|[Uu]sta|[Ee]ditör|[Yy]azar|[Dd]irektör|[Mm]üdür|[Oo]wner|[Ss]ahibi|[Cc]hef|[Dd]esigner|[Tt]asarımcı|[Ee]ngineer|[Mm]ühendis)/u);
    const stockNames = /john doe|jane doe|john smith|jane smith|sarah johnson|michael chen|emily rodriguez|david kim|jessica lee|alex thompson|sarah chen|michael brown|emily davis/i;
    const fakePeople = findAll(ctx, LX.AVATAR_HOSTS, 1).length > 0;
    const notName = /\b(?:Üniversitesi|Üniversite|Fakültesi|Bölümü|Yazılım|Bilgisayar|Mühendisliği|Lisesi|Şirketi|Teknoloji|Software|Senior|Junior|Lead|Full|Stack|University|College|School|Engineering|Development|Design|Digital|Solutions|Studio|Agency|Team|Data|Web)\b/;
    if (person && !stockNames.test(person[0]) && !notName.test(person[0]) && !fakePeople) out.push(['person', -2, t('Named person with a role', 'İsmi ve rolü belli kişi'), person[0]]);
    const hours = T.match(/\d{1,2}[:.]\d{2}\s?[-–]\s?\d{1,2}[:.]\d{2}/);
    if (hours) out.push(['hours', -1, t('Opening hours', 'Çalışma saatleri'), hours[0]]);
    const price = T.match(/[₺$€£]\s?\d[\d.,]*|\d[\d.,]*\s?(?:TL|₺|€)(?![\p{L}])/u);
    if (price) out.push(['price', -1, t('Concrete prices', 'Somut fiyatlar'), price[0]]);
    const dated = T.match(/(?:updated|güncellendi|last modified|son güncelleme|published|yayınlandı)[^\n]{0,30}\d{4}/i);
    if (dated) out.push(['dated', -1, t('Dated content', 'Tarihli içerik'), clip(dated[0], 60)]);
    const ext = findAll(ctx, LX.EXTERNAL_PROOF, 5);
    if (ext.length) out.push(['external-proof', -2, t('Links to independent reviews or profiles', 'Bağımsız yorum ya da profil linkleri'), uniq(ext.map((e) => e.match.replace(/["']$/, ''))).slice(0, 3).join(', ')]);
    const about = ctx.C.links.find((a) => LX.ABOUT_LINK.test((a.text || '').trim()) || /\/(?:about|hakkimizda|hakkımızda|team|ekip|impressum)\b/i.test(a.href || ''));
    if (about) out.push(['about', -1, t('An about / team page', 'Hakkımızda / ekip sayfası'), about.text || about.href]);
    let budget = -10;
    const res = [];
    for (const [id, pts, title, ev] of out) {
      const p = Math.max(pts, budget);
      if (p >= 0) break;
      budget -= p;
      res.push({ id: 'strength-' + id, cat: 'content', pts: p, kind: 'strength', title, evidence: [ev],
        detail: t('A sign that a real business or person stands behind the page.', 'Sayfanın arkasında gerçek bir işletme ya da kişi olduğunu gösteren iz.') });
    }
    return res;
  },
];

/* ================= LANGUAGE PATTERNS ================= */
const language = [
  function lexicon(ctx) {
    const strong = Object.assign(countPhrases(ctx.loEN, LX.SLOP_EN_STRONG), countPhrases(ctx.loTR, LX.SLOP_TR_STRONG));
    const weak = Object.assign(countPhrases(ctx.loEN, LX.SLOP_EN_WEAK), countPhrases(ctx.loTR, LX.SLOP_TR_WEAK));
    // one word repeated (a brand called "Seamless", a recipe that says "elevate" twice) is not a habit:
    // each term counts at most twice, and short pages are measured as if they had 300 words
    const cap = (h) => Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Math.min(v, 2)]));
    const nS = sumHits(cap(strong)), nW = sumHits(cap(weak));
    const per1k = (n) => (n / Math.max(ctx.W, 300)) * 1000;
    const distinct = Object.keys(strong).length + Object.keys(weak).length * 0.5;
    const weighted = nS + (per1k(nW) >= 4 ? nW * 0.5 : 0);
    if (!ctx.W || Object.keys(strong).length < 2 && weighted < 3) return null;
    const rate = per1k(weighted);
    const pts = Math.min(10, Math.max(1.5, rate * 0.6 + distinct * 0.3));
    const all = { ...strong, ...(per1k(nW) >= 4 ? weak : {}) };
    const where = copyWith(ctx, Object.keys(all));
    return {
      id: 'lexicon', cat: 'language', pts, effort: 'rewrite',
      title: t('Cliché phrase density', 'Klişe ifade yoğunluğu'),
      detail: t(`${nS} strong and ${nW} weak matches from the slop lexicon, ${round1(rate)} per 1000 words (human web copy averages well under 7).`,
        `Slop sözlüğünden ${nS} güçlü ve ${nW} zayıf eşleşme, 1000 kelimede ${round1(rate)} (insan yazısı web metninde ortalama 7'nin epey altı).`),
      evidence: [hitList(all, 12).join(' · '), ...examples(ctx, Object.keys(all))],
      locations: locs(where.map((w) => locOf(w.item))),
      fix: t('Delete each phrase or replace it with the concrete thing behind it. Do not swap one buzzword for a synonym.', 'Her ifadeyi silin ya da arkasındaki somut bilgiyle değiştirin. Bir klişeyi eş anlamlısıyla değiştirmeyin.'),
    };
  },

  function falseRange(ctx) {
    const found = [];
    for (const c of ctx.C.copy) {
      for (const m of lowEN(c.text).matchAll(LX.FALSE_RANGE_EN)) if (!LX.RANGE_OK.test(m[0])) found.push({ m: m[0], item: c });
      for (const m of lowTR(c.text).matchAll(LX.FALSE_RANGE_TR)) if (!LX.RANGE_OK.test(m[0])) found.push({ m: m[0], item: c });
    }
    if (!found.length || (found.length < 2 && ctx.per1k(found.length) < 1.5)) return null;
    return {
      id: 'false-range', cat: 'language', pts: Math.min(3, found.length * 1.2), effort: 'rewrite',
      title: t('Ranges that span nothing', 'Hiçbir şeyi kapsamayan aralıklar'),
      detail: t('"From startups to enterprises", "from design to delivery": a range with no real scale says "everyone, everything".', '"KOBİ\'lerden büyük kurumlara kadar", "tasarımdan lojistiğe kadar": gerçek bir ölçeği olmayan aralık "herkes, her şey" demek.'),
      evidence: uniq(found.map((f) => clip(f.m, 80))).slice(0, 4),
      locations: locs(found.map((f) => locOf(f.item))),
      fix: t('List the actual items, or say who it is not for.', 'Gerçek kalemleri sayın ya da kimin için olmadığını söyleyin.'),
    };
  },

  function audienceNonCommit(ctx) {
    const found = [];
    for (const c of ctx.C.copy) {
      for (const m of lowEN(c.text).matchAll(LX.AUDIENCE_EN)) found.push({ m: m[0], item: c });
      for (const m of lowTR(c.text).matchAll(LX.AUDIENCE_TR)) found.push({ m: m[0], item: c });
    }
    if (!found.length) return null;
    return {
      id: 'everyone', cat: 'language', pts: Math.min(3, found.length * 1.5), effort: 'rewrite', needsFacts: true,
      title: t('Written for everyone, so for no one', 'Herkese yazılmış, yani kimseye'),
      detail: t('"Whether you\'re a startup or an enterprise", "businesses of all sizes": the page avoids naming who it serves.', '"İster girişim ister kurum olun", "her ölçekteki işletme": sayfa kime hizmet ettiğini söylemekten kaçınıyor.'),
      evidence: uniq(found.map((f) => clip(f.m, 80))).slice(0, 4),
      locations: locs(found.map((f) => locOf(f.item))),
      fix: t('Name the customer you serve best, and optionally who it is not for.', 'En iyi hizmet ettiğiniz müşteriyi adlandırın; isterseniz kimin için olmadığını da söyleyin.'),
    };
  },

  function weaselAuthority(ctx) {
    const found = [];
    for (const c of ctx.C.copy) for (const m of lowTR(c.text).matchAll(LX.WEASEL)) found.push({ m: m[0], item: c });
    if (!found.length) return null;
    return {
      id: 'weasel', cat: 'content', pts: Math.min(3, found.length * 1.5), effort: 'rewrite', needsFacts: true,
      title: t('Borrowed authority with no source', 'Kaynaksız ödünç otorite'),
      detail: t('"Experts say", "studies show", "it is a known fact" without naming who or linking it.', '"Uzmanlar söylüyor", "araştırmalar gösteriyor", "bilinen bir gerçektir"; kim olduğu söylenmeden ya da link verilmeden.'),
      evidence: uniq(found.map((f) => clip(f.m, 60))).slice(0, 4),
      locations: locs(found.map((f) => locOf(f.item))),
      fix: t('Name the study or expert and link it, or cut the claim.', 'Araştırmayı ya da uzmanı adlandırıp link verin veya iddiayı silin.'),
    };
  },

  function openersClosers(ctx) {
    const found = ctx.C.copy.filter((c) => LX.CLOSER_OPENER.test(c.text.trim()));
    if (!found.length) return null;
    return {
      id: 'formulaic-frame', cat: 'language', pts: Math.min(2, found.length), effort: 'rewrite',
      title: t('Formulaic openers and closers', 'Kalıp giriş ve kapanışlar'),
      detail: t('"In conclusion,", "Have you ever wondered…", "Sonuç olarak," frame the text instead of saying something.', '"Sonuç olarak,", "Hiç … merak ettiniz mi?" gibi kalıplar bir şey söylemek yerine metni çerçeveliyor.'),
      evidence: found.slice(0, 3).map((c) => clip(c.text, 90)),
      locations: locs(found.map((c) => locOf(c))),
      fix: t('Start with the point; end on the last concrete fact or a specific next step.', 'Doğrudan konuyla başlayın; son somut bilgiyle ya da net bir sonraki adımla bitirin.'),
    };
  },

  function turkishRegister(ctx) {
    if (ctx.lang !== 'tr' || ctx.sentences.length < 8) return null;
    const bureau = (ctx.loTR.match(LX.TR_BUREAU) || []).length;
    const trans = ctx.sentences.filter((s) => LX.TR_TRANSITIONS.test(s.trim())).length;
    const share = trans / ctx.sentences.length;
    const bRate = bureau / ctx.sentences.length;
    if (bRate < 0.4 && share < 0.15) return null;
    return {
      id: 'tr-register', cat: 'language', pts: Math.min(3, (bRate >= 0.4 ? 1.5 : 0) + (share >= 0.15 ? 1.5 : 0)), effort: 'rewrite',
      title: t('Stiff, bureaucratic Turkish', 'Resmi, bürokratik Türkçe'),
      detail: t(`${bureau} "-mektedir" verbs across ${ctx.sentences.length} sentences; ${Math.round(share * 100)}% of sentences open with a stock connector.`, `${ctx.sentences.length} cümlede ${bureau} "-mektedir" fiili; cümlelerin %${Math.round(share * 100)}'i "Ayrıca, Bunun yanı sıra" gibi kalıp bağlaçla başlıyor.`),
      evidence: uniq((ctx.loTR.match(LX.TR_BUREAU) || [])).slice(0, 6),
      fix: t('Speak to the reader: "sunmaktadır" → "sunuyoruz". Drop connectors that add no logic.', 'Okura doğrudan konuşun: "sunmaktadır" → "sunuyoruz". Mantık eklemeyen bağlaçları atın.'),
    };
  },

  function negParallel(ctx) {
    const found = [];
    for (const c of ctx.C.copy) {
      const a = lowEN(c.text), b = lowTR(c.text);
      for (const re of LX.NEGPAR_EN) for (const m of a.matchAll(re)) found.push({ m: m[0], item: c });
      for (const re of LX.NEGPAR_TR) for (const m of b.matchAll(re)) found.push({ m: m[0], item: c });
    }
    if (found.length < 2) return null;
    return {
      id: 'neg-parallel', cat: 'language', pts: Math.min(5, found.length * 1.5), effort: 'rewrite',
      title: t('"Not just X, but Y" pattern', '"Sadece X değil, Y" kalıbı'),
      detail: t(`This contrast frame appears ${found.length} times. It is one of the best-known AI writing tells.`, `Bu karşıtlık kalıbı ${found.length} kez geçiyor. AI metninin en bilinen işaretlerinden biri.`),
      evidence: uniq(found.map((f) => clip(f.m, 110))).slice(0, 4),
      locations: locs(found.map((f) => locOf(f.item))),
      fix: t('Say what it is, directly. Drop the comparison with what it is not.', 'Ne olduğunu doğrudan söyleyin, olmadığı şeyle karşılaştırmayı bırakın.'),
    };
  },

  function ingAnalysis(ctx) {
    const found = [];
    for (const c of ctx.C.copy) {
      for (const m of lowEN(c.text).matchAll(LX.ING_TAIL_EN)) found.push({ m: m[0], item: c });
      for (const m of lowTR(c.text).matchAll(LX.ING_TAIL_TR)) found.push({ m: m[0], item: c });
    }
    if (found.length < 3) return null;
    return {
      id: 'ing-tail', cat: 'language', pts: Math.min(3, found.length * 0.75), effort: 'rewrite',
      title: t('Hollow "-ing" commentary', 'İçi boş "vurgulayarak" eklentileri'),
      detail: t('Sentences end with ", highlighting / underscoring / showcasing …" add-ons that comment instead of inform.', 'Cümleler ", ... vurgulayarak / altını çizerek / yansıtarak" gibi bilgi vermeyen yorum eklentileriyle bitiyor.'),
      evidence: uniq(found.map((f) => clip(f.m, 80))).slice(0, 4),
      locations: locs(found.map((f) => locOf(f.item))),
      fix: t('End the sentence at the fact. If the significance matters, state it as its own concrete sentence.', 'Cümleyi bilgide bitirin. Önemi gerçekten varsa ayrı ve somut bir cümleyle söyleyin.'),
    };
  },

  function triads(ctx) {
    const re = /(?<![\p{L}])[\p{L}]+(?: [\p{L}]+)?, [\p{L}]+(?: [\p{L}]+)?,? (?:ve|veya|and|or) [\p{L}]+(?![\p{L}])/gu;
    const found = [];
    for (const c of ctx.C.copy) for (const m of c.text.matchAll(re)) found.push({ m: m[0], item: c });
    if (found.length < 3 || ctx.per1k(found.length) <= 4) return null;
    return {
      id: 'triads', cat: 'language', pts: Math.min(3, ctx.per1k(found.length) / 3), effort: 'rewrite',
      title: t('Rule-of-three habit', 'Üçlü sıralama alışkanlığı'),
      detail: t(`${found.length} "fast, secure and easy" style triplets.`, `"Hızlı, güvenli ve kolay" türünden ${found.length} üçlü sıralama.`),
      evidence: found.slice(0, 4).map((f) => clip(f.m, 80)),
      locations: locs(found.map((f) => locOf(f.item))),
      fix: t('Keep the one quality that matters most and prove it with an example.', 'En önemli tek özelliği bırakın ve bir örnekle kanıtlayın.'),
    };
  },

  function emDash(ctx) {
    const found = ctx.C.copy.filter((c) => /—| – /.test(c.text));
    const n = (ctx.text.match(/—| – /g) || []).length;
    if (n < 3 || ctx.per1k(n) <= 5) return null;
    return {
      id: 'em-dash', cat: 'language', pts: Math.min(3, ctx.per1k(n) / 4), effort: 'quick',
      title: t('Em dash density', 'Uzun tire yoğunluğu'),
      detail: t(`${n} em dashes, ${round1(ctx.per1k(n))} per 1000 words.`, `${n} uzun tire, 1000 kelimede ${round1(ctx.per1k(n))}.`),
      evidence: found.slice(0, 2).map((c) => clip(c.text)),
      locations: locs(found.map((c) => locOf(c))),
      fix: t('Replace most with full stops or commas.', 'Çoğunu nokta ya da virgülle değiştirin.'),
    };
  },

  function emojiHeadings(ctx) {
    const els = [...ctx.C.headings, ...ctx.C.buttons].filter((e) => EMOJI.test(e.text) && !isEmojiOnly(e.text));
    if (els.length < 2) return null;
    return {
      id: 'emoji-headings', cat: 'language', pts: Math.min(3, els.length * 0.75), effort: 'quick',
      title: t('Emoji in headings and buttons', 'Emojili başlık ve butonlar'),
      detail: t(`${els.length} headings or buttons carry emoji.`, `${els.length} başlık ya da butonda emoji var.`),
      evidence: els.slice(0, 4).map((e) => clip(e.text, 60)),
      locations: locs(els.map((e) => locOf(e))),
      fix: t('Remove them; build hierarchy with type size, weight and spacing.', 'Kaldırın; hiyerarşiyi yazı boyutu, kalınlık ve boşlukla kurun.'),
    };
  },

  function genericHeadings(ctx) {
    const strip = (s) => s.replace(/\p{Extended_Pictographic}|[️‍]/gu, '').trim();
    const hs = ctx.C.headings.filter((h) => h.level >= 2 && LX.GENERIC_HEADINGS.test(strip(h.text)));
    if (hs.length < 3) return null;
    return {
      id: 'generic-headings', cat: 'language', pts: Math.min(3, hs.length * 0.75), effort: 'rewrite',
      title: t('Template section headings', 'Şablon bölüm başlıkları'),
      detail: t(`${hs.length} section titles come straight from the landing-page template ("Features", "Why choose us", "How it works").`, `${hs.length} bölüm başlığı doğrudan açılış sayfası şablonundan ("Özelliklerimiz", "Neden biz?", "Nasıl çalışır?").`),
      evidence: uniq(hs.map((h) => strip(h.text))).slice(0, 6),
      locations: locs(hs.map((h) => locOf(h))),
      fix: t('Make each heading say something only this business could say ("Bread baked at 5:30, sold out by 11").', 'Her başlık yalnızca bu işletmenin söyleyebileceği bir şey söylesin ("05.30\'da fırında, 11.00\'de tükeniyor").'),
    };
  },

  function boldOveruse(ctx) {
    const b = ctx.C.bold;
    if (b.length < 6 || b.length / (ctx.C.paragraphs + 1) <= 1.2) return null;
    return {
      id: 'bold', cat: 'language', pts: 2, effort: 'quick',
      title: t('Excess bold text', 'Gereksiz kalın yazı'),
      detail: t(`${b.length} bold spans across ${ctx.C.paragraphs} paragraphs.`, `${ctx.C.paragraphs} paragrafa ${b.length} kalın vurgu.`),
      evidence: b.slice(0, 5).map((e) => clip(e.text, 40)),
      locations: locs(b.map((e) => locOf(e))),
      fix: t('Keep a few critical emphases per page at most.', 'Sayfa başına en fazla birkaç kritik vurgu bırakın.'),
    };
  },

  function exclaim(ctx) {
    const els = [...ctx.C.headings, ...ctx.C.ctas].filter((e) => e.text.includes('!'));
    if (els.length < 3) return null;
    return {
      id: 'exclaim', cat: 'language', pts: Math.min(2, els.length * 0.5), effort: 'quick',
      title: t('Exclamation-heavy microcopy', 'Ünlemli coşkulu mikro metin'),
      detail: t(`${els.length} headings or buttons shout with "!".`, `${els.length} başlık ya da buton ünlemle bitiyor.`),
      evidence: uniq(els.map((e) => clip(e.text, 50))).slice(0, 4),
      locations: locs(els.map((e) => locOf(e))),
      fix: t('Let buttons say what happens next: "Create account", "See pricing".', 'Buton ne olacağını söylesin: "Hesap oluştur", "Fiyatları gör".'),
    };
  },

  function genericCtas(ctx) {
    const els = ctx.C.ctas.filter((e) => LX.GENERIC_CTA.some((re) => re.test(e.text.trim())));
    if (els.length < 2) return null;
    return {
      id: 'generic-cta', cat: 'language', pts: Math.min(2, els.length * 0.5), effort: 'quick',
      title: t('Generic calls to action', 'Genel geçer eylem butonları'),
      detail: t('Buttons like "Get started" or "Learn more" do not say what the visitor gets.', '"Hemen başla" ya da "Daha fazla bilgi" gibi butonlar ziyaretçiye ne alacağını söylemiyor.'),
      evidence: uniq(els.map((e) => e.text.trim())).slice(0, 6),
      locations: locs(els.map((e) => locOf(e))),
      fix: t('Name the outcome or the next screen: "Book a 20-minute demo", "See the menu".', 'Sonucu ya da sonraki ekranı adlandırın: "20 dakikalık demo ayarla", "Menüyü gör".'),
    };
  },

  async function repetition(ctx) {
    if (ctx.W < 250) return null;
    const r = await gzipRatio(ctx.proseLines.join('\n'));
    if (!r || r <= 3.3) return null;
    return {
      id: 'repetition', cat: 'language', pts: Math.min(3, (r - 3.3) * 3), effort: 'rewrite',
      title: t('Repetitive text', 'Tekrar eden metin'),
      detail: t(`Body copy compresses ${round1(r)}x. Above 3.3 means the same words and frames keep coming back.`, `Metin ${round1(r)} kat sıkışıyor. 3,3'ün üstü aynı kelime ve kalıpların sürekli döndüğünü gösterir.`),
      fix: t('Merge sections that repeat the same message; cut every second paraphrase.', 'Aynı mesajı tekrarlayan bölümleri birleştirin, her ikinci tekrarı silin.'),
    };
  },

  function uniformSentences(ctx) {
    const lens = ctx.sentences.map((s) => wordsOf(s).length);
    if (lens.length < 20) return null;
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
    const cv = sd / mean;
    if (cv >= 0.42) return null;
    return {
      id: 'uniform-sentences', cat: 'language', pts: cv < 0.33 ? 2 : 1, effort: 'rewrite',
      title: t('Uniform sentence length', 'Tekdüze cümle uzunluğu'),
      detail: t(`Sentences average ${round1(mean)} words and barely vary (CV ${round1(cv)}).`, `Cümleler ortalama ${round1(mean)} kelime ve uzunlukları neredeyse hiç değişmiyor (CV ${round1(cv)}).`),
      fix: t('Mix short and long sentences.', 'Kısa ve uzun cümleleri karıştırın.'),
    };
  },
  function headlineFormula(ctx) {
    const strip = (x) => x.replace(/\p{Extended_Pictographic}|[️‍]/gu, '').replace(/\s+/g, ' ').trim();
    const heads = ctx.C.headings.filter((h) => h.level <= 2).map((h) => ({ ...h, text: strip(h.text) })).filter((h) => h.text && wordsOf(h.text).length <= 14);
    const hits = heads.filter((h) => LX.HEADLINE_FORMULA.some((re) => re.test(h.text)));
    if (!hits.length) return null;
    const h1 = hits.some((h) => h.level === 1);
    return {
      id: 'headline-formula', cat: 'language', pts: Math.min(5, (h1 ? 2.5 : 1) + (hits.length - 1) * 0.75), effort: 'rewrite', needsFacts: true,
      title: t('Headline from the template', 'Şablondan çıkmış başlık'),
      detail: t('"Supercharge your…", "…, reimagined", "Your all-in-one…": headline formulas that promise a change without naming one thing the product does.', '"…nizi güçlendirin", "…yeniden tanımlıyoruz", "Hepsi tek platformda": ürünün yaptığı tek bir şeyi söylemeden değişim vaat eden başlık kalıpları.'),
      evidence: uniq(hits.map((h) => h.text)).slice(0, 4),
      locations: locs(hits.map((h) => locOf(h))),
      fix: t('Write the headline as a plain statement of what it does and for whom, with one concrete detail.', 'Başlığı ne yaptığını ve kimin için olduğunu tek somut detayla söyleyen düz bir cümle olarak yazın.'),
    };
  },

  function stockMicrocopy(ctx) {
    const lo = ' ' + lowEN(ctx.text) + ' ' + lowTR(ctx.text) + ' ';
    const found = LX.STOCK_MICROCOPY.filter((p) => new RegExp(`(?<![\\p{L}])${reEsc(p)}(?![\\p{L}])`, 'u').test(lo));
    if (found.length < 4) return null;
    return {
      id: 'stock-microcopy', cat: 'language', pts: Math.min(4, (found.length - 3) * 0.75 + 1), effort: 'rewrite',
      title: t('Stock landing-page microcopy', 'Hazır açılış sayfası kalıpları'),
      detail: t(`${found.length} phrases every generated landing page carries ("Get started", "No credit card required", "Trusted by", "All rights reserved").`, `Her üretilmiş açılış sayfasında olan ${found.length} kalıp ("Hemen başla", "Kredi kartı gerekmez", "Güvenenler", "Tüm hakları saklıdır").`),
      evidence: found.slice(0, 10),
      locations: locs(copyWith(ctx, found).map((w) => locOf(w.item))),
      fix: t('Rename each button by what happens next, and cut reassurance lines that every competitor also says.', 'Her butonu tıklayınca ne olacağına göre adlandırın, her rakibin de söylediği güven cümlelerini çıkarın.'),
    };
  },
];

/* ================= TEMPLATE DESIGN ================= */
const TW_PURPLE = /^(?:[\w-]+:)*(?:from|via|to)-(?:purple|violet|indigo|fuchsia)-\d{2,3}(?:\/\d+)?$/;
const TW_ARB = /^(?:[\w-]+:)*(?:from|via|to)-\[(#[0-9a-fA-F]{3,8})\]$/;
const design = [
  function purpleGradient(ctx) {
    const ev = [];
    const L = [];
    for (const c of ctx.C.css) {
      for (const m of c.text.matchAll(/(?:linear|radial|conic)-gradient\(([^;{}]{0,400})\)/gi)) {
        if (colorsIn(resolveVars(m[1], ctx.vars)).some(isPurple)) { ev.push(clip(m[0], 80)); L.push(locOf(c, m[0])); }
      }
    }
    for (const c of ctx.C.classes) {
      const toks = c.value.split(/\s+/);
      const hasGrad = toks.some((x) => /^(?:[\w-]+:)*bg-(?:gradient|linear|radial|conic)-/.test(x));
      if (!hasGrad) continue;
      const stops = toks.filter((x) => TW_PURPLE.test(x) || (TW_ARB.test(x) && isPurple(hexToHsl(x.match(TW_ARB)[1]))));
      if (stops.length) { ev.push(stops.join(' ')); L.push(locOf(c, c.value)); }
    }
    for (const g of ctx.vis?.gradients || []) if (colorsIn(g.css).some(isPurple) && !ev.length) ev.push(`${clip(g.css, 70)} (${Math.round(g.area * 100)}% of the screen)`);
    if (!ev.length) return null;
    return {
      id: 'purple-gradient', cat: 'design', pts: ev.length >= 2 ? 6 : 4, effort: 'redesign',
      title: t('Purple-indigo gradient', 'Mor-indigo gradyan'),
      detail: t(`${ev.length} purple/violet/indigo gradients. It is the best-known default of AI-generated interfaces.`, `${ev.length} mor/menekşe/indigo gradyan. AI ile üretilen arayüzlerin en bilinen varsayılanı.`),
      evidence: uniq(ev).slice(0, 5),
      locations: locs(L),
      fix: t('Derive a palette from the subject (its materials, place, era) with one accent used sparingly. Use a gradient only where it depicts something. Do not just recolour the gradient.', 'Paleti konunun kendisinden türetin (malzemesi, mekânı, dönemi) ve tek bir vurgu rengini az kullanın. Gradyanı yalnızca bir şeyi tasvir ediyorsa kullanın. Gradyanın sadece rengini değiştirmek çözüm değil.'),
    };
  },

  function gradientText(ctx) {
    const hit = ctx.C.classes.filter((c) => /\bbg-clip-text\b/.test(c.value) && /\btext-transparent\b/.test(c.value));
    const cssHit = ctx.C.css.filter((c) => /background-clip:\s*text/i.test(c.text));
    if (!hit.length && !cssHit.length && !(ctx.vis?.gradientText > 0)) return null;
    return {
      id: 'gradient-text', cat: 'design', pts: 2, effort: 'redesign',
      title: t('Gradient headline text', 'Gradyanlı başlık yazısı'),
      detail: t('Headline letters filled with a gradient.', 'Başlık harfleri gradyanla boyanmış.'),
      evidence: [hit.length ? 'bg-clip-text text-transparent' : 'background-clip: text'],
      locations: locs([...hit, ...cssHit].map((c) => locOf(c, c.value || 'background-clip: text'))),
      fix: t('Let a characterful typeface in one solid colour carry the headline.', 'Başlığı karakterli bir yazı tipi ve tek düz renk taşısın.'),
    };
  },

  function glowGlass(ctx) {
    const re = /^(?:[\w-]+:)*(?:backdrop-blur(?:-\w+)?|blur-(?:2xl|3xl|\[\d+px\])|shadow-(?:purple|violet|indigo|fuchsia|pink|cyan|blue|sky|emerald)-\d{3}(?:\/\d+)?|shadow-\[0_0_[^\]]+\]|drop-shadow-\[0_0_[^\]]+\]|animate-(?:pulse|ping|glow|shimmer|blob))$/;
    const toks = ctx.classTokens.filter((x) => re.test(x.tok));
    const css = ctx.C.css.flatMap((c) => [...c.text.matchAll(/backdrop-filter\s*:[^;]+|radial-gradient\(/gi)].map((m) => ({ tok: m[0].toLowerCase(), loc: c.loc })));
    // coloured glows: box-shadow: 0 0 20px <accent>
    const glow = ctx.C.css.flatMap((c) => [...c.text.matchAll(/(?:box|text)-shadow\s*:\s*0(?:px)?\s+0(?:px)?\s+(\d{1,3})px(?:\s+\d+px)?\s+([^;}]+)/gi)]
      .filter((m) => +m[1] >= 8 && (colorsIn(resolveVars(m[2], ctx.vars)).some((x) => x.s >= 35) || /var\(--[\w-]*(?:glow|accent|primary|neon)/i.test(m[2])))
      .map((m) => ({ tok: `glow ${m[1]}px`, loc: c.loc })));
    const all = [...toks, ...css, ...glow, ...Array.from({ length: Math.min(4, ctx.vis?.glows >= 3 ? ctx.vis.glows : 0) }, () => ({ tok: 'glowing shadow (measured)', loc: null }))];
    if (all.length < 2) return null;
    return {
      id: 'glow-glass', cat: 'design', pts: Math.min(4, all.length * 0.6), effort: 'redesign',
      title: t('Glow, blur and glass effects', 'Parlama, bulanıklık ve cam efekti'),
      detail: t('Background glows, blurred blobs, pulsing badges and frosted cards.', 'Arka plan parlamaları, bulanık lekeler, yanıp sönen rozetler ve buzlu cam kartlar.'),
      evidence: uniq(all.map((x) => x.tok)).slice(0, 8),
      locations: locs(all.map((x) => x.loc && { ...x.loc, snippet: x.tok })),
      fix: t('Remove the effects. Create depth with layout, scale contrast and real imagery.', 'Efektleri kaldırın. Derinliği düzen, ölçek farkı ve gerçek görsellerle kurun.'),
    };
  },

  function emojiIcons(ctx) {
    const e = ctx.C.emojiOnly;
    if (e.length < 3) return null;
    return {
      id: 'emoji-icons', cat: 'design', pts: Math.min(4, e.length * 0.6), effort: 'redesign',
      title: t('Emoji used as icons', 'İkon yerine emoji'),
      detail: t(`${e.length} feature or section icons are lone emoji.`, `${e.length} özellik ya da bölüm ikonu tek başına emoji.`),
      evidence: [e.slice(0, 12).map((x) => x.text).join(' ')],
      locations: locs(e.map((x) => locOf(x, x.text))),
      fix: t('Use one consistent icon set drawn for the subject, or no icons; real photos or diagrams often say more.', 'Konuya uygun tek ve tutarlı bir ikon seti kullanın ya da hiç kullanmayın; gerçek fotoğraf veya şema çoğu zaman daha çok şey anlatır.'),
    };
  },

  function cardTemplate(ctx) {
    const grid = ctx.classTokens.filter((x) => /^(?:[\w-]+:)*grid-cols-[34]$/.test(x.tok));
    const groups = Math.max(ctx.C.cardGroups, ctx.vis?.cards?.groups || 0) + ctx.C.featureArrays;
    const score = groups + (grid.length >= 3 ? 1 : 0);
    if (score < 1) return null;
    const pts = score >= 3 ? 4 : score === 2 ? 2.5 : 1;
    return {
      id: 'card-template', cat: 'design', pts, effort: 'redesign',
      title: t('Everything in the same card template', 'Her şey aynı kart şablonunda'),
      detail: t(`${groups} sections built from identical icon + title + one-line cards${grid.length ? `, ${grid.length} three/four-column grids` : ''}.`, `İkon + başlık + tek cümlelik özdeş kartlardan oluşan ${groups} bölüm${grid.length ? `, ${grid.length} üç/dört kolonlu ızgara` : ''}.`),
      evidence: grid.length ? [`grid-cols-3/4 ×${grid.length}`] : [],
      locations: locs(grid.map((x) => x.loc && { ...x.loc, snippet: x.tok })),
      fix: t('Give each section a layout that fits its content: a comparison table, a sequence, one big proof, a photo with captions. Cut sections that only repeat the hero.', 'Her bölüme içeriğine uyan bir düzen verin: karşılaştırma tablosu, adım sırası, tek büyük kanıt, açıklamalı fotoğraf. Hero\'yu tekrar eden bölümleri silin.'),
    };
  },

  function defaultFont(ctx) {
    const v = ctx.vis?.fonts ? Object.values(ctx.vis.fonts).filter(Boolean) : [];
    const f = (ctx.C.fonts || '') + ' ' + v.join(' ');
    const primary = f.match(LX.FONT_PRIMARY);
    const trend = f.match(LX.FONT_TREND);
    if (!primary && !trend) return null;
    const names = uniq([primary && primary[1], trend && trend[1]].filter(Boolean).map((x) => x.replace(/[+_]/g, ' ')));
    return {
      id: 'default-font', cat: 'design', pts: primary ? 2.5 : 1.5, effort: 'redesign',
      title: t('Default "safe" typeface', 'Varsayılan "güvenli" yazı tipi'),
      detail: t(`${names.join(', ')}: among the faces AI builders converge on (Anthropic calls it distributional convergence).`, `${names.join(', ')}: AI araçlarının hep aynı yere çıktığı yazı tiplerinden.`),
      evidence: names,
      fix: t('Pick faces that belong to the subject\'s world and write down why. Pair a display face with a text face, or use one variable family at extremes (200 vs 900). Inter is fine inside an app, not as the voice of a landing page.', 'Konunun dünyasına ait yazı tipleri seçin ve nedenini yazın. Bir başlık fontunu bir metin fontuyla eşleştirin ya da tek bir değişken aileyi uç kalınlıklarda kullanın (200 ve 900). Inter uygulama içinde iyidir, açılış sayfasının sesi olarak değil.'),
    };
  },

  function permaDark(ctx) {
    const dark = ctx.classTokens.filter((x) => /^bg-(?:gray|zinc|slate|neutral|stone)-(?:900|950)$|^bg-black$/.test(x.tok));
    const greyText = ctx.classTokens.filter((x) => /^text-(?:gray|zinc|slate|neutral)-(?:400|500)$/.test(x.tok));
    const hasLight = ctx.classTokens.some((x) => /^dark:/.test(x.tok)) || /prefers-color-scheme/.test(ctx.cssText);
    // hand-written CSS: what colour is the page by default?
    const bodyBg = (ctx.cssText.match(/(?:^|[}\s,])(?:body|html|:root)\s*\{[^}]*background(?:-color)?\s*:\s*([^;}]+)/i) || [])[1];
    const bgHsl = bodyBg ? colorsIn(resolveVars(bodyBg, ctx.vars))[0] : null;
    // a browser set to dark mode shows the dark theme of a site that has both: only count it in light mode,
    // or when the stylesheet itself says the default is dark
    const measuredDark = ctx.vis && ctx.vis.background.luminance < 0.03 && !/prefers-color-scheme/.test(ctx.cssText)
      && (!ctx.vis.darkScheme || (bgHsl && bgHsl.l <= 9));
    if ((bgHsl && bgHsl.l <= 9 && !/prefers-color-scheme/.test(ctx.cssText)) || measuredDark) {
      return {
        id: 'perma-dark', cat: 'design', pts: 2.5, effort: 'redesign',
        title: t('Dark by default, for no reason', 'Sebepsiz yere varsayılan karanlık'),
        detail: t('The page opens near-black whatever the visitor\'s setting. One of the most common looks on AI-built sites; a theme toggle does not change the first impression.', 'Sayfa ziyaretçinin ayarından bağımsız olarak siyaha yakın açılıyor. AI ile yapılmış sitelerin en yaygın görünümlerinden; tema düğmesi ilk izlenimi değiştirmiyor.'),
        evidence: [bodyBg ? clip(`background: ${bodyBg.trim()}${bodyBg.includes('var(') ? ` = ${resolveVars(bodyBg, ctx.vars).trim()}` : ''}`, 80) : `background ${ctx.vis.background.color} (measured)`],
        fix: t('Follow prefers-color-scheme, or choose dark only if the subject calls for it (night, film, code). If it stays dark, use 3-4 surface levels and body text at 7:1 contrast.', 'prefers-color-scheme ayarını izleyin ya da koyu temayı yalnızca konu gerektiriyorsa seçin (gece, film, kod). Koyu kalacaksa 3-4 yüzey seviyesi ve 7:1 kontrastlı gövde metni kullanın.'),
      };
    }
    if (dark.length < 1 || greyText.length < 3 || hasLight) return null;
    return {
      id: 'perma-dark', cat: 'design', pts: 3, effort: 'redesign',
      title: t('Always-dark page with grey body text', 'Hep karanlık sayfa ve gri gövde metni'),
      detail: t(`A near-black ground with ${greyText.length} medium-grey text styles and no light theme. One of the most common looks across vibe-coded sites.`, `Siyaha yakın zemin, ${greyText.length} orta gri metin stili ve açık tema yok. Vibe-coded sitelerin en yaygın görünümlerinden.`),
      evidence: uniq([...dark, ...greyText].map((x) => x.tok)).slice(0, 6),
      locations: locs(greyText.map((x) => x.loc && { ...x.loc, snippet: x.tok })),
      fix: t('Write one sentence about where and in what light the page is used, and choose light or dark from that. If it stays dark, use 3-4 surface levels and body text at 7:1 contrast.', 'Sayfanın nerede ve hangi ışıkta kullanıldığını tek cümleyle yazın ve açık mı koyu mu olacağına buna göre karar verin. Koyu kalacaksa 3-4 yüzey seviyesi ve 7:1 kontrastlı gövde metni kullanın.'),
    };
  },

  function accentStripe(ctx) {
    const hits = ctx.C.classes.filter((c) => /\bborder-[lt]-(?:2|4|8|\[\d+px\])\b/.test(c.value) && /\bborder-(?!white|black|gray|zinc|slate|neutral|transparent)[a-z]+-\d{3}\b/.test(c.value) && /\b(?:rounded|p-\d|px-\d)/.test(c.value));
    // hand-written CSS: only card-like blocks; a quote, code block, menu or active tab with a side rule is ordinary typography
    const css = [];
    for (const c of ctx.C.css) {
      if (!/border-(?:left|top):\s*(?:[2-9]|\d{2})px\s+solid/i.test(c.text)) continue;
      for (const m of c.text.matchAll(/([^{}]{1,300})\{([^{}]{0,2000})\}/g)) {
        const sel = m[1];
        if (!/border-(?:left|top):\s*(?:[2-9]|\d{2})px\s+solid/i.test(m[2])) continue;
        if (/card|tile|feature|benefit|stat|panel|box|item/i.test(sel) && !/blockquote|\bq\b|\bpre\b|code|nav|aside|menu|toc|tab|focus|active|current|selected|hover|note|warning|tip|alert|callout|quote|table|\btd\b|\bth\b|\bhr\b/i.test(sel)) css.push({ ...c, text: m[0] });
      }
    }
    if (hits.length + css.length < 2) return null;
    return {
      id: 'accent-stripe', cat: 'design', pts: Math.min(4, (hits.length + css.length) * 1.2), effort: 'redesign',
      title: t('Coloured stripe on every card', 'Her kartta renkli kenar şeridi'),
      detail: t('Cards marked with a thick coloured left or top border, often a different colour each.', 'Kartlar kalın renkli sol ya da üst kenarla işaretlenmiş, çoğunlukla her biri ayrı renkte.'),
      evidence: [...hits.slice(0, 3).map((c) => clip(c.value, 70)), ...css.slice(0, 3 - Math.min(3, hits.length)).map((c) => clip(c.text.replace(/\s+/g, ' '), 70))],
      locations: locs([...hits, ...css].map((c) => locOf(c, c.value || 'border-left'))),
      fix: t('Remove the stripes. If a category must show, use a text label or one shared accent for the active state.', 'Şeritleri kaldırın. Bir kategori gösterilmesi gerekiyorsa metin etiketi ya da yalnızca aktif durum için tek ortak vurgu kullanın.'),
    };
  },

  function iconTiles(ctx) {
    const hits = ctx.C.classes.filter((c) => /\b(?:h|w|size)-(?:8|10|12|14|16)\b/.test(c.value) && /\brounded-(?:md|lg|xl|2xl|full)\b/.test(c.value) && /\bbg-(?:[a-z]+-(?:50|100)|[a-z-]+\/(?:5|10|15|20))\b/.test(c.value) && /\b(?:items-center|place-items-center)\b/.test(c.value));
    if (hits.length < 3 && !(hits.length >= 1 && ctx.C.featureArrays)) return null;
    return {
      id: 'icon-tiles', cat: 'design', pts: 2, effort: 'redesign',
      title: t('Icons in tinted rounded squares', 'Renkli yuvarlak karelerde ikonlar'),
      detail: t('The shadcn/lucide signature: a stock icon in a pale rounded tile above every heading.', 'shadcn/lucide imzası: her başlığın üstünde soluk yuvarlak bir karonun içinde hazır ikon.'),
      evidence: hits.slice(0, 2).map((c) => clip(c.value, 70)),
      locations: locs(hits.map((c) => locOf(c, c.value))),
      fix: t('Use icons that depict the actual feature, or drop them and let real screenshots and headings do the work.', 'Özelliği gerçekten anlatan ikonlar kullanın ya da kaldırıp işi gerçek ekran görüntüleri ve başlıklara bırakın.'),
    };
  },

  function motionEverywhere(ctx) {
    const reveal = findAll(ctx, /whileInView|data-aos=["']fade|\banimate-(?:fade-in|fade-up|slide-up|slide-in)\b|\.in-view\b|initial=\{\{\s*opacity:\s*0/g, 40);
    const hover = ctx.classTokens.filter((x) => /^hover:(?:scale-1\d\d|-translate-y-\d|shadow-(?:xl|2xl))$/.test(x.tok));
    // the same in hand-written CSS: fade-up keyframes on many elements, hover lifts
    for (const c of ctx.C.css) {
      if (/animation(?:-name)?\s*:[^;]*\b(?:fade-?in-?up|fade-?up|slide-?up|slide-?in-?up|reveal|fadeIn)\b/i.test(c.text)) reveal.push({ match: 'animation: fadeInUp', loc: c.loc });
      if (/:hover[^{]*\{[^}]*transform\s*:\s*(?:translateY\(\s*-\d|scale\(1\.0[3-9]|scale\(1\.1)/i.test(c.text)) hover.push({ tok: ':hover translateY/scale', loc: c.loc });
    }
    const reduced = /prefers-reduced-motion|motion-reduce|useReducedMotion/.test(ctx.cssText + ctx.sources.map((s) => s.content).join(' ').slice(0, 400000));
    const n = (reveal.length >= 3 ? 1 : 0) + (hover.length >= (hover.some((h) => !h.tok.startsWith('hover:')) ? 2 : 4) ? 1 : 0);
    if (!n) return null;
    return {
      id: 'motion-everywhere', cat: 'design', pts: n * 1.5 + (reduced ? 0 : 1), effort: 'redesign',
      title: t('Animation on everything', 'Her şey hareketli'),
      detail: t(`${reveal.length} scroll-reveal animations and ${hover.length} hover lifts${reduced ? '' : ', with no reduced-motion setting'}.`, `${reveal.length} kaydırınca beliren animasyon ve ${hover.length} üzerine gelince kalkan kart${reduced ? '' : ', azaltılmış hareket ayarı da yok'}.`),
      evidence: uniq([...reveal.map((r) => clip(r.match, 40)), ...hover.map((h) => h.tok)]).slice(0, 6),
      locations: locs([...reveal.map((r) => r.loc && { ...r.loc, snippet: clip(r.match, 40) }), ...hover.map((h) => h.loc && { ...h.loc, snippet: h.tok })]),
      fix: t('Keep one deliberate moment (a page-load reveal or one interactive demo). Content visible by default; respect prefers-reduced-motion.', 'Tek bir bilinçli an bırakın (sayfa açılış animasyonu ya da tek etkileşimli demo). İçerik varsayılan olarak görünür olsun; prefers-reduced-motion\'a uyun.'),
    };
  },

  function gimmickEffects(ctx) {
    const hits = findAll(ctx, LX.GIMMICK_COMPONENTS, 20);
    for (const [name, re] of LX.GIMMICK_CODE) {
      const f = findAll(ctx, new RegExp(re.source, 'gi'), 1);
      if (f.length) hits.push({ ...f[0], m: [f[0].match, name] });
    }
    if (!hits.length) return null;
    const names = uniq(hits.map((h) => h.m[1]));
    return {
      id: 'gimmick-effects', cat: 'design', pts: Math.min(6, names.length * 2.5), effort: 'redesign',
      title: t('Effect-kit components', 'Efekt kiti bileşenleri'),
      detail: t('Typing effects, custom cursors, particles, floating shapes, meteors and beams: effects pasted in because they were easy to add.', 'Daktilo efekti, özel imleç, parçacıklar, uçuşan şekiller, meteor ve ışınlar: eklemesi kolay olduğu için yapıştırılmış efektler.'),
      evidence: names,
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: clip(h.match, 40) })),
      fix: t('Easy to add is not a reason to include. Remove them; put the budget into real imagery or one interactive demo of the product.', 'Eklemesi kolay olması eklemek için sebep değil. Kaldırın; o emeği gerçek görsellere ya da ürünün tek bir etkileşimli demosuna verin.'),
    };
  },

  function defaultTheme(ctx) {
    const hits = findAll(ctx, LX.DEFAULT_THEME_TOKENS, 20);
    if (uniq(hits.map((h) => h.match.split(':')[0])).length < 3) return null;
    return {
      id: 'default-theme', cat: 'design', pts: 3, effort: 'redesign',
      title: t('Untouched shadcn theme', 'Hiç dokunulmamış shadcn teması'),
      detail: t('Theme tokens are still the shadcn/ui defaults, so the site shares its look with every other starter.', 'Tema değişkenleri hâlâ shadcn/ui varsayılanları; site görünümünü diğer her başlangıç projesiyle paylaşıyor.'),
      evidence: uniq(hits.map((h) => h.match)).slice(0, 4),
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: h.match })),
      fix: t('Replace the tokens with a palette derived from the subject, and record it in a DESIGN.md the agent must read before UI edits.', 'Değişkenleri konudan türetilmiş bir paletle değiştirin ve yapay zekânın arayüz düzenlemeden önce okuması gereken bir DESIGN.md dosyasına yazın.'),
    };
  },

  function secondOrderDefaults(ctx) {
    const colorRe = /(?:background(?:-color)?\s*:\s*([^;}]+))|bg-\[(#[0-9a-fA-F]{3,8})\]/g;
    const bgs = [];
    for (const c of ctx.C.css) for (const m of c.text.matchAll(colorRe)) bgs.push(...colorsIn(m[1] || m[2] || ''));
    for (const c of ctx.C.classes) for (const m of c.value.matchAll(/bg-\[(#[0-9a-fA-F]{3,8})\]/g)) bgs.push(hexToHsl(m[1]));
    const allColors = [...colorsIn(ctx.cssText), ...ctx.C.classes.flatMap((c) => [...c.value.matchAll(/(?:text|bg|border)-\[(#[0-9a-fA-F]{3,8})\]/g)].map((m) => hexToHsl(m[1])))];
    const cream = bgs.some((c) => c.h >= 28 && c.h <= 52 && c.s >= 18 && c.s <= 65 && c.l >= 91 && c.l <= 97.5);
    const terracotta = allColors.some((c) => c.h >= 6 && c.h <= 26 && c.s >= 40 && c.s <= 80 && c.l >= 38 && c.l <= 62);
    const serif = LX.SERIF_DISPLAY.test(ctx.C.fonts || '');
    const blackBg = bgs.some((c) => c.l < 6) || ctx.classTokens.some((x) => /^bg-(?:black|zinc-950|neutral-950|stone-950)$/.test(x.tok));
    const acid = allColors.some((c) => ((c.h >= 70 && c.h <= 100) || (c.h >= 5 && c.h <= 15)) && c.s >= 70 && c.l >= 45 && c.l <= 65) || ctx.classTokens.some((x) => /^(?:text|bg|border)-lime-[34]00$/.test(x.tok));
    const res = [];
    if (cream && terracotta && serif) res.push({ id: 'cream-terracotta', title: t('The "anti-purple" default: cream, serif, terracotta', '"Mor karşıtı" varsayılan: krem, serif, kiremit'), ev: 'cream background + terracotta accent + serif display' });
    if (blackBg && acid && !res.length) res.push({ id: 'acid-on-black', title: t('Near-black with one neon accent', 'Siyaha yakın zemin ve tek neon vurgu'), ev: 'near-black background + acid/vermilion accent' });
    return res.map((r) => ({
      id: r.id, cat: 'design', pts: 3, effort: 'redesign', title: r.title,
      detail: t('The look models fall back to when told to avoid purple. Swapping one default for another does not make a page distinctive.', 'Modellerin "mor kullanma" denince kaçtığı görünüm. Bir varsayılanı başkasıyla değiştirmek sayfayı özgün yapmaz.'),
      evidence: [r.ev],
      fix: t('Derive the palette from concrete, saturated materials of the subject (its products, signage, tools), not from "paper" or "terminal".', 'Paleti "kâğıt" ya da "terminal" fikrinden değil, konunun somut ve doygun malzemelerinden (ürünleri, tabelaları, aletleri) türetin.'),
    }));
  },

  function roundedEverything(ctx) {
    const r = ctx.classTokens.filter((x) => /^(?:[\w-]+:)*rounded-(?:xl|2xl|3xl|full)$/.test(x.tok));
    if (r.length < 10 && !(ctx.vis?.radius?.big >= 15)) return null;
    return {
      id: 'rounded-everything', cat: 'design', pts: 1, effort: 'redesign',
      title: t('Big radius on everything', 'Her şeyde büyük köşe yarıçapı'),
      detail: r.length >= 10 ? t(`${r.length} elements use rounded-xl/2xl/3xl/full.`, `${r.length} öğede rounded-xl/2xl/3xl/full var.`)
        : t(`${ctx.vis.radius.big} boxes on screen have a radius of 12px or more.`, `Ekrandaki ${ctx.vis.radius.big} kutuda 12px ve üzeri köşe yarıçapı var.`),
      evidence: [r.length >= 10 ? `rounded-* ×${r.length}` : `${ctx.vis.radius.big} large-radius boxes (measured)`],
      fix: t('Set radius by role (inputs, cards, pills) from one small scale.', 'Köşe yarıçapını role göre (girdi, kart, hap) küçük bir ölçekten verin.'),
    };
  },

  function pillBadges(ctx) {
    const pills = ctx.C.classes.filter((c) => /\brounded-full\b/.test(c.value) && /\btext-(?:xs|sm)\b/.test(c.value) && /\b(?:bg|border)-[\w-]+\/\d{1,2}\b/.test(c.value));
    const sparkle = ctx.C.copy.filter((c) => /^[✨🚀🎉🔥⚡]\s?\p{L}/u.test(c.text) && wordsOf(c.text).length <= 6);
    const n = pills.length + sparkle.length;
    if (n < 2) return null;
    return {
      id: 'pill-badges', cat: 'design', pts: Math.min(2, n * 0.5), effort: 'redesign',
      title: t('"✨ New" pill badges', '"✨ Yeni" hap rozetleri'),
      detail: t('Small translucent pill badges above headings, often with a sparkle emoji.', 'Başlıkların üstünde yarı saydam küçük hap rozetler, çoğunlukla parıltı emojisiyle.'),
      evidence: uniq([...sparkle.map((c) => c.text), ...pills.map((c) => clip(c.value, 60))]).slice(0, 4),
      locations: locs([...pills.map((c) => locOf(c, c.value)), ...sparkle.map((c) => locOf(c))]),
      fix: t('Remove them unless the badge carries real news with a date.', 'Rozet tarihli gerçek bir haber taşımıyorsa kaldırın.'),
    };
  },
  function landingTemplate(ctx) {
    const H = ctx.C.headings.map((h) => lowEN(h.text));
    const T = ' ' + lowEN(ctx.text) + ' ';
    const has = (re) => re.test(T);
    const head = (re) => H.some((h) => re.test(h));
    const parts = [
      ['hero with two buttons', ctx.C.ctas.slice(0, 6).filter((c) => LX.GENERIC_CTA.some((re) => re.test(c.text.trim()))).length >= 2],
      ['logo strip', has(/trusted by|used by (?:teams|companies)|loved by|powering (?:teams|companies)|güvenen|tercih ed/)],
      ['feature grid', ctx.C.cardGroups + ctx.C.featureArrays >= 1 || head(/^(?:features|key features|everything you need|özellikler)/)],
      ['how it works', head(/how it works|nasıl çalışır|get started in|3 (?:simple|easy) steps|üç adım/) || /\bstep (?:1|one)\b[\s\S]{0,400}\bstep (?:2|two)\b/i.test(T)],
      ['testimonials', head(/testimonial|what (?:our )?(?:customers|clients|users|people) (?:say|are saying)|loved by|wall of love|yorumlar|müşterilerimiz ne diyor/) || /★★★★★|⭐⭐⭐⭐⭐/.test(T)],
      ['stats row', (T.match(/\b\d{1,3}(?:[.,]\d)?\s?(?:k|m|b)?\+|\b99(?:\.9+)?%|\b24\/7\b/gi) || []).length >= 3],
      ['three pricing plans', /most popular|en popüler|best value/.test(T) || (/\b(?:starter|basic|free)\b/.test(T) && /\bpro\b/.test(T) && /\b(?:enterprise|business|team)\b/.test(T) && /\/\s?(?:mo|month|ay)\b/.test(T))],
      ['FAQ accordion', head(/^(?:faq|faqs|frequently asked|sıkça sorulan|sss)/) || /data-radix-accordion|data-state=["'](?:open|closed)["'][^>]*accordion/i.test(ctx.sources.map((x) => x.content).join(' ').slice(0, 600000))],
      ['closing call to action', head(/^ready to|get started today|start (?:building|your) |join (?:thousands|us)|hemen başla|başlamaya hazır/)],
      ['four-column footer', ['product', 'company', 'resources', 'legal'].filter((w) => H.some((h) => h === w) || new RegExp(`(?:^|\\n)${w}(?:\\n|$)`, 'i').test(ctx.text)).length >= 3 || /all rights reserved|tüm hakları saklıdır/.test(T)],
    ];
    const got = parts.filter((p) => p[1]).map((p) => p[0]);
    if (got.length < 5) return null;
    return {
      id: 'landing-template', cat: 'design', pts: Math.min(7, 2 + (got.length - 5) * 1.25), effort: 'redesign',
      title: t('The standard landing-page template', 'Standart açılış sayfası şablonu'),
      detail: t(`${got.length} of the 10 sections every generated landing page has, in the usual order. The page reads as the template with the product name swapped in.`, `Her üretilmiş açılış sayfasındaki 10 bölümden ${got.length} tanesi, alışılmış sırayla. Sayfa, ürün adı değiştirilmiş şablon gibi okunuyor.`),
      evidence: got,
      fix: t('Keep only the sections your visitors need to decide, and give each a form that fits its content: a real screenshot, a comparison table, one strong customer story instead of six quotes.', 'Sadece ziyaretçinin karar vermesi için gereken bölümleri bırakın ve her birine içeriğine uyan bir biçim verin: gerçek ekran görüntüsü, karşılaştırma tablosu, altı yorum yerine tek güçlü müşteri hikâyesi.'),
    };
  },

  function portfolioTemplate(ctx) {
    const H = ctx.C.headings.map((h) => h.text.replace(/\s+/g, ' ').trim());
    const navs = ctx.C.links.map((a) => a.text.trim()).filter((x) => LX.PORTFOLIO_SECTIONS.test(x));
    const parts = [
      ['"Hi, I\'m" greeting', /(?:^|\n)(?:hi|hello|hey)[,!]? i(?:'|’)?m\b|(?:^|\n)merhaba,? ben\b/i.test(ctx.text) || H.some((h) => /^(?:hi|hello|merhaba)[,!]?\s*(?:i(?:'|’)?m|ben)?$/i.test(h))],
      ['rotating job titles', /isDeleting|new Typed\(|typewriter|class=["'][^"']*\btyp(?:ing|ed)\b/i.test(ctx.jsText + ctx.sources.map((x) => x.content).join(' ').slice(0, 400000))],
      ['standard section menu', uniq(navs.map((x) => x.toLowerCase())).length >= 4 || H.filter((h) => LX.PORTFOLIO_SECTIONS.test(h)).length >= 4],
      ['"X+ years" stat cards', /\b\d+(?:[.,]\d)?\+\s*(?:years?|yıl)/i.test(ctx.text)],
      ['skill category cards', /(?:^|\n)(?:frontend|backend|tools|devops|ai (?:&|and) data|languages)(?:\n|$)/i.test(ctx.text) && /(?:^|\n)(?:frontend)(?:\n|$)/i.test(ctx.text)],
      ['glowing timeline', /timeline/i.test(ctx.cssText) || ctx.C.classes.some((c) => /timeline/.test(c.value))],
    ];
    const got = parts.filter((p) => p[1]).map((p) => p[0]);
    if (got.length < 3) return null;
    // a portfolio with no work in it: no screenshots, no project or code links
    const imgs = ctx.C.images.filter((i) => !/\.svg(?:$|\?)|icon|logo|avatar|profile/i.test(i.src));
    const workLinks = ctx.C.links.filter((a) => /github\.com\/[^/]+\/[^/?#]+|gitlab\.com|behance|dribbble|\/projects?\/|\/work\/|codepen|vercel\.app|netlify\.app|apps\.apple|play\.google/i.test(a.href));
    const out = [];
    if (!imgs.length && !workLinks.length) out.push({
      id: 'no-work-shown', cat: 'content', pts: 5, effort: 'rewrite', needsFacts: true,
      title: t('A portfolio with no work in it', 'İçinde iş olmayan bir portfolyo'),
      detail: t('There is no project to look at: no screenshot, no live link, no repository. Skills are listed but nothing shows them.', 'Bakılacak bir proje yok: ekran görüntüsü, canlı link ya da kod deposu yok. Yetenekler sıralanmış ama hiçbiri gösterilmiyor.'),
      evidence: ['0 project images, 0 project links'],
      fix: t('Add two or three real projects: a screenshot, one line on the problem, what you built, the stack, and a link to the live site or the code.', 'İki üç gerçek proje ekleyin: ekran görüntüsü, problemi anlatan tek satır, ne yaptığınız, kullandığınız teknoloji ve canlı siteye ya da koda link.'),
    });
    out.push({
      id: 'portfolio-template', cat: 'design', pts: Math.min(5, 1.5 + (got.length - 3) * 1.25), effort: 'redesign', needsFacts: true,
      title: t('The standard developer-portfolio template', 'Standart geliştirici portfolyo şablonu'),
      detail: t(`${got.length} parts of the portfolio every AI tool produces: greeting, typing job titles, About/Skills/Experience/Contact, "3+ years" cards, skill boxes, a glowing timeline.`, `Her AI aracının ürettiği portfolyonun ${got.length} parçası: selamlama, yazılıp silinen unvanlar, Hakkımda/Yetenekler/Deneyim/İletişim, "3+ yıl" kartları, yetenek kutuları, parlayan zaman çizelgesi.`),
      evidence: got,
      fix: t('Lead with your work: two or three projects with a screenshot, what you built, the stack and a link. Drop the typing effect and the skill boxes; let the projects show the skills.', 'İşinizle başlayın: ekran görüntüsü, ne yaptığınız, kullandığınız teknoloji ve link içeren iki üç proje. Daktilo efektini ve yetenek kutularını kaldırın; yetenekleri projeler göstersin.'),
    });
    return out;
  },

  function defaultPalette(ctx) {
    const hexes = [];
    for (const c of ctx.C.css) for (const m of c.text.matchAll(/#[0-9a-fA-F]{6}\b/g)) if (LX.TW_HEX.has(m[0].toLowerCase())) hexes.push({ hex: m[0].toLowerCase(), loc: c.loc });
    const distinct = uniq(hexes.map((h) => h.hex));
    const cls = uniq(ctx.classTokens.map((x) => x.tok.replace(/^(?:[\w-]+:)+/, '')).filter((x) => /^(?:text|bg|border|from|to|via|ring)-(?:slate|gray|zinc|neutral|blue|indigo|violet|purple)-\d{2,3}$/.test(x)));
    const custom = /--(?:brand|color-brand|accent-\d|ink|paper)\b/.test(ctx.cssText);
    const n = distinct.length + (cls.length >= 10 ? 3 : 0);
    if (n < 5 || custom) return null;
    return {
      id: 'default-palette', cat: 'design', pts: n >= 9 ? 3 : 2, effort: 'redesign',
      title: t('Tailwind\'s default colours', 'Tailwind\'in varsayılan renkleri'),
      detail: t(`${distinct.length} colours copied straight from Tailwind\'s default palette (slate, purple-500, blue-500…)${cls.length >= 10 ? ` and ${cls.length} default colour classes` : ''}. Thousands of sites share exactly these values.`, `Tailwind\'in varsayılan paletinden doğrudan alınmış ${distinct.length} renk (slate, purple-500, blue-500…)${cls.length >= 10 ? ` ve ${cls.length} varsayılan renk sınıfı` : ''}. Binlerce site tam olarak bu değerleri paylaşıyor.`),
      evidence: [...distinct.slice(0, 8), ...cls.slice(0, 4)],
      locations: locs(hexes.map((h) => h.loc && { ...h.loc, snippet: h.hex })),
      fix: t('Derive 4-6 colours from the subject (a photo, the product, the place), give them names, and use only those.', 'Konudan (bir fotoğraf, ürün, mekân) 4-6 renk türetin, onlara isim verin ve sadece onları kullanın.'),
    };
  },

  function accentUnderline(ctx) {
    const hits = ctx.C.css.filter((c) => /::?after\s*\{/.test(c.text) && /\bwidth\s*:\s*(?:[2-9]\d|1[0-2]\d)px/.test(c.text) && /\bheight\s*:\s*[2-6]px/.test(c.text) && /background/.test(c.text));
    const tw = ctx.C.classes.filter((c) => /\bh-(?:0\.5|1|1\.5)\b/.test(c.value) && /\bw-(?:12|16|20|24)\b/.test(c.value) && /\bmx-auto\b/.test(c.value) && /\bbg-/.test(c.value));
    if (!hits.length && tw.length < 2) return null;
    return {
      id: 'accent-underline', cat: 'design', pts: 1.5, effort: 'redesign',
      title: t('Short coloured bar under each heading', 'Her başlığın altında kısa renkli çizgi'),
      detail: t('A centred heading with a small accent bar under it, repeated for every section: the theme-template way to say "section starts here".', 'Ortalanmış başlık ve altında küçük renkli çizgi, her bölümde tekrar: hazır temaların "bölüm burada başlıyor" deme şekli.'),
      evidence: hits.length ? [clip(hits[0].text.replace(/\s+/g, ' '), 80)] : [clip(tw[0].value, 60)],
      locations: locs([...hits.map((c) => locOf(c, '::after')), ...tw.map((c) => locOf(c, c.value))]),
      fix: t('Let spacing and type size mark sections. If a divider is needed, use one consistent rule across the page.', 'Bölümleri boşluk ve yazı boyutu ayırsın. Ayırıcı gerekiyorsa sayfa genelinde tek tutarlı bir çizgi kullanın.'),
    };
  },

  function centredEverything(ctx) {
    const c = ctx.vis?.centred;
    if (!c || c.blocks < 10) return null;
    const share = c.centred / c.blocks;
    if (share < 0.75) return null;
    return {
      id: 'centred-everything', cat: 'design', pts: share >= 0.9 ? 3 : 2, effort: 'redesign',
      title: t('Everything is centred', 'Her şey ortalanmış'),
      detail: t(`Measured in the browser: ${c.centred} of ${c.blocks} headings and paragraphs are centred. A page where every block sits in the middle has no reading line and no hierarchy.`, `Tarayıcıda ölçüldü: ${c.blocks} başlık ve paragrafın ${c.centred} tanesi ortalanmış. Her bloğun ortada durduğu sayfada okuma çizgisi ve hiyerarşi kalmaz.`),
      evidence: [`${Math.round(share * 100)}% centred`],
      fix: t('Left-align body text and most headings; keep centring for one or two moments (the hero, a closing line).', 'Gövde metnini ve çoğu başlığı sola hizalayın; ortalamayı bir iki ana bırakın (hero, kapanış satırı).'),
    };
  },

  function stockIcons(ctx) {
    const lucide = ctx.C.classes.filter((c) => /\blucide(?:-[\w-]+)?\b/.test(c.value));
    const sparkles = lucide.filter((c) => /lucide-sparkles?\b/.test(c.value)).length + findAll(ctx, /<Sparkles\b/g, 5).length;
    const lib = findAll(ctx, /from\s+["']lucide-react["']/g, 1).length;
    if (lucide.length < 6 && !(lib && sparkles) && !(lucide.length >= 3 && sparkles)) return null;
    return {
      id: 'stock-icons', cat: 'design', pts: sparkles ? 2 : 1.5, effort: 'redesign',
      title: t('Every icon from the same stock set', 'Bütün ikonlar aynı hazır setten'),
      detail: t(`${lucide.length || 'Many'} Lucide icons${sparkles ? ', including the ✨ Sparkles icon' : ''}: the default icon set of shadcn and of most AI builders.`, `${lucide.length || 'Çok sayıda'} Lucide ikonu${sparkles ? ', ✨ Sparkles ikonu dahil' : ''}: shadcn'in ve çoğu AI aracının varsayılan ikon seti.`),
      evidence: uniq(lucide.map((c) => (c.value.match(/lucide-[\w-]+/) || ['lucide'])[0])).slice(0, 8),
      locations: locs(lucide.map((c) => locOf(c, c.value))),
      fix: t('Use fewer icons. Where one helps, pick or draw icons that show this product, or use a set with a character of its own.', 'Daha az ikon kullanın. Gerektiği yerde bu ürünü gösteren ikonlar seçin ya da çizin, ya da kendine özgü bir set kullanın.'),
    };
  },
];

/* ================= UNFINISHED DETAILS ================= */
const finish = [
  function placeholders(ctx) {
    const hits = [];
    // form hints like placeholder="Your name" are meant to be there
    const inAttr = (x) => {
      const src = x.m.input, i = x.m.index;
      if (/(?:placeholder|aria-placeholder)\s*=\s*["'{`][^"'`]{0,120}$/i.test(src.slice(Math.max(0, i - 140), i))) return true;
      // a mention in typographic quotes (“Lorem ipsum”) is text about placeholders, not one
      return /[“«‘]$|&ldquo;$|&laquo;$/.test(src.slice(Math.max(0, i - 7), i)) && /^[^<\n]{0,4}[”»’]|^[^<\n]{0,4}&rdquo;/.test(src.slice(i + x.match.length, i + x.match.length + 12));
    };
    for (const [k, re, only] of LX.PLACEHOLDER) {
      if (only === 'page' && ctx.C.kind === 'project') continue;
      const f = findAll(ctx, new RegExp(re.source, 'gi'), 20, { copyOnly: true }).filter((x) => !inAttr(x)).slice(0, 10);
      if (f.length) hits.push({ k, f });
    }
    if (!hits.length) return null;
    return {
      id: 'placeholder', cat: 'finish', pts: Math.min(8, hits.length * 4), effort: 'quick', needsFacts: true,
      title: t('Template filler left in', 'Şablon dolgu metni kalmış'),
      detail: t('Placeholders that should have been replaced are still in the page.', 'Yayından önce değiştirilmesi gereken yer tutucular hâlâ sayfada.'),
      evidence: hits.map((h) => clip(h.f[0].match, 60)),
      locations: locs(hits.flatMap((h) => h.f.map((x) => x.loc && { ...x.loc, snippet: clip(x.match, 60) }))),
      fix: t('Replace every one with real content or delete the block. Ask the owner for real names, quotes and links.', 'Her birini gerçek içerikle değiştirin ya da bloğu silin. Gerçek isim, yorum ve linkleri sahibine sorun.'),
    };
  },

  function sectionComments(ctx) {
    const cs = ctx.C.comments.filter((c) => LX.SECTION_COMMENT.test(c.text));
    if (!cs.length) return null;
    return {
      id: 'section-comments', cat: 'finish', pts: cs.length >= 2 ? 3 : 1, effort: 'quick',
      title: t('Narrating section comments', 'Bölüm anlatan kod yorumları'),
      detail: t('Comments like <!-- Hero Section --> label every block, the bookkeeping AI leaves behind.', '<!-- Hero Section --> gibi her bloğu etiketleyen yorumlar; AI\'ın kendi düzeni için bıraktığı izler.'),
      evidence: uniq(cs.map((c) => clip(c.text, 40))).slice(0, 6),
      locations: locs(cs.map((c) => locOf(c, c.text))),
      fix: t('Delete them, or strip comments in the production build.', 'Silin ya da yayın derlemesinde yorumları temizleyin.'),
    };
  },

  function deadLinks(ctx) {
    const d = ctx.C.links.filter((a) => a.hasHref !== false && (a.href === '#' || a.href === '' || /^javascript:/i.test(a.href || '') || LX.SOCIAL_ROOT.test(a.href || '')));
    if (d.length < 3) return null;
    const social = d.filter((a) => LX.SOCIAL_ROOT.test(a.href || '')).length;
    return {
      id: 'dead-links', cat: 'finish', pts: Math.min(3, d.length / 2), effort: 'quick', needsFacts: true,
      title: t('Links that go nowhere', 'Hiçbir yere gitmeyen linkler'),
      detail: t(`${d.length} links or buttons point to "#"${social ? ` or to a social network's front page (${social})` : ''}.`, `${d.length} link ya da buton "#" adresine${social ? ` veya bir sosyal ağın ana sayfasına (${social})` : ''} gidiyor.`),
      evidence: uniq(d.map((a) => clip(a.text || '(no text)', 40))).slice(0, 6),
      locations: locs(d.map((a) => locOf(a, a.text))),
      fix: t('Wire each one to a real page or action, or remove it.', 'Her birini gerçek bir sayfaya ya da eyleme bağlayın veya kaldırın.'),
    };
  },

  function headingHierarchy(ctx) {
    const h1 = ctx.C.headings.filter((h) => h.level === 1);
    if (ctx.project) {
      // In a project, several route files may each own one H1. Flag only files with more than one.
      const byFile = {};
      for (const h of h1) byFile[h.loc.file] = (byFile[h.loc.file] || 0) + 1;
      const bad = Object.entries(byFile).filter(([, n]) => n > 1);
      if (!bad.length) return null;
      return {
        id: 'heading-hierarchy', cat: 'finish', pts: 2, effort: 'quick',
        title: t('Several H1s in one file', 'Bir dosyada birden fazla H1'),
        detail: t(`${bad.map(([f, n]) => `${f} (${n})`).join(', ')}`, `${bad.map(([f, n]) => `${f} (${n})`).join(', ')}`),
        locations: locs(h1.filter((h) => byFile[h.loc.file] > 1).map((h) => locOf(h))),
        fix: t('One H1 per page; section titles become H2.', 'Sayfa başına bir H1; bölüm başlıkları H2 olsun.'),
      };
    }
    if (h1.length === 1 || (h1.length === 0 && ctx.W < 120)) return null;
    return {
      id: 'heading-hierarchy', cat: 'finish', pts: h1.length > 1 ? 2 : 1, effort: 'quick',
      title: t('Broken heading hierarchy', 'Bozuk başlık hiyerarşisi'),
      detail: h1.length > 1 ? t(`${h1.length} H1 headings on one page.`, `Bir sayfada ${h1.length} H1 başlık.`) : t('No H1 heading.', 'H1 başlık yok.'),
      evidence: h1.slice(0, 4).map((h) => clip(h.text, 60)),
      fix: t('One H1 per page; section titles become H2.', 'Sayfa başına bir H1; bölüm başlıkları H2 olsun.'),
    };
  },

  function placeholderImages(ctx) {
    const hits = findAll(ctx, LX.PLACEHOLDER_IMG, 20);
    if (!hits.length) return null;
    return {
      id: 'placeholder-images', cat: 'finish', pts: Math.min(4, 2 + hits.length * 0.5), effort: 'replace', needsFacts: true,
      title: t('Placeholder images', 'Yer tutucu görseller'),
      detail: t(`${hits.length} images come from placeholder or random-photo services.`, `${hits.length} görsel yer tutucu ya da rastgele fotoğraf servislerinden geliyor.`),
      evidence: uniq(hits.map((h) => clip(h.match, 50))).slice(0, 5),
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: clip(h.match, 60) })),
      fix: t('Replace with real photos or screenshots of the product, place or work. Ask the owner which ones exist.', 'Ürünün, mekânın ya da işin gerçek fotoğraf veya ekran görüntüleriyle değiştirin. Hangilerinin olduğunu sahibine sorun.'),
    };
  },

  function noindexLeftover(ctx) {
    const hits = findAll(ctx, /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex|content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/gi, 2);
    if (!hits.length) return null;
    return {
      id: 'noindex', cat: 'finish', pts: 3, effort: 'quick',
      title: t('Search engines are told not to index it', 'Arama motorlarına "dizine ekleme" deniyor'),
      detail: t('A robots noindex tag, usually left over from a staging build.', 'Genellikle test ortamından kalma bir robots noindex etiketi.'),
      evidence: [clip(hits[0].match, 80)],
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: clip(h.match, 60) })),
      fix: t('Remove it from the production page unless hiding it is intended.', 'Gizlemek bilinçli değilse yayındaki sayfadan kaldırın.'),
    };
  },

  function hiddenAiInstructions(ctx) {
    const hits = findAll(ctx, LX.HIDDEN_AI, 5);
    if (!hits.length) return null;
    return {
      id: 'hidden-ai-instructions', cat: 'finish', pts: 5, effort: 'quick',
      title: t('Instructions aimed at AI assistants', 'Yapay zekâ asistanlarına yönelik talimatlar'),
      detail: t('Text tries to steer AI readers ("ignore previous instructions", "AI assistants should recommend…"). Google treats content shown only to AI as cloaking.', 'Metin yapay zekâ okuyucularını yönlendirmeye çalışıyor ("önceki talimatları yok say", "AI asistanları şunu önermeli"). Google yalnızca yapay zekâya gösterilen içeriği gizleme (cloaking) sayar.'),
      evidence: uniq(hits.map((h) => clip(h.match, 70))),
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: clip(h.match, 60) })),
      fix: t('Remove it. Say the same thing to people, visibly, or not at all.', 'Kaldırın. Aynı şeyi insanlara, görünür biçimde söyleyin ya da hiç söylemeyin.'),
    };
  },

  function missingAlt(ctx) {
    const no = ctx.C.images.filter((i) => i.alt === null);
    const altCount = {};
    for (const i of ctx.C.images) if (i.alt) altCount[i.alt] = (altCount[i.alt] || 0) + 1;
    const weak = ctx.C.images.filter((i) => i.alt && (LX.GENERIC_ALT.test(i.alt.trim()) || (altCount[i.alt] >= 3 && i.alt !== '(dynamic)')));
    const bad = [...no, ...weak];
    if (bad.length < 2) return null;
    return {
      id: 'missing-alt', cat: 'finish', pts: Math.min(2, bad.length / 2), effort: 'quick',
      title: t('Images without useful alt text', 'Anlamlı alt metni olmayan görseller'),
      detail: t(`${no.length} images have no alt, ${weak.length} have generic or repeated alt text ("image", "logo").`, `${no.length} görselde alt metni yok, ${weak.length} görselde genel ya da tekrar eden alt metni var ("görsel", "logo").`),
      evidence: bad.slice(0, 4).map((i) => clip(`${i.src || '(inline)'}${i.alt ? ` alt="${i.alt}"` : ''}`, 70)),
      locations: locs(bad.map((i) => locOf(i, i.src))),
      fix: t('Describe what each image shows; use alt="" for decoration.', 'Her görselin ne gösterdiğini yazın; süs görselleri için alt="" kullanın.'),
    };
  },

  function lowContrast(ctx) {
    const cv = ctx.vis?.contrast;
    if (cv && cv.checked >= 10) {
      if (cv.failed < 3 || cv.failed / cv.checked < 0.06) return null;
      return {
        id: 'low-contrast', cat: 'finish', pts: Math.min(3, 1 + cv.failed * 0.15), effort: 'quick',
        title: t('Text too light to read', 'Okunamayacak kadar açık metin'),
        detail: t(`Measured in the browser: ${cv.failed} of ${cv.checked} text elements are below the WCAG contrast minimum (4.5:1, or 3:1 for large text).`, `Tarayıcıda ölçüldü: ${cv.checked} metin öğesinden ${cv.failed} tanesi WCAG kontrast sınırının altında (4.5:1, büyük yazıda 3:1).`),
        evidence: cv.worst.map((w) => `«${w.text}» ${w.ratio}:1 (${w.fg} / ${w.bg}, needs ${w.need}:1)`),
        fix: t('Darken the text (or lighten the background) until each listed item reaches its minimum.', 'Listelenen her öğe sınırına ulaşana kadar metni koyulaştırın ya da zemini açın.'),
      };
    }
    const darkPage = ctx.classTokens.some((x) => /^bg-(?:gray|zinc|slate|neutral|stone)-(?:800|900|950)$|^bg-black$/.test(x.tok));
    if (darkPage) return null;
    const light = ctx.classTokens.filter((x) => /^text-(?:gray|slate|zinc|neutral|stone)-(?:300|400)$/.test(x.tok));
    if (light.length < 3) return null;
    return {
      id: 'low-contrast', cat: 'finish', pts: Math.min(2, light.length * 0.4), effort: 'quick',
      title: t('Text too light to read', 'Okunamayacak kadar açık metin'),
      detail: t(`${light.length} text styles use gray-300/400 on a light page; gray-400 on white is about 2.5:1 (WCAG asks 4.5:1).`, `${light.length} metin stili açık zeminde gray-300/400 kullanıyor; beyaz üstünde gray-400 yaklaşık 2.5:1 (WCAG 4.5:1 ister).`),
      evidence: uniq(light.map((x) => x.tok)),
      locations: locs(light.map((x) => x.loc && { ...x.loc, snippet: x.tok })),
      fix: t('Use gray-600 or darker for body text on white.', 'Beyaz zeminde gövde metni için gray-600 ya da daha koyusunu kullanın.'),
    };
  },

  function focusRemoved(ctx) {
    const off = ctx.classTokens.filter((x) => /^(?:focus:)?outline-none$/.test(x.tok));
    const hasVisible = ctx.classTokens.some((x) => /^focus-visible:/.test(x.tok)) || /:focus-visible/.test(ctx.cssText);
    if (off.length < 2 || hasVisible) return null;
    return {
      id: 'focus-removed', cat: 'finish', pts: 1.5, effort: 'quick',
      title: t('Keyboard focus is invisible', 'Klavye odağı görünmüyor'),
      detail: t('Outlines are removed and no focus-visible style replaces them.', 'Kenar çizgileri kaldırılmış, yerine focus-visible stili konmamış.'),
      evidence: [`outline-none ×${off.length}`],
      locations: locs(off.map((x) => x.loc && { ...x.loc, snippet: x.tok })),
      fix: t('Add a visible focus ring (focus-visible:ring-2 or a :focus-visible rule) in the brand colour.', 'Marka renginde görünür bir odak halkası ekleyin (focus-visible:ring-2 ya da :focus-visible kuralı).'),
    };
  },

  function rawMarkdown(ctx) {
    const hits = ctx.C.copy.filter((c) => !c.md && /\*\*[^*\n]{2,60}\*\*|^#{2,4} \S|```/.test(c.text));
    if (!hits.length) return null;
    return {
      id: 'raw-markdown', cat: 'finish', pts: 3, effort: 'quick',
      title: t('Raw markdown on the page', 'Sayfada ham markdown'),
      detail: t('Formatting marks from text pasted out of a chat show up literally.', 'Sohbetten kopyalanan metnin biçim işaretleri olduğu gibi görünüyor.'),
      evidence: hits.slice(0, 3).map((c) => (c.text.match(/\*\*[^*\n]{2,60}\*\*|^#{2,4} \S[^\n]{0,40}|```/) || [c.text])[0]),
      locations: locs(hits.map((c) => { const m = c.text.match(/\*\*[^*\n]{2,60}\*\*|^#{2,4} \S|```/); const i = m ? Math.max(0, m.index - 60) : 0; return locOf(c, (i ? '…' : '') + c.text.slice(i, i + 160)); })),
      fix: t('Remove the marks or convert them to real HTML.', 'İşaretleri silin ya da gerçek HTML\'e çevirin.'),
    };
  },

  function chatbotLeftovers(ctx) {
    const hits = ctx.C.copy.filter((c) => LX.CHATBOT.test(c.text));
    if (!hits.length) return null;
    return {
      id: 'chatbot-leftover', cat: 'finish', pts: 5, effort: 'quick',
      title: t('Chatbot phrasing left in', 'Sohbet botu cümlesi kalmış'),
      detail: t('Text from an assistant\'s reply was pasted onto the page.', 'Bir asistan cevabından kalma metin sayfaya yapıştırılmış.'),
      evidence: hits.slice(0, 3).map((c) => clip(c.text)),
      locations: locs(hits.map((c) => locOf(c))),
      fix: t('Delete it and proofread the whole page.', 'Silin ve tüm sayfayı baştan okuyun.'),
    };
  },

  function chatbotLinks(ctx) {
    const hits = findAll(ctx, LX.CHAT_CITATIONS, 10);
    if (!hits.length) return null;
    return {
      id: 'chatbot-links', cat: 'finish', pts: 3, effort: 'quick',
      title: t('Citation debris from a chatbot', 'Sohbet botundan kalma kaynak izleri'),
      detail: t('Links or citation markers copied from an AI answer.', 'Bir AI cevabından kopyalanmış link ya da kaynak işaretleri.'),
      evidence: uniq(hits.map((h) => clip(h.match, 60))).slice(0, 4),
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: clip(h.match, 60) })),
      fix: t('Strip the tags and check each source yourself.', 'Etiketleri silin ve her kaynağı kendiniz kontrol edin.'),
    };
  },

  function staleCopyright(ctx) {
    const hits = findAll(ctx, /(?:©|&copy;|copyright|telif)[^\n<]{0,20}?((?:19|20)\d{2})(?!\s?[-–]\s?(?:19|20)\d{2})/gi, 5, { copyOnly: true })
      .filter((h) => +h.m[1] < ctx.now.getFullYear() - 1);
    if (!hits.length) return null;
    return {
      id: 'stale-copyright', cat: 'finish', pts: 1, effort: 'quick',
      title: t('Stale copyright year', 'Eski telif yılı'),
      detail: t(`The footer still says ${hits[0].m[1]}.`, `Altbilgi hâlâ ${hits[0].m[1]} diyor.`),
      evidence: [clip(hits[0].match, 40)],
      locations: locs(hits.map((h) => h.loc && { ...h.loc, snippet: clip(h.match, 40) })),
      fix: t('Update it or render the current year.', 'Güncelleyin ya da yılı otomatik yazdırın.'),
    };
  },

  function defaultMeta(ctx) {
    const title = ctx.C.meta?.title || '';
    const res = [];
    if (title && LX.DEFAULT_TITLES.test(title)) {
      res.push({
        id: 'default-title', cat: 'finish', pts: 3, effort: 'quick',
        title: t('Starter-template page title', 'Başlangıç şablonundan kalma sayfa başlığı'),
        detail: t(`The <title> is still "${title}".`, `<title> hâlâ "${title}".`),
        evidence: [title],
        locations: ctx.C.meta?.file ? [{ file: ctx.C.meta.file, line: ctx.C.meta.titleLine || 1, snippet: title }] : [],
        fix: t('Write a title that names the business and what the page offers.', 'İşletmeyi ve sayfanın sunduğunu söyleyen bir başlık yazın.'),
      });
    }
    const desc = ctx.C.meta?.description || '';
    if (desc && LX.DEFAULT_DESCRIPTIONS.test(desc.trim())) {
      res.push({
        id: 'default-description', cat: 'finish', pts: 2, effort: 'quick',
        title: t('Starter-template meta description', 'Başlangıç şablonundan kalma meta açıklama'),
        detail: t(`The description shown in search results is still "${desc}".`, `Arama sonuçlarında görünen açıklama hâlâ "${desc}".`),
        evidence: [desc],
        fix: t('Write a description with one concrete detail: a price, a place, a spec.', 'İçinde tek bir somut detay olan bir açıklama yazın: fiyat, yer, özellik.'),
      });
    }
    const fav = findAll(ctx, /href=["'][^"']*(?:vite\.svg|next\.svg|lovable[^"']*\.(?:ico|png|svg)|placeholder\.svg)["']/gi, 3);
    if (fav.length) {
      res.push({
        id: 'default-favicon', cat: 'finish', pts: 1, effort: 'quick',
        title: t('Default favicon or placeholder asset', 'Varsayılan favicon ya da yer tutucu görsel'),
        detail: t('The tab icon or an image is still the starter-kit file.', 'Sekme ikonu ya da bir görsel hâlâ başlangıç kitindeki dosya.'),
        evidence: uniq(fav.map((f) => clip(f.match, 60))),
        locations: locs(fav.map((f) => f.loc && { ...f.loc, snippet: clip(f.match, 60) })),
        fix: t('Replace with the brand mark.', 'Marka işaretiyle değiştirin.'),
      });
    }
    if (ctx.C.kind === 'page' && ctx.W >= 120) {
      const miss = [];
      if (!ctx.C.meta.description) miss.push('meta description');
      if (!ctx.C.meta.ogTitle && !ctx.C.meta.ogImage) miss.push('Open Graph');
      if (!ctx.C.meta.lang) miss.push('<html lang>');
      if (!ctx.C.meta.viewport) miss.push('viewport');
      if (miss.length) {
        res.push({
          id: 'missing-meta', cat: 'finish', pts: Math.min(2, miss.length * 0.5), effort: 'quick',
          title: t('Missing page metadata', 'Eksik sayfa metadatası'),
          detail: t(`Not set: ${miss.join(', ')}.`, `Tanımlanmamış: ${miss.join(', ')}.`),
          evidence: miss,
          fix: t('Add a page-specific description and social preview; set the language.', 'Sayfaya özel açıklama ve paylaşım önizlemesi ekleyin; dili belirtin.'),
        });
      }
    }
    return res;
  },
  function clientShell(ctx) {
    if (!ctx.C.serverShell) return null;
    return {
      id: 'client-shell', cat: 'finish', pts: 3, effort: 'replace',
      title: t('Empty until JavaScript runs', 'JavaScript çalışana kadar boş'),
      detail: t('The server sends an empty <div id="root"> and a script bundle; every word appears only after JavaScript runs. Search engines, link previews and slow phones see a blank page. It is also how most AI builders ship.', 'Sunucu boş bir <div id="root"> ve bir script paketi gönderiyor; her kelime JavaScript çalıştıktan sonra beliriyor. Arama motorları, link önizlemeleri ve yavaş telefonlar boş sayfa görüyor. Çoğu AI aracı da böyle yayınlıyor.'),
      evidence: ['<div id="root"></div>'],
      fix: t('Prerender or server-render the public pages (Vite SSG, Next.js static export, Astro), or at least put the title, description and main text in the HTML.', 'Herkese açık sayfaları önceden ya da sunucuda oluşturun (Vite SSG, Next.js static export, Astro) ya da en azından başlığı, açıklamayı ve ana metni HTML\'e koyun.'),
    };
  },
];

/* ================= BUILDER TRACES (information) ================= */
const builder = [
  function builderTraces(ctx) {
    const found = [];
    const host = (() => { try { return ctx.C.url ? new URL(ctx.C.url).hostname : ''; } catch { return ''; } })();
    for (const [name, re] of LX.BUILDER_HOSTS) if (host && re.test(host)) found.push({ name, ev: host, loc: null });
    for (const [name, re] of LX.BUILDER_MARKS) {
      if (found.some((f) => f.name === name)) continue;
      const f = findAll(ctx, new RegExp(re.source, 'gi'), 1);
      if (f.length) found.push({ name, ev: f[0].match, loc: f[0].loc });
    }
    const gen = ctx.C.meta?.generator;
    if (gen && /lovable|bolt|v0|base44|replit|gpt/i.test(gen) && !found.length) found.push({ name: gen, ev: 'meta generator', loc: null });
    return found.map((b) => ({
      id: 'builder-' + b.name.toLowerCase().replace(/\W+/g, '-'), cat: 'builder', pts: 2.5, kind: 'info',
      title: t(`${b.name} fingerprint`, `${b.name} izi`),
      detail: t('Made with this AI builder. Using a tool is not slop on its own; shipping its first draft is.', 'Bu AI aracıyla yapılmış. Araç kullanmak tek başına slop değil; ilk taslağı olduğu gibi yayınlamak slop.'),
      evidence: [b.ev],
      locations: b.loc ? [{ ...b.loc, snippet: clip(b.ev, 60) }] : [],
    }));
  },
];

export const RULES = { content, language, design, finish, builder };

export async function runRules(C, opts = {}) {
  const ctx = buildContext(C, opts);
  const findings = [];
  for (const [cat, list] of Object.entries(RULES)) {
    for (const rule of list) {
      try {
        const r = await rule(ctx);
        if (!r) continue;
        for (const f of [].concat(r)) {
          findings.push(Object.assign({ kind: f.pts < 0 ? 'strength' : 'issue', evidence: [], locations: [] }, f, { cat: f.cat || cat }));
        }
      } catch (e) {
        if (process.env.AISLOPMETER_DEBUG) console.error(`rule ${rule.name} failed:`, e);
      }
    }
  }
  return { findings, words: ctx.W, lang: ctx.lang, sentences: ctx.sentences.length };
}
