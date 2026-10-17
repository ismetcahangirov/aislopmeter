// Visual report: a self-contained HTML page with two screens.
//  1. Report  — score, categories, findings with evidence and file:line.
//  2. To-do   — a calm, step-by-step plan with checkboxes, time estimates and the owner questions.
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { ORDER } from './score.js';
import { labels } from './report.js';
import { buildRescuePlan } from './rescue.js';
import { VERSION } from './version.js';
import { fixPrompt, targetLines, targetsOf } from './actions.js';

const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pick = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : o[lang] || o.en || '');
const fmt = (n) => (Math.round(n * 10) / 10).toString();
const MINUTES = { quick: 3, rewrite: 12, redesign: 30, replace: 15 };

const UI = {
  en: {
    tabReport: 'Report', tabPlan: 'What to do', of: 'of 100', since: 'since last scan', lastScan: 'Last scan',
    categories: 'Where the score comes from', findings: 'What we found', findingsNote: 'Highest impact first. Each item says what to do; open it for the steps, the exact places and a prompt you can hand to your AI.',
    strengths: 'Already working for you', strengthsNote: 'These lower the score.', builder: 'Builder traces', builderNote: 'Information only: using a tool is not slop on its own.',
    evidence: 'Evidence', where: 'Where', fix: 'How to fix', points: 'points', none: 'Nothing here.',
    notes: 'Notes', history: 'Progress',
    aeo: 'AI search readiness', aeoNote: 'Can ChatGPT, Claude, Perplexity and Gemini read this page, tell who is behind it and quote it? A separate score: it does not change the slop score.',
    planLead: (now, est, target) => `You are at <b>${now}</b>. Finishing this plan should bring you to about <b>${est}</b>. The goal is <b>${target}</b> or lower.`,
    calm: 'You do not have to do it all at once. Start with step 1 and the quick wins; each step stands on its own, and you can re-scan after any of them.',
    stepTime: (m) => `about ${m} min`, stepGain: (g) => `−${g} points`, items: (n) => `${n} item${n === 1 ? '' : 's'}`,
    questionsLead: 'Answer what you can. Leave the rest empty: the AI will use a [placeholder] or cut the claim, never invent it.',
    copyAnswers: 'Copy my answers', copied: 'Copied', copyFail: 'Select the text and copy it',
    rulesTitle: 'Rules the AI follows while fixing', keepTitle: 'Kept as is',
    copyPrompt: 'Copy the whole plan as a prompt', promptNote: 'Paste it into Claude, Cursor, Lovable or any AI tool that can edit your site.',
    done: 'done', progressLabel: 'Checked off',
    target: 'Target', now: 'Now', after: 'After plan',
    generated: (d) => `Generated ${d} by AI Slop Meter ${VERSION}`, rerun: 'Re-scan after changes', openWhere: 'Show locations',
    answerPh: 'Your answer…',
    more: (n) => `${n} smaller findings`, moreQs: (n) => `${n} more questions (optional)`, moreItems: (n) => `${n} more`,
    startHere: 'Start here', startLead: (m, g) => `Three quick fixes, about ${m} minutes, about −${g} points. Nothing else needs to happen today.`,
    howTo: 'How to do it', arrow: '→',
    todo: 'What to do', doneWhen: 'Done when', example: 'Example', before: 'Before', after2: 'After', why: 'Why this counts',
    tabPages: 'Pages', pagesTitle: (n) => `${n} pages scanned`, pagesLead: 'Every page has its own score and its own to-do list. Worst first. The site score is half the average page (home counts double, legal pages left out) and half the worst page.',
    pagesWord: 'Pages', onPages: (n) => `on ${n} page${n === 1 ? '' : 's'}`, openPage: 'Open the page', pageIssues: (n) => `${n} finding${n === 1 ? '' : 's'}`, failedPages: 'Could not be opened', cleanPage: 'Nothing to fix on this page.',
    giveAi: 'Copy as a prompt for your AI', giveAiNote: 'One problem at a time: paste into Claude, Cursor, Lovable…', fixesAt: (n) => `${n} place${n === 1 ? '' : 's'} to change`,
  },
  tr: {
    tabReport: 'Rapor', tabPlan: 'Yapılacaklar', of: '/ 100', since: 'son taramadan beri', lastScan: 'Son tarama',
    categories: 'Skor nereden geliyor', findings: 'Bulunanlar', findingsNote: 'Etkisi en yüksek olan en üstte. Her madde ne yapman gerektiğini söylüyor; adımlar, tam konumlar ve yapay zekâna verebileceğin prompt için aç.',
    strengths: 'Şimdiden işe yarayanlar', strengthsNote: 'Bunlar skoru düşürür.', builder: 'Üretici izleri', builderNote: 'Sadece bilgi: bir araç kullanmak tek başına slop değildir.',
    evidence: 'Kanıt', where: 'Konum', fix: 'Nasıl düzeltilir', points: 'puan', none: 'Burada bir şey yok.',
    notes: 'Notlar', history: 'İlerleme',
    aeo: 'AI arama hazırlığı', aeoNote: 'ChatGPT, Claude, Perplexity ve Gemini bu sayfayı okuyabiliyor, arkasında kimin olduğunu anlayıp alıntılayabiliyor mu? Ayrı bir puan: slop skorunu değiştirmez.',
    planLead: (now, est, target) => `Şu an <b>${now}</b>. Bu plan bitince yaklaşık <b>${est}</b> olması bekleniyor. Hedef <b>${target}</b> ya da altı.`,
    calm: 'Hepsini bir kerede yapmak zorunda değilsiniz. 1. adımla ve hızlı kazanımlarla başlayın; her adım kendi başına iş görür ve herhangi birinden sonra yeniden tarayabilirsiniz.',
    stepTime: (m) => `yaklaşık ${m} dk`, stepGain: (g) => `−${g} puan`, items: (n) => `${n} madde`,
    questionsLead: 'Bildiklerinizi yazın, gerisini boş bırakın: yapay zekâ boşlukları uydurmaz, [yer tutucu] bırakır ya da iddiayı siler.',
    copyAnswers: 'Cevaplarımı kopyala', copied: 'Kopyalandı', copyFail: 'Metni seçip kopyalayın',
    rulesTitle: 'Yapay zekânın düzeltirken uyduğu kurallar', keepTitle: 'Olduğu gibi kalacaklar',
    copyPrompt: 'Planın tamamını prompt olarak kopyala', promptNote: 'Claude, Cursor, Lovable ya da sitenizi düzenleyebilen herhangi bir yapay zekâya yapıştırın.',
    done: 'tamam', progressLabel: 'İşaretlenen',
    target: 'Hedef', now: 'Şu an', after: 'Plan sonrası',
    generated: (d) => `${d} tarihinde AI Slop Meter ${VERSION} ile oluşturuldu`, rerun: 'Değişikliklerden sonra yeniden tarayın', openWhere: 'Konumları göster',
    answerPh: 'Cevabınız…',
    more: (n) => `${n} küçük bulgu daha`, moreQs: (n) => `${n} soru daha (isteğe bağlı)`, moreItems: (n) => `${n} madde daha`,
    startHere: 'Buradan başla', startLead: (m, g) => `Üç hızlı düzeltme, yaklaşık ${m} dakika, yaklaşık −${g} puan. Bugün başka bir şey yapmanıza gerek yok.`,
    howTo: 'Nasıl yapılır', arrow: '→',
    todo: 'Ne yapmalısın', doneWhen: 'Bitti sayılır', example: 'Örnek', before: 'Önce', after2: 'Sonra', why: 'Neden sayıldı',
    tabPages: 'Sayfalar', pagesTitle: (n) => `${n} sayfa tarandı`, pagesLead: 'Her sayfanın kendi skoru ve kendi yapılacaklar listesi var. En kötüsü en üstte. Site skorunun yarısı ortalama sayfadan (ana sayfa iki kat, yasal sayfalar hariç), yarısı en kötü sayfadan gelir.',
    pagesWord: 'Sayfalar', onPages: (n) => `${n} sayfada`, openPage: 'Sayfayı aç', pageIssues: (n) => `${n} bulgu`, failedPages: 'Açılamayan sayfalar', cleanPage: 'Bu sayfada düzeltilecek bir şey yok.',
    giveAi: 'Yapay zekân için prompt olarak kopyala', giveAiNote: 'Tek seferde tek sorun: Claude, Cursor, Lovable… içine yapıştır.', fixesAt: (n) => `değiştirilecek ${n} yer`,
  },
};

