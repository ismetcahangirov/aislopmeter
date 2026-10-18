// AI search readiness: can ChatGPT, Claude, Perplexity and Gemini read this page, tell who is behind it,
// and quote it? A separate 0-100 score; it does not change the slop score.
// Everything here is read from the HTML, robots.txt, llms.txt and the sitemap. No model is involved.

const t = (en, tr) => ({ en, tr });

/** Crawlers of AI search and assistants, as named in their operators' documentation. */
export const AI_CRAWLERS = [
  ['GPTBot', 'OpenAI'], ['OAI-SearchBot', 'ChatGPT search'], ['ChatGPT-User', 'ChatGPT'],
  ['ClaudeBot', 'Anthropic'], ['Claude-SearchBot', 'Claude search'], ['Claude-User', 'Claude'],
  ['PerplexityBot', 'Perplexity'], ['Perplexity-User', 'Perplexity'],
  ['Google-Extended', 'Gemini'], ['Applebot-Extended', 'Apple Intelligence'], ['CCBot', 'Common Crawl'],
];

/** Is `agent` allowed to fetch `path` under this robots.txt? Most specific group, longest rule wins. */
export function robotsAllows(text, agent, path = '/') {
  const groups = [];
  let cur = null, lastAgent = false;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') {
      if (!lastAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(v.toLowerCase());
      lastAgent = true;
      continue;
    }
    lastAgent = false;
    if (cur && (k === 'allow' || k === 'disallow')) cur.rules.push({ allow: k === 'allow', path: v });
  }
  const a = agent.toLowerCase();
  const g = groups.find((x) => x.agents.includes(a)) || groups.find((x) => x.agents.includes('*'));
  if (!g) return true;
  let best = null;
  for (const r of g.rules) {
    if (!r.path) continue;
    const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  }
  return !best || best.allow;
}

