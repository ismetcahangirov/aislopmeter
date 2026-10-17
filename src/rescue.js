// Turn a scan into a site-specific, phased rescue plan an AI agent (or a person) can follow.
import { finalize, combinePages } from './score.js';
import { labels } from './report.js';
import { INTERVIEW, PAGE_TYPES } from './interview.js';

const t = (en, tr) => ({ en, tr });
const pick = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : o[lang] || o.en || '');

const PHASES = [
  {
    key: 'facts',
    title: t('Collect the real facts first', 'Önce gerçek bilgileri toplayın'),
    why: t('Generic copy exists because the specifics were never supplied. Ask the owner before rewriting anything; an AI that fills the gaps itself just produces new slop.',
      'Genel geçer metin, özgül bilgi hiç verilmediği için var. Hiçbir şeyi yeniden yazmadan önce sahibine sorun; boşlukları kendisi dolduran bir yapay zekâ sadece yeni slop üretir.'),
  },
  {
    key: 'cleanup',
    title: t('Clean up the unfinished details', 'Özensiz detayları temizleyin'),
    why: t('Fast, mechanical fixes that remove the most obvious "nobody checked this" signals.', 'En bariz "kimse kontrol etmemiş" işaretlerini kaldıran hızlı, mekanik düzeltmeler.'),
    match: (f) => f.cat === 'finish' || f.effort === 'quick',
  },
  {
    key: 'copy',
    title: t('Rewrite the copy with those facts', 'Metni bu bilgilerle yeniden yazın'),
    why: t('Substance and wording carry the largest share of the score and of what readers judge.', 'Skorun ve okuyucunun yargısının en büyük kısmını içerik ve dil taşır.'),
    match: (f) => f.cat === 'content' || f.cat === 'language',
  },
  {
    key: 'design',
    title: t('Leave the template look behind', 'Şablon görünümünü geride bırakın'),
    why: t('The visual defaults tell visitors the page was generated before they read a word.', 'Görsel varsayılanlar, ziyaretçi tek kelime okumadan sayfanın üretildiğini söyler.'),
    match: (f) => f.cat === 'design',
  },
  {
    key: 'trust',
    title: t('Show who stands behind the page', 'Sayfanın arkasında kim olduğunu gösterin'),
    why: t('Real names, a way to reach you and verifiable details are the strongest anti-slop signal and lower the score.', 'Gerçek isimler, ulaşılabilir iletişim ve doğrulanabilir detaylar en güçlü anti-slop işaretidir ve skoru düşürür.'),
  },
  {
    key: 'aeo',
    title: t('Make it readable for AI search', 'AI aramada okunur hale getirin'),
    why: t('ChatGPT, Claude, Perplexity and Gemini answer questions with pages they can read, place and quote. This does not change the slop score; it is the AI search readiness score.', 'ChatGPT, Claude, Perplexity ve Gemini soruları okuyabildikleri, kime ait olduğunu anlayabildikleri ve alıntılayabildikleri sayfalarla cevaplar. Slop skorunu değiştirmez; AI arama hazırlığı puanını yükseltir.'),
  },
  {
    key: 'verify',
    title: t('Measure again', 'Yeniden ölçün'),
    why: t('Re-scan the same target; AI Slop Meter prints a before/after table and the findings still open.', 'Aynı hedefi yeniden tarayın; AI Slop Meter önce/sonra tablosunu ve açık kalan bulguları gösterir.'),
  },
];