const BAND_TONE = { clean: 'good', trace: 'good', noticeable: 'warn', heavy: 'bad', pure: 'bad' };

function dial(score, band) {
  const r = 84, c = 2 * Math.PI * r;
  const ticks = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * 2 * Math.PI - Math.PI / 2;
    const r1 = i % 5 === 0 ? 97 : 100, r2 = 104;
    return `<line x1="${110 + r1 * Math.cos(a)}" y1="${110 + r1 * Math.sin(a)}" x2="${110 + r2 * Math.cos(a)}" y2="${110 + r2 * Math.sin(a)}"/>`;
  }).join('');
  return `<svg class="dial tone-${BAND_TONE[band]}" viewBox="0 0 220 220" role="img" aria-label="${score}/100">
  <g class="ticks">${ticks}</g>
  <line class="cross" x1="110" y1="30" x2="110" y2="62"/><line class="cross" x1="110" y1="158" x2="110" y2="190"/>
  <line class="cross" x1="30" y1="110" x2="62" y2="110"/><line class="cross" x1="158" y1="110" x2="190" y2="110"/>
  <circle class="track" cx="110" cy="110" r="${r}"/>
  <circle class="arc" cx="110" cy="110" r="${r}" stroke-dasharray="${(score / 100) * c} ${c}" transform="rotate(-90 110 110)"/>
  <text class="num" x="110" y="120" text-anchor="middle">${score}</text>
</svg>`;
}

function loc(l) {
  return `<li><code>${esc(l.file)}:${esc(l.line)}</code>${l.snippet ? ` <span>${esc(l.snippet)}</span>` : ''}</li>`;
}

function exampleHtml(f, lang, U) {
  if (!f.example) return '';
  const ex = pick(f.example, lang);
  const m = ex.match(/^(?:Before|Önce):\s*([\s\S]*?)\s*(?:After|Sonra):\s*([\s\S]*)$/);
  if (!m) return `<p class="ex">${esc(ex)}</p>`;
  return `<div class="ex"><div><span>${U.before}</span><p class="was">${esc(m[1])}</p></div><div><span>${U.after2}</span><p class="now">${esc(m[2])}</p></div></div>`;
}

function stepsHtml(f, lang, U) {
  const steps = (f.steps || []).map((x) => pick(x, lang));
  if (!steps.length && f.fix) steps.push(pick(f.fix, lang));
  if (!steps.length) return '';
  return `<ol class="steps">${steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>${exampleHtml(f, lang, U)}${f.doneWhen ? `<p class="donewhen"><b>${U.doneWhen}:</b> ${esc(pick(f.doneWhen, lang))}</p>` : ''}`;
}

const fkey = (f) => `${f.id}|${f.page || ''}`;

function pagesList(f, scan, U) {
  if (!f.pages?.length || scan?.kind !== 'site') return '';
  const base = scan.url || scan.target;
  const link = (p) => { let href = p; try { href = new URL(p, base).toString(); } catch { /* keep */ } return `<li><a href="${esc(href)}" target="_blank" rel="noopener"><code>${esc(p)}</code></a></li>`; };
  const shown = f.pages.slice(0, 12).map(link).join('');
  const more = f.pages.length > 12 ? `<details class="more"><summary>${U.moreItems(f.pages.length - 12)}</summary><ul class="locs">${f.pages.slice(12).map(link).join('')}</ul></details>` : '';
  return `<h4>${U.pagesWord} (${f.pages.length})</h4><ul class="locs pagelist">${shown}</ul>${more}`;
}