/** JSON-LD blocks: how many, which @types, and whether any fail to parse. */
export function jsonLd(raw) {
  const types = new Set();
  let blocks = 0, broken = 0;
  const visit = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(visit); return; }
    const ty = o['@type'];
    for (const x of [].concat(ty || [])) if (typeof x === 'string') types.add(x);
    if (o['@graph']) visit(o['@graph']);
    for (const k of ['author', 'publisher', 'mainEntity', 'itemListElement']) if (o[k]) visit(o[k]);
  };
  for (const m of String(raw || '').matchAll(/<script\b[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    blocks++;
    try { visit(JSON.parse(m[1].trim())); } catch { broken++; }
  }
  // Next.js and similar: JSON-LD built in code
  if (!blocks && /["']@context["']\s*:\s*["']https?:\/\/schema\.org/.test(raw || '')) {
    blocks = 1;
    for (const m of String(raw).matchAll(/["']@type["']\s*:\s*["']([A-Za-z]+)["']/g)) types.add(m[1]);
  }
  return { blocks, broken, types: [...types] };
}

const IDENTITY = /^(?:Organization|LocalBusiness|Corporation|Person|Store|Restaurant|CafeOrCoffeeShop|ProfessionalService|MedicalBusiness|NGO|EducationalOrganization|WebSite|SoftwareApplication|Product|Service)$/;
const ARTICLE = /^(?:Article|BlogPosting|NewsArticle|TechArticle|HowTo|FAQPage|Recipe|Review|QAPage)$/;

const LABEL = {
  'structured-data': t('Structured data (JSON-LD)', 'Yapısal veri (JSON-LD)'),
  'readable-without-js': t('Readable without JavaScript', 'JavaScript olmadan okunabiliyor'),
  'title-description': t('Title and description', 'Başlık ve açıklama'),
  'open-graph': t('Link preview (Open Graph)', 'Link önizlemesi (Open Graph)'),
  canonical: t('Canonical address', 'Asıl adres (canonical)'),
  'one-h1': t('One main heading', 'Tek ana başlık'),
  'author-date': t('Author and date', 'Yazar ve tarih'),
  'citable-text': t('Quotable paragraphs', 'Alıntılanabilir paragraflar'),
  'ai-crawlers': t('AI crawlers allowed', 'AI tarayıcılarına izin var'),
  'llms-txt': t('llms.txt', 'llms.txt'),
  sitemap: t('Sitemap', 'Site haritası'),
};
const FIX = {
  'structured-data': t('Add a JSON-LD block that says who you are (Organization, LocalBusiness or Person) and, on articles, Article with author and date.', 'Kim olduğunuzu söyleyen bir JSON-LD bloğu ekleyin (Organization, LocalBusiness ya da Person); yazılarda yazar ve tarihli Article.'),
  'readable-without-js': t('Most AI crawlers do not run JavaScript. Prerender or server-render the page so its text is in the HTML.', 'AI tarayıcılarının çoğu JavaScript çalıştırmaz. Sayfayı önceden ya da sunucuda render edin ki metin HTML\'in içinde olsun.'),
  'title-description': t('Write a specific <title> and a meta description of one or two sentences for this page.', 'Bu sayfa için özgül bir <title> ve bir-iki cümlelik meta açıklama yazın.'),
  'open-graph': t('Add og:title, og:description and og:image, so shared links and AI answers show a proper preview.', 'og:title, og:description ve og:image ekleyin; paylaşılan linkler ve AI cevapları düzgün bir önizleme göstersin.'),
  canonical: t('Add <link rel="canonical"> with the page\'s one true address.', 'Sayfanın tek asıl adresiyle <link rel="canonical"> ekleyin.'),
  'one-h1': t('Use exactly one <h1> that says what the page is about, and h2s for its sections.', 'Sayfanın neyle ilgili olduğunu söyleyen tek bir <h1>, bölümler için h2 kullanın.'),
  'author-date': t('Show who wrote it and when (a byline and a <time datetime>), and put both in the Article JSON-LD.', 'Kimin ne zaman yazdığını gösterin (imza ve <time datetime>); ikisini de Article JSON-LD\'ye koyun.'),
  'citable-text': t('Answer the page\'s main question in plain paragraphs of full sentences. Headings and buttons alone give an AI nothing to quote.', 'Sayfanın ana sorusunu tam cümlelerden oluşan düz paragraflarla cevaplayın. Yalnızca başlık ve buton, bir AI\'ın alıntılayacağı bir şey bırakmaz.'),
  'ai-crawlers': t('Unblock the AI search crawlers you want to be found by in robots.txt (training crawlers such as GPTBot or CCBot can stay blocked).', 'Bulunmak istediğiniz AI arama tarayıcılarının robots.txt\'teki engelini kaldırın (GPTBot ya da CCBot gibi eğitim tarayıcıları engelli kalabilir).'),
  'llms-txt': t('Add /llms.txt: a short Markdown summary of the site with links to its key pages (llmstxt.org).', '/llms.txt ekleyin: sitenin kısa bir Markdown özeti ve önemli sayfalarına linkler (llmstxt.org).'),
  sitemap: t('Publish /sitemap.xml and list it in robots.txt.', '/sitemap.xml yayınlayın ve robots.txt\'te belirtin.'),
};

const check = (id, ok, detail, na = false) => ({ id, ok: !!ok, na, label: LABEL[id], detail, fix: FIX[id] });

/** Checks that belong to one page. C is a corpus (corpus/html.js or corpus/project.js). */
export function pageChecks(C, { words = 0, pageType = '', serverShell = false } = {}) {
  const raw = C.kind === 'project' ? (C.sources || []).map((s) => s.content).join('\n').slice(0, 2_000_000) : C.raw || '';
  const meta = C.meta || {};
  const ld = jsonLd(raw);
  const out = [];
  const known = ld.types.filter((x) => IDENTITY.test(x) || ARTICLE.test(x));
  out.push(check('structured-data', known.length && !ld.broken,
    ld.blocks ? t(`${ld.blocks} block${ld.blocks > 1 ? 's' : ''}${ld.types.length ? `: ${ld.types.slice(0, 5).join(', ')}` : ''}${ld.broken ? `, ${ld.broken} with invalid JSON` : ''}`, `${ld.blocks} blok${ld.types.length ? `: ${ld.types.slice(0, 5).join(', ')}` : ''}${ld.broken ? `, ${ld.broken} tanesi geçersiz JSON` : ''}`) : t('none', 'yok')));
  const shell = serverShell || (C.kind === 'project' && C.shellRoot && words < 120);
  out.push(check('readable-without-js', !shell, shell ? t('the server sends an empty JavaScript shell', 'sunucu boş bir JavaScript kabuğu gönderiyor') : t('text is in the HTML', 'metin HTML\'in içinde')));
  const proj = C.kind === 'project';
  // set in code with a value that is not a literal (t("tagline")): its length cannot be read, so it counts as set
  const descInCode = proj && !meta.description && /description\s*:\s*["'`][^"'`]{20,}/.test(raw);
  const desc = meta.description || (descInCode ? 'set in code' : null);
  const short = desc && !descInCode && meta.description !== '(set in code)' && String(desc).length < 30;
  out.push(check('title-description', meta.title && desc && !short,
    t(`title ${meta.title ? 'set' : 'missing'}, description ${desc ? (short ? 'too short' : 'set') : 'missing'}`, `başlık ${meta.title ? 'var' : 'yok'}, açıklama ${desc ? (short ? 'çok kısa' : 'var') : 'yok'}`)));
  const og = /property=["']og:(?:title|description|image)["']|openGraph\s*:/.test(raw) || meta.ogTitle || meta.ogImage;
  out.push(check('open-graph', og, og ? t('present', 'var') : t('none', 'yok')));
  const canon = meta.canonical || /rel=["']canonical["']|alternates\s*:\s*\{[^}]*canonical/.test(raw);
  out.push(check('canonical', canon, canon ? t('present', 'var') : t('none', 'yok')));
  const h1 = (C.headings || []).filter((h) => h.level === 1).length;
  if (!proj) out.push(check('one-h1', h1 === 1, t(`${h1} <h1>`, `${h1} <h1>`)));
  const articleLike = pageType === 'blog' || ld.types.some((x) => ARTICLE.test(x)) || /<article\b/i.test(raw);
  const dated = /<time\b[^>]*datetime=|"datePublished"|"dateModified"|name=["']author["']|"author"\s*:|rel=["']author["']/i.test(raw);
  out.push(check('author-date', dated, dated ? t('found', 'var') : t('no byline or date in the markup', 'işaretlemede yazar ya da tarih yok'), !articleLike));
  const paras = String(C.text || '').split('\n').filter((l) => l.trim().split(/\s+/).length >= 20).length;
  out.push(check('citable-text', paras >= 2, t(`${paras} paragraph${paras === 1 ? '' : 's'} of 20+ words`, `20+ kelimelik ${paras} paragraf`), words < 40 && !shell));
  return out;
}

/** Checks that belong to the whole site: robots.txt, llms.txt, sitemap. `null` means not checked. */
export function siteChecks({ robots = null, llms = null, sitemap = null, robotsCode = null } = {}) {
  const out = [];
  if (robotsCode && !robots) {
    // app/robots.ts builds the file at runtime; a crawler it names is most likely being refused
    const named = AI_CRAWLERS.filter(([a]) => new RegExp(`["'\`]${a}["'\`]`).test(robotsCode.content));
    const search = named.filter(([a]) => /Search|User|Perplexity|Google-Extended|Applebot/.test(a));
    out.push(check('ai-crawlers', search.length === 0,
      named.length ? t(`${robotsCode.file} names: ${named.map(([a]) => a).join(', ')}`, `${robotsCode.file} şunları adlandırıyor: ${named.map(([a]) => a).join(', ')}`)
        : t(`generated by ${robotsCode.file}, no AI crawler named`, `${robotsCode.file} ile üretiliyor, hiçbir AI tarayıcısı adlandırılmamış`)));
  } else if (robots !== undefined) {
    const blocked = robots ? AI_CRAWLERS.filter(([a]) => !robotsAllows(robots, a, '/')) : [];
    const search = blocked.filter(([a]) => /Search|User|Perplexity|Google-Extended|Applebot/.test(a));
    out.push(check('ai-crawlers', search.length === 0,
      blocked.length ? t(`blocked: ${blocked.map(([a]) => a).join(', ')}`, `engelli: ${blocked.map(([a]) => a).join(', ')}`) : t(robots ? 'none blocked' : 'no robots.txt, so all allowed', robots ? 'hiçbiri engelli değil' : 'robots.txt yok, hepsine izin var')));
  }
  if (llms !== undefined) out.push(check('llms-txt', !!llms, llms ? t('found', 'var') : t('not found', 'yok')));
  if (sitemap !== undefined) out.push(check('sitemap', !!sitemap, sitemap ? t('found', 'var') : t('not found', 'yok')));
  return out;
}

/** Page checks of several pages: a check passes when at least half the pages pass it. */
export function mergePageChecks(lists) {
  const by = new Map();
  for (const list of lists) for (const c of list || []) {
    if (c.na) continue;
    if (!by.has(c.id)) by.set(c.id, { ...c, okN: 0, n: 0 });
    const x = by.get(c.id);
    x.n++;
    if (c.ok) x.okN++;
  }
  return [...by.values()].map((x) => ({ ...x, ok: x.okN * 2 >= x.n, detail: t(`${x.okN} of ${x.n} pages`, `${x.n} sayfanın ${x.okN} tanesinde`) }));
}

export function readiness(checks) {
  const used = checks.filter((c) => !c.na);
  const passed = used.filter((c) => c.ok).length;
  return { score: used.length ? Math.round((passed / used.length) * 100) : null, passed, total: used.length, checks: used };
}

/** A file served as text, not the HTML fallback page a single-page app returns for every path. */
export const realText = (s) => !!s && s.trim().length > 10 && !/^\s*(?:<!doctype|<html|<head|<body)/i.test(s);
export const realXml = (s) => !!s && /<(?:urlset|sitemapindex)\b/i.test(s);