const RULES = [
  t('Design is the owner\'s choice. Before the design phase, propose 2-3 clearly different directions (palette, type, layout, one sentence each on why it fits this subject), wait for the owner to pick one, and apply only that. Each site gets its own direction from its own subject; never reuse another site\'s look.',
    'Tasarım sahibinin kararıdır. Tasarım aşamasından önce birbirinden belirgin şekilde farklı 2-3 yön önerin (palet, yazı tipi, düzen; her biri için bu konuya neden uyduğunu anlatan bir cümle), sahibinin birini seçmesini bekleyin ve yalnızca onu uygulayın. Her site kendi konusundan çıkan kendi yönünü alır; başka bir sitenin görünümünü asla tekrar kullanmayın.'),
  t('Never invent facts, numbers, names, quotes, prices, customers or awards. Where a fact is missing, write a [placeholder] and ask, or cut the claim.',
    'Asla bilgi, rakam, isim, alıntı, fiyat, müşteri ya da ödül uydurmayın. Eksik bilgi için [yer tutucu] bırakıp sorun ya da iddiayı silin.'),
  t('Do not swap one cliché for its synonym ("seamless" → "frictionless"). Replace it with a fact or delete it.',
    'Bir klişeyi eş anlamlısıyla değiştirmeyin ("kusursuz" → "pürüzsüz"). Yerine bir bilgi koyun ya da silin.'),
  t('Do not trade one AI default look for another: purple gradients → cream + serif + terracotta, or near-black + one neon accent, are the same move.',
    'Bir AI varsayılan görünümünü başkasıyla değiştirmeyin: mor gradyan → krem + serif + kiremit ya da siyah + tek neon vurgu aynı hamledir.'),
  t('Keep what the owner wants to keep. Change one phase at a time and re-scan after each.',
    'Sahibinin korumak istediklerine dokunmayın. Her seferinde bir aşamayı değiştirin ve her aşamadan sonra yeniden tarayın.'),
  t('Write for the reader, not the scanner: the goal is a page that is more useful and specific, not one that dodges a detector.',
    'Tarayıcı için değil okuyucu için yazın: amaç bir dedektörü atlatmak değil, daha faydalı ve özgül bir sayfa.'),
];

const DESIGN_STEPS = [
  t('Name the subject\'s own world in one line: its materials, place, era, tools, the vocabulary customers use. Every visual choice should come from that line.',
    'Konunun kendi dünyasını tek satırda adlandırın: malzemeleri, mekânı, dönemi, aletleri, müşterilerin kullandığı kelimeler. Her görsel karar bu satırdan çıkmalı.'),
  Object.assign(t('Palette: 1 background neutral tinted toward the accent, 1 ink colour, 1 accent taken from the subject (a material, a product, a signage colour), used on under 10% of the surface. Check contrast (4.5:1 for text).',
    'Palet: vurguya doğru hafif renklendirilmiş 1 zemin nötrü, 1 mürekkep rengi, konudan alınmış 1 vurgu (bir malzeme, ürün ya da tabela rengi), yüzeyin %10\'undan azında. Kontrastı kontrol edin (metin için 4.5:1).'), { when: ['purple-gradient', 'default-palette', 'cream-terracotta', 'acid-on-black', 'perma-dark', 'gradient-text'] }),
  Object.assign(t('Type: pair a display face with character and a quiet text face; avoid Inter/Space Grotesk/Poppins as the whole identity. Set one type scale and stick to it.',
    'Yazı: karakterli bir başlık fontuyla sakin bir metin fontunu eşleştirin; kimliği tek başına Inter/Space Grotesk/Poppins\'e bırakmayın. Tek bir yazı ölçeği belirleyip ona uyun.'), { when: ['default-font'] }),
  Object.assign(t('Layout: give each section the shape of its content (table for comparisons, numbered steps only for real sequences, one large proof instead of six small cards). Not everything centred; not everything in a rounded card.',
    'Düzen: her bölüme içeriğinin şeklini verin (karşılaştırma için tablo, yalnızca gerçek sıralar için numaralı adımlar, altı küçük kart yerine tek büyük kanıt). Her şey ortada değil, her şey yuvarlak kartta değil.'), { when: ['card-template', 'landing-template', 'portfolio-template', 'icon-tiles'] }),
  Object.assign(t('Imagery and icons: real photos of the product, place or people beat illustrations; if icons stay, one consistent set, no emoji.',
    'Görsel ve ikon: ürünün, mekânın ya da insanların gerçek fotoğrafları illüstrasyondan iyidir; ikon kalacaksa tek ve tutarlı bir set, emoji yok.'), { when: ['emoji-icons', 'stock-icons', 'icon-tiles', 'ai-images', 'placeholder-images', 'emoji-headings'] }),
];

