// Markdown reports for people and for AI agents.
import { ORDER } from './score.js';

const L = {
  en: {
    report: 'AI Slop Meter report', score: 'Slop score', scanId: 'Scan id', words: 'words', lang: 'page language',
    files: 'source files', rendered: 'rendered with a local browser',
    cats: { content: 'Substance', language: 'Language patterns', design: 'Template design', finish: 'Unfinished details', builder: 'Builder traces' },
    bands: { clean: 'Clean', trace: 'Trace amounts', noticeable: 'Noticeable slop', heavy: 'Heavy slop', pure: 'Pure slop' },
    bandText: {
      clean: 'No meaningful slop signals.',
      trace: 'A few habits; the page still has its own voice.',
      noticeable: 'Readers will notice the template feel.',
      heavy: 'Most of the page could sit on another site unchanged.',
      pure: 'The page is almost entirely template and filler.',
    },
    issues: 'Findings, highest impact first', strengths: 'What already helps (lowers the score)', builder: 'Builder traces',
    evidence: 'Evidence', where: 'Where', fix: 'Fix', steps: 'Steps', example: 'Example', doneWhen: 'Done when', needsFacts: 'needs real facts from the owner', page: 'page',
    effort: { quick: 'quick fix', rewrite: 'rewrite', redesign: 'redesign', replace: 'replace' },
    pages: 'Pages', notes: 'Notes', next: 'Next step', failed: 'failed', issuesCol: 'Findings', topCol: 'Biggest problems',
    pagesLead: 'Every page scanned, worst first. The site score is half the average page (the home page counts double, legal and sign-in pages are left out) and half the worst page.',
    onPages: (n) => `on ${n} page${n === 1 ? '' : 's'}`,
    pageNext: (id) => `For one page's full report with its own steps, call \`slop_page\` with \`scan_id: "${id}"\` and the page path.`,
    nextText: (id) => `Call \`slop_rescue_plan\` with \`scan_id: "${id}"\` for a prioritised transformation plan, then re-scan to measure the change.`,
    capped: 'Signals concentrate in one or two areas, so the score is capped at 45.',
    note: {
      shell: 'The server sent an almost empty JavaScript shell. Scores reflect that shell. Install Chrome/Edge (or set AISLOPMETER_CHROME) to render it, or scan the project folder instead.',
      'low-text': 'Little text on this page; content measurements are limited.',
      'render-unavailable': (n) => `Could not render the page with a local browser (${n.reason}).`,
      'no-files': 'No source files found. Check the folder path.',
      'skipped-large': (n) => `${n.count} files over 400 KB were skipped.`,
      sitemap: (n) => `Found ${n.count} pages in the sitemap.`,
      'crawl-limit': (n) => `Stopped at ${n.max} pages; ${n.left} more were found. Use pages: 200 (CLI: --pages all) to scan more.`,
      'crawl-time': (n) => `Stopped after ${n.seconds} s with ${n.done} pages scanned. Scan again with fewer pages, or from the CLI for a longer run.`,
    },
    none: 'None.',
    compare: 'Before / after', before: 'Before', after: 'After', change: 'Change', resolved: 'Resolved', remaining: 'Still open', newIssues: 'New',
  },
  tr: {
    report: 'AI Slop Meter raporu', score: 'Slop skoru', scanId: 'Tarama no', words: 'kelime', lang: 'sayfa dili',
    files: 'kaynak dosya', rendered: 'yerel tarayıcıyla render edildi',
    cats: { content: 'İçerik özü', language: 'Dil kalıpları', design: 'Şablon tasarım', finish: 'Özensiz detaylar', builder: 'Üretici izleri' },
    bands: { clean: 'Temiz', trace: 'İz miktarda', noticeable: 'Belirgin slop', heavy: 'Yoğun slop', pure: 'Saf slop' },
    bandText: {
      clean: 'Kayda değer slop işareti yok.',
      trace: 'Birkaç alışkanlık var, sayfa yine de kendi sesini koruyor.',
      noticeable: 'Okuyucu şablon hissini fark eder.',
      heavy: 'Sayfanın büyük kısmı başka bir sitede de aynen durabilir.',
      pure: 'Sayfa neredeyse tamamen şablon ve dolgudan oluşuyor.',
    },
    issues: 'Bulgular, etkisi en yüksekten', strengths: 'Şimdiden işe yarayanlar (skoru düşürür)', builder: 'Üretici izleri',
    evidence: 'Kanıt', where: 'Konum', fix: 'Düzeltme', steps: 'Adımlar', example: 'Örnek', doneWhen: 'Bitti sayılır', needsFacts: 'sahibinden gerçek bilgi gerekir', page: 'sayfa',
    effort: { quick: 'hızlı düzeltme', rewrite: 'yeniden yazım', redesign: 'yeniden tasarım', replace: 'değiştirme' },
    pages: 'Sayfalar', notes: 'Notlar', next: 'Sonraki adım', failed: 'açılamadı', issuesCol: 'Bulgu', topCol: 'En büyük sorunlar',
    pagesLead: 'Taranan her sayfa, en kötüden başlayarak. Site skorunun yarısı ortalama sayfadan (ana sayfa iki kat sayılır, yasal metin ve giriş sayfaları hariç), yarısı en kötü sayfadan gelir.',
    onPages: (n) => `${n} sayfada`,
    pageNext: (id) => `Tek bir sayfanın kendi adımlarıyla tam raporu için \`slop_page\` aracını \`scan_id: "${id}"\` ve sayfa yoluyla çağırın.`,
    nextText: (id) => `Öncelik sıralı dönüşüm planı için \`slop_rescue_plan\` aracını \`scan_id: "${id}"\` ile çağırın, sonra değişimi ölçmek için yeniden tarayın.`,
    capped: 'İşaretler bir iki alanda toplandığı için skor 45 ile sınırlandı.',
    note: {
      shell: 'Sunucu neredeyse boş bir JavaScript kabuğu gönderdi, skor bu kabuğa göre. Render için Chrome/Edge kurun (ya da AISLOPMETER_CHROME ayarlayın) veya proje klasörünü tarayın.',
      'low-text': 'Sayfada az metin var, içerik ölçümleri sınırlı.',
      'render-unavailable': (n) => `Sayfa yerel tarayıcıyla render edilemedi (${n.reason}).`,
      'no-files': 'Kaynak dosya bulunamadı. Klasör yolunu kontrol edin.',
      'skipped-large': (n) => `400 KB üstündeki ${n.count} dosya atlandı.`,
      sitemap: (n) => `Site haritasında ${n.count} sayfa bulundu.`,
      'crawl-limit': (n) => `${n.max} sayfada durdu; ${n.left} sayfa daha bulundu. Daha fazlası için pages: 200 (komut satırında --pages all) kullanın.`,
      'crawl-time': (n) => `${n.seconds} saniye sonra ${n.done} sayfa taranmışken durdu. Daha az sayfayla ya da komut satırından daha uzun tarayın.`,
    },
    none: 'Yok.',
    compare: 'Önce / sonra', before: 'Önce', after: 'Sonra', change: 'Değişim', resolved: 'Çözülen', remaining: 'Açık kalan', newIssues: 'Yeni',
  },
};