function aiButton(f, U) {
  return `<div class="row"><button type="button" class="btn small" data-copy="fix" data-fid="${esc(fkey(f))}">${U.giveAi}</button><span class="status" aria-live="polite"></span></div>`;
}

function findingItem(f, lang, U, open = false, scan = null) {
  const T = labels(lang);
  const ev = (f.evidence || []).filter(Boolean);
  const ls = (f.locations || []).filter(Boolean);
  const oneLine = pick(f.fix, lang);
  return `<details class="finding"${open ? ' open' : ''}>
  <summary>
    <span class="pts tone-${f.severity}">+${fmt(f.pts)}</span>
    <span class="ft"><span class="ftitle">${esc(pick(f.title, lang))}</span>
      ${oneLine ? `<span class="fdo"><b>${U.arrow}</b> ${esc(oneLine)}</span>` : ''}
      <span class="chips"><span>${esc(T.cats[f.cat])}</span><span>${esc(T.effort[f.effort] || f.effort || '')}</span>${f.needsFacts ? `<span>${esc(T.needsFacts)}</span>` : ''}${f.page ? `<span>${esc(f.page)}</span>` : ''}${f.pageCount > 1 || (f.pageCount === 1 && scan?.kind === 'site') ? `<span>${esc(U.onPages(f.pageCount))}</span>` : ''}${ls.length ? `<span>${esc(U.fixesAt(ls.length))}</span>` : ''}</span></span>
  </summary>
  <div class="fbody">
    <div class="todo-box">
      <h4>${U.todo}</h4>
      ${stepsHtml(f, lang, U)}
      ${pagesList(f, scan, U)}
      ${ls.length ? `<h4>${U.where}</h4><ul class="locs">${ls.map(loc).join('')}</ul>` : ''}
      ${aiButton(f, U)}
    </div>
    ${f.detail || ev.length ? `<details class="why-box"><summary>${U.why}</summary>${f.detail ? `<p>${esc(pick(f.detail, lang))}</p>` : ''}${ev.length ? `<h4>${U.evidence}</h4><ul class="ev">${ev.slice(0, 5).map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}</details>` : ''}
  </div>
</details>`;
}

function promptText(plan, scan, lang) {
  const tr = lang === 'tr';
  const out = [];
  out.push(tr ? `Bu siteyi/projeyi "AI slop" görünümünden kurtar: ${scan.target}` : `Rescue this site/project from AI slop: ${scan.target}`);
  out.push(tr ? `AI Slop Meter skoru ${scan.total}/100. Hedef ${plan.targetScore} ve altı.` : `AI Slop Meter score ${scan.total}/100. Target ${plan.targetScore} or lower.`);
  out.push('');
  out.push(tr ? 'Kurallar:' : 'Rules:');
  for (const r of plan.rules) out.push(`- ${pick(r, lang)}`);
  if (plan.keep) out.push(`- ${tr ? 'Dokunma' : 'Keep'}: ${plan.keep}`);
  plan.phases.forEach((ph, i) => {
    out.push('');
    out.push(`${i + 1}. ${pick(ph.title, lang)}`);
    for (const q of ph.questions || []) out.push(`   - ${tr ? 'Sor' : 'Ask'}: ${pick(q, lang)}`);
    for (const f of ph.steps || []) {
        out.push(`   - ${pick(f.title, lang)}: ${pick(f.fix, lang)}`);
      out.push(...targetLines(f, lang, '       '));
      for (const st of f.steps || []) out.push(`     · ${pick(st, lang)}`);
    }
    for (const x of ph.extra || []) out.push(`   - ${pick(x, lang)}`);
    for (const x of ph.trust || []) out.push(`   - ${pick(x.text, lang)}`);
  });
  return out.join('\n');
}

export function renderHtml(scan, { lang = 'en', plan = null, history = [], targetScore = 20 } = {}) {
  const U = UI[lang === 'tr' ? 'tr' : 'en'];
  const T = labels(lang);
  plan = plan || buildRescuePlan(scan, { targetScore });
  const issues = scan.findings.filter((f) => f.kind === 'issue');
  const strengths = scan.findings.filter((f) => f.kind === 'strength');
  const builder = scan.findings.filter((f) => f.kind === 'info');
  const prev = history.length > 1 ? history[history.length - 2] : null;
  const delta = prev ? scan.total - prev.total : null;
  const date = new Date(scan.createdAt || Date.now());
  const dateStr = date.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const storeKey = 'aislopmeter:' + scan.target;

  const catRows = ORDER.map((k) => {
    const c = scan.cats[k];
    const pct = Math.round((c.pts / c.max) * 100);
    return `<div class="cat${k === 'builder' ? ' info' : ''}"><span class="cname">${esc(T.cats[k])}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="cval">${fmt(c.pts)}<small>/${c.max}</small></span></div>`;
  }).join('');

  const notes = (scan.notes || []).map((n) => {
    const v = T.note[n.code];
    return `<li>${esc(typeof v === 'function' ? v(n) : v || n.code)}</li>`;
  }).join('');

  const histHtml = history.length > 1 ? `<section class="block"><h2>${U.history}</h2><ol class="hist">${history.map((h) => `<li><code>${esc(h.id)}</code><span class="bar"><i style="width:${h.total}%"></i></span><b>${h.total}</b></li>`).join('')}</ol></section>` : '';

  // plan screen
  const todoItem = (f) => {
    const id = `${f.id}|${f.page || ''}`;
    const ls = (f.locations || []).filter(Boolean);
    return `<li><label><input type="checkbox" data-id="${esc(id)}"><span><b>${esc(pick(f.title, lang))}</b> <em>${esc(pick(f.fix, lang))}</em></span></label><details class="where"><summary>${U.howTo}${f.pageCount > 1 ? ` · ${esc(U.onPages(f.pageCount))}` : ''}${ls.length ? ` · ${esc(U.fixesAt(ls.length))}` : ''}</summary>${stepsHtml(f, lang, U)}${pagesList(f, scan, U)}${ls.length ? `<ul class="locs">${ls.map(loc).join('')}</ul>` : ''}${aiButton(f, U)}</details></li>`;
  };
  const phaseHtml = plan.phases.map((ph, i) => {
    const steps = ph.steps || [];
    const minutes = ph.key === 'facts' ? 10 : ph.key === 'verify' ? 2 : ph.key === 'trust' ? 15 : ph.key === 'aeo' ? 5 * (ph.aeo?.length || 1) : steps.reduce((a, f) => a + (MINUTES[f.effort] || 10), 0);
    const meta = [U.stepTime(minutes), ph.gain ? U.stepGain(ph.gain) : null, steps.length ? U.items(steps.length) : null].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('');
    let body = '';
    if (ph.questions?.length) {
      const qs = ph.questions.map((q, j) => `<li><label for="q${j}">${esc(pick(q, lang))}</label><textarea id="q${j}" data-q="${esc(pick(q, lang))}" rows="1" placeholder="${U.answerPh}"></textarea></li>`);
      body += `<p class="hint">${U.questionsLead}</p><ol class="qs">${qs.slice(0, 6).join('')}</ol>`;
      if (qs.length > 6) body += `<details class="more"><summary>${U.moreQs(qs.length - 6)}</summary><ol class="qs" start="7">${qs.slice(6).join('')}</ol></details>`;
      body += `<div class="row"><button type="button" class="btn" data-copy="answers">${U.copyAnswers}</button><span class="status" aria-live="polite"></span></div>`;
    }
    if (steps.length) {
      body += `<ul class="todo">${steps.slice(0, 5).map(todoItem).join('')}</ul>`;
      if (steps.length > 5) body += `<details class="more"><summary>${U.moreItems(steps.length - 5)}</summary><ul class="todo">${steps.slice(5).map(todoItem).join('')}</ul></details>`;
    }
    if (ph.extra?.length) body += `<details class="more"><summary>${U.howTo}</summary><ul class="method">${ph.extra.map((x) => `<li>${esc(pick(x, lang))}</li>`).join('')}</ul></details>`;
    if (ph.trust?.length) body += `<ul class="todo">${ph.trust.map((x) => `<li><label><input type="checkbox" data-id="trust-${esc(x.id)}"><span>${esc(pick(x.text, lang))}</span></label></li>`).join('')}</ul>`;
    if (ph.aeo?.length) body += `<ul class="todo">${ph.aeo.map((c) => `<li><label><input type="checkbox" data-id="aeo-${esc(c.id)}"><span><b>${esc(pick(c.label, lang))}</b> <em>${esc(pick(c.fix, lang))}</em></span></label></li>`).join('')}</ul>`;
    if (ph.key === 'verify') body += `<p class="hint">${U.rerun}: <code>npx aislopmeter ${esc(scan.display || scan.target)}</code></p>`;
    return `<li class="phase"><details${i < 2 ? ' open' : ''}><summary><span class="pnum">${i + 1}</span><span class="phead"><span class="ptitle">${esc(pick(ph.title, lang))}</span><span class="pmeta">${meta}</span></span></summary><div class="pbody"><p class="why">${esc(pick(ph.why, lang))}</p>${body}</div></details></li>`;
  }).join('');

  // three quick wins: the highest-scoring quick fixes
  const quick = issues.filter((f) => f.effort === 'quick').sort((a, b) => b.pts - a.pts).slice(0, 3);
  const quickMin = quick.reduce((a) => a + MINUTES.quick + 2, 0);
  const quickGain = Math.round(quick.reduce((a, f) => a + f.pts, 0));
  const startHere = quick.length ? `<section class="start"><h2>${U.startHere}</h2><p class="hint">${U.startLead(quickMin, quickGain)}</p><ul class="todo">${quick.map(todoItem).join('')}</ul></section>` : '';

  const est = plan.estimate;
  const scale = (v) => `${Math.max(0, Math.min(100, v))}%`;
  const prompt = promptText(plan, scan, lang);
  const fixPrompts = Object.fromEntries(issues.map((f) => [fkey(f), fixPrompt(f, scan, lang)]));
  const pageRes = scan.kind === 'site' ? [...(scan.pageResults || [])].sort((a, b) => b.total - a.total) : [];
  for (const p of pageRes.slice(0, 60)) for (const f of p.findings) if (f.kind === 'issue') fixPrompts[fkey(f)] = fixPrompt(f, scan, lang);
  const failed = scan.kind === 'site' ? (scan.pages || []).filter((p) => p.error) : [];
  const pagesHtml = !pageRes.length ? '' : `<section id="pages" role="tabpanel" aria-labelledby="t-pages" hidden>
  <h2>${esc(U.pagesTitle(pageRes.length))}</h2>
  <p class="lead">${U.pagesLead}</p>
  <ol class="pages">${pageRes.map((p, i) => {
    const iss = p.findings.filter((f) => f.kind === 'issue');
    let href = p.url || p.path;
    return `<li><details class="page"${i === 0 ? ' open' : ''}><summary><span class="pscore tone-${BAND_TONE[p.band]}">${p.total}</span><span class="ppath"><code>${esc(p.path)}</code><small>${esc(T.bands[p.band])} · ${esc(U.pageIssues(iss.length))}${p.words != null ? ` · ${esc(p.words)} ${esc(T.words)}` : ''}</small></span><span class="bar"><i style="width:${Math.max(0, Math.min(100, p.total))}%"></i></span></summary>
    <div class="pagebody"><p class="hint"><a href="${esc(href)}" target="_blank" rel="noopener">${U.openPage} ↗</a></p>
    ${iss.length ? iss.slice(0, 6).map((f, j) => findingItem(f, lang, U, j === 0 && i === 0, scan)).join('') : `<p>${U.cleanPage}</p>`}
    ${iss.length > 6 ? `<details class="more"><summary>${U.more(iss.length - 6)}</summary>${iss.slice(6).map((f) => findingItem(f, lang, U, false, scan)).join('')}</details>` : ''}</div></details></li>`;
  }).join('')}</ol>
  ${failed.length ? `<h3 style="margin-top:28px">${U.failedPages}</h3><ul class="plain">${failed.map((p) => `<li><code>${esc(p.path)}</code> — ${esc(p.error)}</li>`).join('')}</ul>` : ''}
</section>`;

  return `<!doctype html>
<html lang="${lang === 'tr' ? 'tr' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Slop Meter · ${esc(scan.display || scan.target)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet">
<style>
/* Direction: a lab instrument read-out. Pale glass, slate ink, a fuchsin stain for slop, methylene blue for information. */
:root{--bg:#edf1f0;--surface:#f9fbfa;--ink:#14232b;--muted:#566870;--line:#cbd7d5;--stain:#ad2357;--blue:#1f4e8c;--good:#2a7653;--warn:#a96a12;
--display:'Familjen Grotesk','Helvetica Neue',Arial,sans-serif;--text:'Source Serif 4',Georgia,serif;--mono:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#0e1517;--surface:#152024;--ink:#e2eae8;--muted:#93a5a7;--line:#27393d;--stain:#ef6390;--blue:#88b3ea;--good:#5cc493;--warn:#e2aa4c;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 var(--text)}
code,.mono{font-family:var(--mono);font-size:.86em}
a{color:var(--blue)}
:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.wrap{max-width:1040px;margin:0 auto;padding-inline:max(18px,env(safe-area-inset-left))}
header{border-bottom:1px solid var(--line);background:var(--surface)}
header .wrap{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between;padding-block:14px}
.brand{display:flex;gap:10px;align-items:center;font:700 20px/1 var(--display);letter-spacing:.01em}
.brand svg{width:26px;height:26px}
.brand small{display:block;font:500 12px/1.3 var(--display);color:var(--muted);letter-spacing:0}
.target{font:500 13px/1.4 var(--mono);color:var(--muted);overflow-wrap:anywhere;max-width:520px}
nav.tabs{display:flex;gap:4px;border:1px solid var(--line);border-radius:8px;padding:3px;background:var(--bg)}
nav.tabs button{font:600 15px/1 var(--display);border:0;background:none;color:var(--muted);padding:10px 16px;border-radius:6px;cursor:pointer}
nav.tabs button[aria-selected=true]{background:var(--surface);color:var(--ink);box-shadow:0 1px 0 var(--line)}
main{padding-block:32px 64px}
h1,h2,h3{font-family:var(--display);line-height:1.15;margin:0;text-wrap:balance}
h2{font-size:22px;margin-bottom:6px}
h3{font-size:19px}
h4{font:600 12px/1.3 var(--display);text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin:16px 0 6px}
.lead{color:var(--muted);margin:0 0 16px;max-width:60ch}
.hero{display:grid;grid-template-columns:220px minmax(0,1fr);gap:40px;align-items:center}
.dial{width:220px;height:220px}
.dial .track{fill:none;stroke:var(--line);stroke-width:10}
.dial .arc{fill:none;stroke-width:10;stroke-linecap:round}
.dial .ticks line{stroke:var(--muted);stroke-width:1.5}
.dial .cross{stroke:var(--line);stroke-width:1.5}
.dial .num{font:700 58px var(--display);fill:var(--ink)}
.tone-good .arc{stroke:var(--good)} .tone-warn .arc{stroke:var(--warn)} .tone-bad .arc{stroke:var(--stain)}
.band{font:700 34px/1.1 var(--display)}
.band small{font:500 16px var(--display);color:var(--muted);margin-left:8px}
.bandtext{font-size:19px;margin:8px 0 0;max-width:46ch}
.delta{display:inline-block;margin-top:12px;font:600 14px/1 var(--mono);padding:6px 10px;border-radius:999px;background:var(--surface);border:1px solid var(--line)}
.delta.down{color:var(--good)} .delta.up{color:var(--stain)}
.meta{margin-top:14px;font:13px/1.5 var(--mono);color:var(--muted)}
.block{margin-top:44px}
.cats{display:grid;gap:10px;max-width:640px}
.cat{display:grid;grid-template-columns:minmax(120px,190px) minmax(0,1fr) 64px;gap:14px;align-items:center;font:500 15px var(--display)}
.bar{display:block;height:10px;background:var(--line);border-radius:5px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--stain);border-radius:5px}
.cat.info .bar i{background:var(--muted)}
.cval{font:600 15px var(--mono);text-align:right;font-variant-numeric:tabular-nums}
.cval small{color:var(--muted);font-weight:400}
.finding{border-top:1px solid var(--line)}
.finding:last-child{border-bottom:1px solid var(--line)}
.finding>summary{display:grid;grid-template-columns:64px minmax(0,1fr);gap:14px;align-items:baseline;padding:14px 4px;cursor:pointer;list-style:none}
.finding>summary::-webkit-details-marker{display:none}
.finding[open]>summary{padding-bottom:4px}
.pts{font:600 15px var(--mono);font-variant-numeric:tabular-nums}
.pts.tone-high{color:var(--stain)} .pts.tone-medium{color:var(--warn)} .pts.tone-low{color:var(--muted)}
.ftitle{font:600 17px/1.3 var(--display)}
.chips{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:4px;font:500 12.5px var(--display);color:var(--muted)}
.fbody{padding:0 4px 18px 82px;max-width:78ch}
.fbody p{margin:6px 0}
.fdo{display:block;margin-top:5px;font-size:15.5px;line-height:1.4;color:var(--ink);max-width:70ch}
.fdo b{color:var(--good);font-family:var(--display)}
.todo-box{border-left:3px solid var(--good);background:var(--surface);border-radius:0 8px 8px 0;padding:4px 18px 14px;margin-top:8px}
.todo-box h4:first-child{margin-top:12px}
.steps{margin:4px 0 8px;padding-left:22px}
.steps li{margin:6px 0;padding-left:4px}
.steps li::marker{font:700 14px var(--display);color:var(--good)}
.ex{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}
.ex>div{border:1px solid var(--line);border-radius:6px;padding:8px 12px;background:var(--bg)}
.ex span{font:600 11.5px var(--display);text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.ex p{margin:4px 0 0;font-size:15px}
.ex .was{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--stain)}
p.ex{display:block;color:var(--muted)}
.donewhen{font-size:15px;color:var(--muted)}
.donewhen b{color:var(--ink);font-family:var(--display)}
.btn.small{font-size:14px;padding:9px 13px}
details.why-box{margin-top:12px}
details.why-box>summary{cursor:pointer;color:var(--blue);font:500 14px var(--display);padding:4px 0}
.where .steps{margin-top:8px}
.where .row{margin-top:8px}
nav.tabs button small{font:600 12px var(--mono);color:var(--muted);margin-left:4px}
.pages{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:0}
.page{border-top:1px solid var(--line)}
.pages>li:last-child .page{border-bottom:1px solid var(--line)}
.page>summary{display:grid;grid-template-columns:56px minmax(0,1fr) minmax(80px,200px);gap:16px;align-items:center;padding:12px 4px;cursor:pointer;list-style:none}
.page>summary::-webkit-details-marker{display:none}
.pscore{font:700 24px/1 var(--display);font-variant-numeric:tabular-nums;text-align:right}
.pscore.tone-good{color:var(--good)} .pscore.tone-warn{color:var(--warn)} .pscore.tone-bad{color:var(--stain)}
.ppath code{font-size:15px;color:var(--ink);overflow-wrap:anywhere}
.ppath small{display:block;font:500 12.5px var(--display);color:var(--muted);margin-top:3px}
.pagebody{padding:0 4px 16px 72px}
.pagebody .finding:first-of-type{border-top:0}
.pagelist a{text-decoration:none}
ul.ev,ul.locs{margin:0;padding:0;list-style:none}
ul.ev li{font:13.5px/1.5 var(--mono);padding:3px 0;color:var(--ink);overflow-wrap:anywhere}
ul.locs li{font-size:14px;padding:2px 0;overflow-wrap:anywhere}
ul.locs li code{color:var(--blue)}
ul.locs li span{color:var(--muted)}
.plain{padding-left:18px;margin:6px 0}
.plain li{margin:4px 0}
.good{color:var(--good)} .bad{color:var(--stain)}
.hist{list-style:none;padding:0;margin:0;display:grid;gap:8px;max-width:520px}
.hist li{display:grid;grid-template-columns:48px minmax(0,1fr) 40px;gap:12px;align-items:center}
/* plan */
.goal{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:22px 24px}
.goal p{margin:0 0 14px;font-size:18px;max-width:60ch}
.scale{position:relative;height:44px;margin:8px 0 4px}
.scale .rail{position:absolute;left:0;right:0;top:18px;height:8px;border-radius:4px;background:linear-gradient(90deg,var(--good) 0 20%,var(--warn) 20% 60%,var(--stain) 60%);opacity:.35}
.scale .mark{position:absolute;top:0;transform:translateX(-50%);text-align:center;font:600 12px/1.2 var(--mono)}
.scale .mark i{display:block;width:2px;height:16px;margin:2px auto 0;background:currentColor}
.scale .now{color:var(--stain);top:0}.scale .est{color:var(--good)}.scale .tgt{color:var(--ink)}
.calm{color:var(--muted);margin:14px 0 0;font-size:16px}
.nums{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px 22px;margin-bottom:12px}
.nums div{display:flex;flex-direction:column}
.nums span{font:500 12px/1.3 var(--display);text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.nums b{font:700 46px/1 var(--display);font-variant-numeric:tabular-nums}
.nums b.now{color:var(--stain)} .nums b.est{color:var(--good)}
.nums .to{font:500 30px/1 var(--display);color:var(--muted);padding-bottom:6px}
.nums .tgtbox{margin-left:auto;padding-left:20px;border-left:1px solid var(--line)}
.start{margin-top:26px;padding:20px 24px;border:2px solid var(--good);border-radius:10px;background:var(--surface)}
.phases{list-style:none;margin:34px 0 0;padding:0;display:grid;gap:14px}
.phase>details{border-top:1px solid var(--line);padding-top:14px}
.phase>details>summary{display:grid;grid-template-columns:44px minmax(0,1fr);gap:16px;align-items:center;cursor:pointer;list-style:none}
.phase>details>summary::-webkit-details-marker{display:none}
.ptitle{display:block;font:700 19px/1.2 var(--display)}
.pbody{padding:6px 0 6px 60px}
.pnum{font:700 20px/40px var(--display);width:40px;height:40px;text-align:center;border-radius:50%;border:2px solid var(--ink)}
details.more{margin-top:8px}
details.more>summary{cursor:pointer;color:var(--blue);font:500 14px var(--display);padding:6px 0}
.why{color:var(--muted);margin:4px 0 8px;max-width:66ch}
.pmeta{display:flex;flex-wrap:wrap;gap:4px 16px;font:500 13px var(--mono);color:var(--muted);margin-top:3px}
.todo{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.todo>li{padding:8px 0;border-bottom:1px dashed var(--line)}
.todo label{display:grid;grid-template-columns:24px minmax(0,1fr);gap:10px;cursor:pointer}
.todo input{width:18px;height:18px;margin-top:3px;accent-color:var(--good)}
.todo b{font:600 16px var(--display)}
.todo em{display:block;font-style:normal;color:var(--muted);font-size:15px}
.todo input:checked+span{opacity:.5;text-decoration:line-through;text-decoration-color:var(--muted)}
.where{margin:6px 0 0 34px;font-size:14px}
.where summary{cursor:pointer;color:var(--blue);font:500 13px var(--display)}
.method{margin:12px 0 0;padding-left:18px;color:var(--ink);font-size:15px}
.method li{margin:5px 0}
.hint{color:var(--muted);font-size:15px;margin:6px 0 10px}
.qs{margin:0;padding-left:20px;display:grid;gap:12px}
.qs label{display:block;font-size:15.5px;margin-bottom:4px}
.qs textarea{width:100%;font:15px/1.4 var(--text);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:8px 10px;resize:vertical}
.row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:12px}
.btn{font:600 15px var(--display);background:var(--ink);color:var(--bg);border:0;border-radius:6px;padding:11px 16px;cursor:pointer}
.btn.ghost{background:none;color:var(--ink);border:1px solid var(--line)}
.status{font:13px var(--mono);color:var(--good)}
details.rules{margin-top:32px;border-top:1px solid var(--line);padding-top:12px}
details.rules summary{cursor:pointer;font:600 16px var(--display)}
.progress{font:600 14px var(--mono);color:var(--muted)}
footer{border-top:1px solid var(--line);color:var(--muted);font:13px var(--mono)}
footer .wrap{padding-block:18px 32px}
[hidden]{display:none!important}
@media (max-width:760px){.page>summary{grid-template-columns:44px minmax(0,1fr)}.page>summary .bar{display:none}.pagebody{padding-left:0}.ex{grid-template-columns:1fr}.pbody{padding-left:0}.nums .tgtbox{margin-left:0}.hero{grid-template-columns:1fr;gap:16px;justify-items:start}.dial{width:180px;height:180px}.fbody{padding-left:4px}.cat{grid-template-columns:minmax(0,1fr) 64px}.cat .bar{grid-column:1/-1;grid-row:2}}
@media (prefers-reduced-motion:no-preference){.dial .arc{transition:stroke-dasharray .8s ease-out}}
</style>
</head>
<body>
<header><div class="wrap">
  <div class="brand"><svg viewBox="0 0 26 26" aria-hidden="true"><path d="M3 18a10 10 0 0 1 20 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13 8v2M6 11l1.4 1.4M20 11l-1.4 1.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M13 18l5-6" stroke="var(--stain)" stroke-width="2.2" stroke-linecap="round"/><circle cx="13" cy="18" r="2.2" fill="var(--stain)"/></svg><div>AI Slop Meter<small>${lang === 'tr' ? 'Slop\'u ölç, sonra temizle.' : 'Measure the AI slop. Then fix it.'}</small></div></div>
  <div class="target">${esc(scan.display || scan.target)}</div>
  <nav class="tabs" role="tablist">
    <button role="tab" id="t-report" aria-controls="report" aria-selected="true">${U.tabReport}</button>
    <button role="tab" id="t-plan" aria-controls="plan" aria-selected="false">${U.tabPlan}</button>${pagesHtml ? `
    <button role="tab" id="t-pages" aria-controls="pages" aria-selected="false">${U.tabPages} <small>${pageRes.length}</small></button>` : ''}
  </nav>
</div></header>

<main class="wrap">
<section id="report" role="tabpanel" aria-labelledby="t-report">
  <div class="hero">
    ${dial(scan.total, scan.band)}
    <div>
      <div class="band">${esc(T.bands[scan.band])}<small>${scan.total} ${U.of}</small></div>
      <p class="bandtext">${esc(T.bandText[scan.band])}</p>
      ${delta !== null ? `<span class="delta ${delta <= 0 ? 'down' : 'up'}">${delta > 0 ? '+' : ''}${delta} ${U.since}</span>` : ''}
      <div class="meta">${esc(scan.words)} ${esc(T.words)} · ${esc(T.lang)}: ${esc(scan.lang)}${scan.files ? ` · ${scan.files} ${esc(T.files)}` : ''}${pageRes.length ? ` · ${pageRes.length} ${esc(U.pagesWord.toLowerCase())}` : ''} · ${esc(T.scanId)} ${esc(scan.id)}</div>
    </div>
  </div>

  <section class="block"><h2>${U.categories}</h2><div class="cats">${catRows}</div></section>

  <section class="block">
    <h2>${U.findings} <span class="progress">(${issues.length})</span></h2>
    <p class="lead">${U.findingsNote}</p>
    ${issues.length ? issues.slice(0, 8).map((f, i) => findingItem(f, lang, U, i < 2, scan)).join('') : `<p>${U.none}</p>`}
    ${issues.length > 8 ? `<details class="more"><summary>${U.more(issues.length - 8)}</summary>${issues.slice(8).map((f) => findingItem(f, lang, U, false, scan)).join('')}</details>` : ''}
  </section>

  ${strengths.length ? `<section class="block"><h2>${U.strengths}</h2><p class="lead">${U.strengthsNote}</p><ul class="plain">${strengths.map((f) => `<li><span class="good mono">${fmt(f.pts)}</span> ${esc(pick(f.title, lang))}: <code>${esc((f.evidence || []).join(', '))}</code></li>`).join('')}</ul></section>` : ''}
  ${builder.length ? `<section class="block"><h2>${U.builder}</h2><p class="lead">${U.builderNote}</p><ul class="plain">${builder.map((f) => `<li>${esc(pick(f.title, lang))}: <code>${esc((f.evidence || []).join(', '))}</code></li>`).join('')}</ul></section>` : ''}
  ${scan.aeo?.total ? `<section class="block"><h2>${U.aeo}: ${scan.aeo.passed}/${scan.aeo.total}</h2><p class="lead">${U.aeoNote}</p><ul class="plain">${scan.aeo.checks.map((c) => `<li><span class="${c.ok ? 'good' : 'bad'} mono">${c.ok ? '✓' : '✗'}</span> <b>${esc(pick(c.label, lang))}</b>: ${esc(pick(c.detail, lang))}${c.ok ? '' : `<br><span class="hint">${esc(pick(c.fix, lang))}</span>`}</li>`).join('')}</ul></section>` : ''}
  ${notes ? `<section class="block"><h2>${U.notes}</h2><ul class="plain">${notes}</ul></section>` : ''}
  ${histHtml}
</section>

<section id="plan" role="tabpanel" aria-labelledby="t-plan" hidden>
  <div class="goal">
    <div class="nums"><div><span>${U.now}</span><b class="now">${scan.total}</b></div><div class="to">${U.arrow}</div><div><span>${U.after}</span><b class="est">~${est}</b></div><div class="tgtbox"><span>${U.target}</span><b>${plan.targetScore}</b></div></div>
    <p class="calm">${U.calm}</p>
    <div class="row"><span class="progress" id="progress"></span></div>
  </div>
  ${startHere}
  <ol class="phases">${phaseHtml}</ol>
  ${plan.keep ? `<p class="hint"><b>${U.keepTitle}:</b> ${esc(plan.keep)}${plan.kept?.length ? ` · ${esc(plan.kept.map((f) => pick(f.title, lang)).join(', '))}` : ''}</p>` : ''}
  <details class="rules"><summary>${U.rulesTitle}</summary><ul class="method">${plan.rules.map((r) => `<li>${esc(pick(r, lang))}</li>`).join('')}</ul></details>
  <div class="row" style="margin-top:28px"><button type="button" class="btn ghost" data-copy="prompt">${U.copyPrompt}</button><span class="status" aria-live="polite"></span></div>
  <p class="hint">${U.promptNote}</p>
  <textarea id="prompt-text" hidden readonly>${esc(prompt)}</textarea>
</section>
${pagesHtml}
</main>
<footer><div class="wrap">${esc(U.generated(dateStr))}</div></footer>

<script>
(() => {
  const KEY = ${js(storeKey)};
  const FIX = ${js(fixPrompts)};
  const store = { get(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } },
                  set(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} } };
  const tabs = [...document.querySelectorAll('[role=tab]')];
  function show(id){ tabs.forEach(t => { const on = t.getAttribute('aria-controls') === id; t.setAttribute('aria-selected', on); document.getElementById(t.getAttribute('aria-controls')).hidden = !on; });
    if (history.replaceState) history.replaceState(null, '', '#' + id); }
  tabs.forEach(t => t.addEventListener('click', () => show(t.getAttribute('aria-controls'))));
  if (location.hash === '#plan' || location.hash === '#pages') show(location.hash.slice(1));

  const state = store.get();
  const boxes = [...document.querySelectorAll('input[type=checkbox][data-id]')];
  const prog = document.getElementById('progress');
  function count(){ const ids = [...new Set(boxes.map(b => b.dataset.id))]; const n = ids.filter(id => boxes.find(b => b.dataset.id === id && b.checked)).length; prog.textContent = ${js(U.progressLabel)} + ': ' + n + ' / ' + ids.length; }
  boxes.forEach(b => { b.checked = !!(state.done || {})[b.dataset.id];
    b.addEventListener('change', () => { const s = store.get(); s.done = s.done || {}; s.done[b.dataset.id] = b.checked; store.set(s);
      boxes.forEach(o => { if (o !== b && o.dataset.id === b.dataset.id) o.checked = b.checked; }); count(); }); });
  count();
  document.querySelectorAll('textarea[data-q]').forEach(t => { t.value = (state.answers || {})[t.id] || '';
    t.addEventListener('input', () => { const s = store.get(); s.answers = s.answers || {}; s.answers[t.id] = t.value; store.set(s); }); });

  async function copy(text, status){ try { await navigator.clipboard.writeText(text); status.textContent = ${js(U.copied)}; }
    catch { const ta = document.getElementById('prompt-text'); ta.hidden = false; ta.value = text; ta.select(); status.textContent = ${js(U.copyFail)}; } }
  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
    const status = btn.parentElement.querySelector('.status');
    if (btn.dataset.copy === 'answers') {
      const lines = [...document.querySelectorAll('textarea[data-q]')].filter(t => t.value.trim()).map(t => '- ' + t.dataset.q + '\\n  ' + t.value.trim().replace(/\\n/g, '\\n  '));
      copy(lines.join('\\n'), status);
    } else if (btn.dataset.copy === 'fix') copy(FIX[btn.dataset.fid] || FIX[btn.dataset.fid.split('|')[0] + '|'] || '', status);
    else copy(document.getElementById('prompt-text').value, status);
  }));
})();
</script>
</body>
</html>`;
}

function slug(target) {
  const s = String(target);
  if (/^https?:\/\//.test(s)) return s.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'report';
  // local path: last folder or file name plus a short hash of the full path, so two "app" folders do not collide
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const base = s.replace(/[\\/]+$/, '').split(/[\\/]/).pop().replace(/\.html?$/i, '').replace(/[^\w.-]+/g, '-') || 'report';
  return `${base}-${h.toString(36).slice(0, 5)}`;
}

export function reportDir() {
  return process.env.AISLOPMETER_REPORT_DIR || join(homedir(), '.aislopmeter', 'reports');
}

/** Write the report for a scan. One file per target, overwritten on each scan, so the newest is always in the same place. */
export async function saveReport(scan, opts = {}) {
  const dir = opts.dir || reportDir();
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${slug(scan.target)}.html`);
  await writeFile(file, renderHtml(scan, opts), 'utf8');
  return file;
}

/** Open a file in the default browser without going through a shell. Resolves true once the opener started. */
export function openInBrowser(file) {
  const [cmd, args] = process.platform === 'darwin' ? ['open', [file]] : process.platform === 'win32' ? ['explorer.exe', [file]] : ['xdg-open', [file]];
  return new Promise((resolve) => {
    try {
      const p = spawn(cmd, args, { detached: true, stdio: 'ignore' });
      p.once('error', () => resolve(false));
      p.once('spawn', () => { p.unref(); resolve(true); });
    } catch {
      resolve(false);
    }
  });
}