const COPY_STEPS = [
  Object.assign(t('Hero: say who it is for, what it does and one proof, in the visitor\'s words. No "unlock", "elevate", "next level".',
    'Hero: kimin için olduğunu, ne yaptığını ve tek bir kanıtı ziyaretçinin kelimeleriyle söyleyin. "Potansiyelinizi", "bir sonraki seviye" yok.'), { when: ['headline-formula', 'specificity', 'lexicon', 'inflation'] }),
  Object.assign(t('Each claim gets a fact: a number with its source, a named customer, a price, a time, a step of the process.',
    'Her iddiaya bir bilgi: kaynağıyla bir rakam, isimli bir müşteri, bir fiyat, bir süre, sürecin bir adımı.'), { when: ['vanity', 'unverified-claims', 'specificity', 'inflation', 'fake-proof'] }),
  Object.assign(t('Cut sentences that could appear on someone else\'s site unchanged. If nothing remains in a section, cut the section.',
    'Başka birinin sitesinde aynen durabilecek cümleleri silin. Bir bölümde hiçbir şey kalmıyorsa bölümü silin.'), { when: ['lexicon', 'specificity', 'stock-microcopy', 'triads', 'neg-parallel'] }),
  Object.assign(t('Buttons name the outcome ("See this week\'s menu", "Book a 20-minute call").',
    'Butonlar sonucu adlandırsın ("Bu haftanın menüsünü gör", "20 dakikalık görüşme ayarla").'), { when: ['generic-cta', 'stock-microcopy'] }),
];

function simulate(r, removeIds) {
  if (r.kind === 'site' && r.pageResults?.length) {
    // a site score is a blend of page scores: remove the fixed findings from every page, re-score, blend again
    const ids = new Set([...removeIds].map((k) => k.split('|')[0]));
    const pages = r.pageResults.map((p) => finalize({ findings: p.findings.filter((f) => !ids.has(f.id)).map((f) => ({ ...f })) }));
    return combinePages(pages).total;
  }
  const left = r.findings.filter((f) => !removeIds.has(f.id + '|' + (f.page || ''))).map((f) => ({ ...f }));
  return finalize({ ...r, findings: left }).total;
}
const key = (f) => f.id + '|' + (f.page || '');

// What the owner said must stay, in their words → the findings that would change it.
// Those findings stay in the score (they are still there) but leave the to-do list.
const KEEP_MAP = [
  [/\b(?:mor|purple|violet|indigo|lila|eflatun|menekşe|magenta|fuşya|fuchsia)/i, ['purple-gradient', 'default-palette']],
  [/gradyan|gradient|geçişli renk/i, ['purple-gradient', 'gradient-text']],
  [/koyu|karanlık|siyah|dark|black|gece/i, ['perma-dark', 'acid-on-black']],
  [/krem|cream|kiremit|terracotta|bej|beige/i, ['cream-terracotta']],
  [/neon|asit|acid|fosforlu/i, ['acid-on-black']],
  [/yazı ?tip|font|typeface|inter\b|poppins|space grotesk|geist|montserrat/i, ['default-font']],
  [/animasyon|efekt|hareket|animation|effect|motion|daktilo|typing|imleç|cursor|parçacık|particle/i, ['gimmick-effects', 'motion-everywhere', 'motion-tells']],
  [/emoji/i, ['emoji-icons', 'emoji-headings']],
  [/ikon|icon|lucide/i, ['stock-icons', 'icon-tiles']],
  [/kart|card/i, ['card-template', 'nested-cards']],
  [/yuvarlak|rounded|radius|köşe/i, ['rounded-everything']],
  [/cam\b|glass|glow|parlama|bulanık|blur/i, ['glow-glass']],
  [/ortala|centred|centered/i, ['centred-everything']],
  [/büyük başlık|giant|big headline|dev başlık/i, ['giant-hero']],
];
export function keptFindings(keep, issues) {
  if (!keep) return [];
  const ids = new Set(KEEP_MAP.filter(([re]) => re.test(keep)).flatMap(([, list]) => list));
  return issues.filter((f) => ids.has(f.id));
}