export const labels = (lang) => L[lang === 'tr' ? 'tr' : 'en'];
const pick = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : o[lang] || o.en || '');
const fmt = (n) => (Math.round(n * 10) / 10).toString();
const sign = (n) => (n > 0 ? `+${fmt(n)}` : fmt(n));

function bar(pts, max, width = 12) {
  const f = Math.round((pts / max) * width);
  return '█'.repeat(f) + '░'.repeat(width - f);
}

export function renderReport(r, { lang = 'en', maxFindings = 25, maxLocations = 6 } = {}) {
  const T = labels(lang);
  const out = [];
  out.push(`# ${T.report}: ${r.target}`);
  out.push('');
  out.push(`**${T.score}: ${r.total}/100 · ${T.bands[r.band]}.** ${T.bandText[r.band]}`);
  out.push('');
  out.push('| | | |');
  out.push('|---|---|---|');
  for (const k of ORDER) out.push(`| ${T.cats[k]} | \`${bar(r.cats[k].pts, r.cats[k].max)}\` | ${fmt(r.cats[k].pts)}/${r.cats[k].max} |`);
  out.push('');
  const meta = [`${T.scanId}: \`${r.id}\``, `${r.words} ${T.words}`, `${T.lang}: ${r.lang}`];
  if (r.kind === 'project') meta.push(`${r.files} ${T.files}`);
  if (r.rendered) meta.push(T.rendered);
  out.push(meta.join(' · '));
  if (r.capped) out.push(`\n_${T.capped}_`);

  if (r.pages && r.pages.length > 1) {
    const okPages = r.pages.filter((p) => !p.error).sort((a, b) => b.total - a.total);
    const bad = r.pages.filter((p) => p.error);
    out.push(`\n## ${T.pages} (${okPages.length}${bad.length ? ` + ${bad.length} ${T.failed}` : ''})`);
    out.push(T.pagesLead);
    out.push('');
    out.push(`| ${T.page} | ${T.score} | ${T.issuesCol} | ${T.topCol} |`);
    out.push('|---|---|---|---|');
    const titleOf = (id) => pick(r.findings.find((f) => f.id === id)?.title, lang) || id;
    for (const p of okPages.slice(0, 40)) out.push(`| \`${p.path}\` | ${p.total} · ${T.bands[p.band]} | ${p.issues ?? ''} | ${(p.top || []).map(titleOf).join(', ')} |`);
    if (okPages.length > 40) out.push(`\n… +${okPages.length - 40}`);
    for (const p of bad.slice(0, 10)) out.push(`- \`${p.path}\` — ${p.error}`);
  }

  const issues = r.findings.filter((f) => f.kind === 'issue');
  out.push(`\n## ${T.issues}`);
  if (!issues.length) out.push(T.none);
  issues.slice(0, maxFindings).forEach((f, i) => {
    const tags = [T.cats[f.cat], T.effort[f.effort] || f.effort, f.needsFacts ? T.needsFacts : null, f.page ? `${T.page} ${f.page}` : null, f.pageCount ? T.onPages(f.pageCount) : null].filter(Boolean).join(' · ');
    out.push(`\n### ${i + 1}. ${pick(f.title, lang)} \`${sign(f.pts)}\``);
    out.push(`_${tags}_ · id: \`${f.id}\``);
    if (f.detail) out.push(`\n${pick(f.detail, lang)}`);
    const ev = (f.evidence || []).filter(Boolean);
    if (ev.length) {
      out.push(`\n**${T.evidence}:**`);
      for (const e of ev.slice(0, 5)) out.push(`- \`${String(e).replace(/`/g, "'").replace(/\s+/g, ' ')}\``);
    }
    const locs = (f.locations || []).filter(Boolean);
    if (locs.length) {
      out.push(`\n**${T.where}:**`);
      for (const l of locs.slice(0, maxLocations)) out.push(`- \`${l.file}:${l.line}\`${l.snippet ? ` \`${String(l.snippet).replace(/`/g, "'")}\`` : ''}`);
      if (locs.length > maxLocations) out.push(`- … +${locs.length - maxLocations}`);
    }
    if (f.pages?.length && f.pageCount > 0 && r.kind === 'site') out.push(`\n**${T.pages}:** ${f.pages.slice(0, 8).map((x) => `\`${x}\``).join(', ')}${f.pages.length > 8 ? ` … +${f.pages.length - 8}` : ''}`);
    if (f.fix) out.push(`\n**${T.fix}:** ${pick(f.fix, lang)}`);
    if (f.steps?.length && i < 12) {
      out.push(`\n**${T.steps}:**`);
      f.steps.forEach((s, j) => out.push(`${j + 1}. ${pick(s, lang)}`));
    }
    if (f.example && i < 12) out.push(`\n**${T.example}:** ${pick(f.example, lang)}`);
    if (f.doneWhen && i < 12) out.push(`\n**${T.doneWhen}:** ${pick(f.doneWhen, lang)}`);
  });
  if (issues.length > maxFindings) out.push(`\n… +${issues.length - maxFindings}`);

  const strengths = r.findings.filter((f) => f.kind === 'strength');
  if (strengths.length) {
    out.push(`\n## ${T.strengths}`);
    for (const f of strengths) out.push(`- \`${sign(f.pts)}\` ${pick(f.title, lang)}: ${(f.evidence || []).join(', ')}`);
  }
  const builder = r.findings.filter((f) => f.kind === 'info');
  if (builder.length) {
    out.push(`\n## ${T.builder}`);
    for (const f of builder) out.push(`- ${pick(f.title, lang)}: \`${(f.evidence || []).join(', ')}\` — ${pick(f.detail, lang)}`);
  }
  if (r.notes?.length) {
    out.push(`\n## ${T.notes}`);
    for (const n of r.notes) {
      const v = T.note[n.code];
      out.push(`- ${typeof v === 'function' ? v(n) : v || n.code}`);
    }
  }
  out.push(`\n## ${T.next}\n${T.nextText(r.id)}${r.kind === 'site' ? `\n${T.pageNext(r.id)}` : ''}`);
  return out.join('\n');
}