export function buildRescuePlan(r, { keep = r.config?.keep || '', targetScore = 20 } = {}) {
  const kept = keptFindings(keep, r.findings.filter((f) => f.kind === 'issue'));
  const keptIds = new Set(kept.map((f) => f.id));
  const issues = r.findings.filter((f) => f.kind === 'issue' && !keptIds.has(f.id));
  const used = new Set();
  const phases = [];
  let removed = new Set();
  let score = r.total;
  const type = r.pageType || 'general';

  // facts
  const factFindings = issues.filter((f) => f.needsFacts);
  const byFinding = issues.filter((f) => f.needsFacts || INTERVIEW.byFinding[f.id])
    .flatMap((f) => { const q = INTERVIEW.byFinding[f.id] && INTERVIEW.byFinding[f.id](f); return q ? [q] : []; });
  const seenQ = new Set();
  const questions = [
    ...(type === 'portfolio' ? INTERVIEW.corePortfolio : INTERVIEW.core),
    ...(INTERVIEW[type] || []),
    ...byFinding,
    // the redesign starts from the owner's taste, not from the AI's next default
    ...(issues.some((f) => f.cat === 'design') ? [t('Which 2-3 sites, brands or places do you like the look of, and which three words should describe how this one feels?', 'Görünümünü sevdiğin 2-3 site, marka ya da mekân hangisi; bu site hangi üç kelimeyle hissettirmeli?')] : []),
  ].filter((q) => { const k = q.en; if (seenQ.has(k)) return false; seenQ.add(k); return true; });
  phases.push({ ...PHASES[0], questions, steps: [], gain: 0, scoreAfter: score });

  for (const ph of PHASES.slice(1, 4)) {
    const steps = issues.filter((f) => !used.has(key(f)) && ph.match(f));
    steps.forEach((f) => used.add(key(f)));
    if (!steps.length) continue;
    removed = new Set([...removed, ...steps.map(key)]);
    const after = simulate(r, removed);
    // general guidance only where this site has a matching problem
    const has = (ids) => issues.some((f) => ids.includes(f.id));
    const extra = (ph.key === 'design' ? DESIGN_STEPS : ph.key === 'copy' ? COPY_STEPS : []).filter((x) => !x.when || has(x.when));
    const next = Math.min(score, after); // an estimate never shows a phase making things worse
    phases.push({ ...ph, steps, extra, gain: score - next, scoreAfter: next });
    score = next;
  }

  const strengths = new Set(r.findings.filter((f) => f.kind === 'strength').map((f) => f.id.replace('strength-', '')));
  const missing = INTERVIEW.trustItems.filter((x) => !strengths.has(x.id) && (!x.types || x.types.includes(type)));
  if (missing.length && r.kind !== 'project-component') phases.push({ ...PHASES[4], trust: missing, steps: [], gain: 0, scoreAfter: score });
  const aeoMissing = (r.aeo?.checks || []).filter((c) => !c.ok);
  if (aeoMissing.length) phases.push({ ...PHASES.find((p) => p.key === 'aeo'), aeo: aeoMissing, steps: [], gain: 0, scoreAfter: score });
  phases.push({ ...PHASES.find((p) => p.key === 'verify'), gain: 0, scoreAfter: score });

  return { scanId: r.id, target: r.target, kind: r.kind, total: r.total, band: r.band, pageType: type, keep, kept: kept.map((f) => ({ id: f.id, title: f.title, pts: f.pts })), targetScore, estimate: score, phases, rules: RULES, aeo: r.aeo ? { score: r.aeo.score, passed: r.aeo.passed, total: r.aeo.total } : null };
}

export function renderRescuePlan(plan, { lang = 'en' } = {}) {
  const T = labels(lang);
  const tr = lang === 'tr';
  const out = [];
  out.push(tr ? `# Kurtarma planı: ${plan.target}` : `# Rescue plan: ${plan.target}`);
  out.push('');
  out.push(tr
    ? `Şu an **${plan.total}/100 (${T.bands[plan.band]})**. Bu plan uygulanırsa tahmini skor **~${plan.estimate}**. Hedef: **${plan.targetScore}**. Sayfa türü tahmini: ${PAGE_TYPES[plan.pageType]?.tr || plan.pageType}.`
    : `Now **${plan.total}/100 (${T.bands[plan.band]})**. Estimated after this plan: **~${plan.estimate}**. Target: **${plan.targetScore}**. Page type guess: ${PAGE_TYPES[plan.pageType]?.en || plan.pageType}.`);
  if (plan.keep) out.push(tr ? `\nSahibinin korumak istedikleri: **${plan.keep}**. Bunlara dokunmayın.` : `\nThe owner wants to keep: **${plan.keep}**. Do not change these.`);
  if (plan.kept?.length) {
    out.push(tr ? `Bu yüzden şu bulgular plandan çıkarıldı, ilgili yerlere dokunmayın: ${plan.kept.map((f) => `${pick(f.title, lang)} (\`${f.id}\`)`).join(', ')}. Skorda kalmaya devam ederler; kalıcı olarak kapatmak için \`.aislopmeter.json\` içine \`"disable": [${plan.kept.map((f) => `"${f.id}"`).join(', ')}]\` yazılabilir.`
      : `So these findings are left out of the plan; do not touch what they point at: ${plan.kept.map((f) => `${pick(f.title, lang)} (\`${f.id}\`)`).join(', ')}. They still count in the score; to switch them off for good, add \`"disable": [${plan.kept.map((f) => `"${f.id}"`).join(', ')}]\` to \`.aislopmeter.json\`.`);
  }
  out.push(`\n## ${tr ? 'Kurallar' : 'Rules'}`);
  for (const r of plan.rules) out.push(`- ${pick(r, lang)}`);

  plan.phases.forEach((ph, i) => {
    const gain = ph.gain ? (tr ? ` · tahmini −${ph.gain} puan → ~${ph.scoreAfter}` : ` · est. −${ph.gain} points → ~${ph.scoreAfter}`) : '';
    out.push(`\n## ${tr ? 'Aşama' : 'Phase'} ${i + 1}. ${pick(ph.title, lang)}${gain}`);
    out.push(pick(ph.why, lang));
    if (ph.questions?.length) {
      out.push(tr ? '\nSahibine tek mesajda sorun, cevapları bekleyin:' : '\nAsk the owner in one message and wait for the answers:');
      ph.questions.forEach((q, j) => out.push(`${j + 1}. ${pick(q, lang)}`));
    }
    if (ph.steps?.length) {
      out.push('');
      for (const f of ph.steps) {
        const loc = (f.locations || []).slice(0, 4).map((l) => `\`${l.file}:${l.line}\``).join(', ');
        out.push(`- **${pick(f.title, lang)}** (\`${f.id}\`, +${Math.round(f.pts * 10) / 10}${f.page ? `, ${f.page}` : ''}${f.pageCount > 1 ? `, ${f.pageCount} ${lang === 'tr' ? 'sayfa' : 'pages'}` : ''})${loc ? ` — ${loc}` : ''}`);
        if (f.fix) out.push(`  ${pick(f.fix, lang)}`);
        const ev = (f.evidence || []).filter(Boolean).slice(0, 2);
        if (ev.length) out.push(`  ${tr ? 'Kanıt' : 'Evidence'}: ${ev.join(' / ')}`);
      }
    }
    if (ph.extra?.length) {
      out.push(tr ? '\nYöntem:' : '\nMethod:');
      ph.extra.forEach((s) => out.push(`- ${pick(s, lang)}`));
    }
    if (ph.trust?.length) {
      out.push('');
      ph.trust.forEach((x) => out.push(`- ${pick(x.text, lang)}`));
    }
    if (ph.aeo?.length) {
      out.push(tr ? `\nŞu an ${plan.aeo.passed}/${plan.aeo.total}. Eksikler:` : `\nNow ${plan.aeo.passed}/${plan.aeo.total}. Missing:`);
      ph.aeo.forEach((c) => out.push(`- **${pick(c.label, lang)}** (${pick(c.detail, lang)}): ${pick(c.fix, lang)}`));
    }
    if (ph.key === 'verify') {
      out.push(tr
        ? `\nAynı hedefle \`slop_scan\` çağırın (CLI: \`npx aislopmeter ${plan.target}\`). Skor ${plan.targetScore} altına inene ya da kalan bulgular yalnızca sahibin bilebileceği bilgiler gerektirene kadar tekrarlayın. Ayrıntılı yöntem: \`slop_guide\` → playbook, copy, design.`
        : `\nCall \`slop_scan\` on the same target (CLI: \`npx aislopmeter ${plan.target}\`). Repeat until the score is at or below ${plan.targetScore}, or what remains needs facts only the owner has. Full method: \`slop_guide\` → playbook, copy, design.`);
    }
  });
  return out.join('\n');
}