export function renderCompare(before, after, { lang = 'en' } = {}) {
  const T = labels(lang);
  const out = [`## ${T.compare}: ${after.target}`, ''];
  out.push(`| | ${T.before} (\`${before.id}\`) | ${T.after} (\`${after.id}\`) | ${T.change} |`);
  out.push('|---|---|---|---|');
  out.push(`| **${T.score}** | ${before.total} · ${T.bands[before.band]} | ${after.total} · ${T.bands[after.band]} | **${sign(after.total - before.total)}** |`);
  for (const k of ORDER) out.push(`| ${T.cats[k]} | ${fmt(before.cats[k].pts)} | ${fmt(after.cats[k].pts)} | ${sign(after.cats[k].pts - before.cats[k].pts)} |`);
  const bIds = new Set(before.findings.filter((f) => f.kind === 'issue').map((f) => f.id));
  const aIds = new Set(after.findings.filter((f) => f.kind === 'issue').map((f) => f.id));
  const name = (r, id) => pick(r.findings.find((f) => f.id === id)?.title, lang);
  const resolved = [...bIds].filter((id) => !aIds.has(id));
  const remaining = [...aIds].filter((id) => bIds.has(id));
  const fresh = [...aIds].filter((id) => !bIds.has(id));
  out.push(`\n**${T.resolved} (${resolved.length}):** ${resolved.map((id) => name(before, id)).join(', ') || T.none}`);
  out.push(`\n**${T.remaining} (${remaining.length}):** ${remaining.map((id) => name(after, id)).join(', ') || T.none}`);
  if (fresh.length) out.push(`\n**${T.newIssues} (${fresh.length}):** ${fresh.map((id) => name(after, id)).join(', ')}`);
  return out.join('\n');
}
