// Measurements taken inside a real browser: computed colours and contrast, the fonts actually used,
// how much is centred, whether cards really are identical, big gradients and radii.
// measureVisual() must stay self-contained: Playwright serialises it with toString() and runs it in
// the page, and the browser build calls it directly.

export async function measureVisual() {
  try { await document.fonts?.ready; } catch { /* ignore */ }
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 800;
  const parse = (c) => {
    const m = String(c || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const visible = (el, s) => {
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  };
  const rootBg = (() => {
    for (const el of [document.body, document.documentElement]) {
      const c = el && parse(getComputedStyle(el).backgroundColor);
      if (c && c.a > 0.5) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  })();
  // background behind an element; null when an image or gradient is in the way
  const bgOf = (el) => {
    const stack = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 0.99) break; }
    }
    let out = rootBg;
    for (let i = stack.length - 1; i >= 0; i--) out = blend(stack[i], out);
    return out;
  };
  const firstFamily = (f) => String(f || '').split(',')[0].replace(/["']/g, '').trim();
  const label = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70);

  // text elements: elements with their own visible text
  const texts = [];
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode() && texts.length < 1500) {
    const n = walker.currentNode;
    if (!n.nodeValue || n.nodeValue.trim().length < 2) continue;
    const el = n.parentElement;
    if (!el || seen.has(el) || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG|CODE|PRE)$/i.test(el.tagName)) continue;
    seen.add(el);
    const s = getComputedStyle(el);
    if (!visible(el, s)) continue;
    texts.push({ el, s });
  }

  // contrast (WCAG): 4.5:1, or 3:1 for large text
  const fails = [];
  let checked = 0;
  for (const { el, s } of texts) {
    const fg = parse(s.color);
    if (!fg || fg.a < 0.3) continue;
    if ((s.webkitBackgroundClip || s.backgroundClip) === 'text') continue;
    const bg = bgOf(el);
    if (!bg) continue;
    const size = parseFloat(s.fontSize) || 16;
    const bold = (parseInt(s.fontWeight, 10) || 400) >= 700;
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    const r = ratio(fg.a < 1 ? blend(fg, bg) : fg, bg);
    // text the same colour as its ground is hidden on purpose (spacers, screen-reader text), not low contrast
    if (r < 1.15) continue;
    checked++;
    if (r < need) fails.push({ text: label(el), ratio: Math.round(r * 100) / 100, need, fg: hex(fg), bg: hex(bg) });
  }
  fails.sort((a, b) => a.ratio / a.need - b.ratio / b.need);

  // fonts actually rendered
  const fontOf = (sel) => { const el = document.querySelector(sel); return el ? firstFamily(getComputedStyle(el).fontFamily) : null; };
  const fonts = { body: fontOf('body'), h1: fontOf('h1'), h2: fontOf('h2'), button: fontOf('button, a[class*="btn"], a[class*="button"]') };

  // how much is centred: headings and paragraphs with centred text, or boxes centred in a narrow column
  let blocks = 0, centred = 0;
  for (const el of document.querySelectorAll('h1, h2, h3, p')) {
    const s = getComputedStyle(el);
    if (!visible(el, s) || (el.textContent || '').trim().length < 3) continue;
    blocks++;
    if (s.textAlign === 'center') { centred++; continue; }
    const r = el.getBoundingClientRect();
    if (r.width < vw * 0.7 && Math.abs(r.left + r.width / 2 - vw / 2) < 8 && (el.textContent || '').length < 160) centred++;
  }

  // identical cards: 3+ siblings of the same size and look, each with a heading or bold title and text
  const groups = [];
  for (const parent of document.querySelectorAll('div, section, ul, ol')) {
    const kids = [...parent.children];
    if (kids.length < 3 || kids.length > 12) continue;
    const boxes = kids.map((k) => ({ k, r: k.getBoundingClientRect(), s: getComputedStyle(k) })).filter((b) => b.r.width > 120 && b.r.height > 80 && visible(b.k, b.s));
    if (boxes.length < 3) continue;
    const w = boxes[0].r.width;
    const sameW = boxes.filter((b) => Math.abs(b.r.width - w) <= 2);
    if (sameW.length < 3) continue;
    const look = (b) => [b.s.borderRadius, b.s.backgroundColor, b.s.boxShadow !== 'none', b.s.borderTopWidth].join('|');
    const counts = {};
    for (const b of sameW) counts[look(b)] = (counts[look(b)] || 0) + 1;
    const [key, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (n < 3) continue;
    const cards = sameW.filter((b) => look(b) === key);
    const styled = cards[0].s.boxShadow !== 'none' || parseFloat(cards[0].s.borderRadius) >= 8 || parseFloat(cards[0].s.borderTopWidth) > 0 || (parse(cards[0].s.backgroundColor)?.a || 0) > 0;
    const titled = cards.every((b) => b.k.querySelector('h2, h3, h4, h5, strong, b') && (b.k.textContent || '').trim().split(/\s+/).length <= 45);
    // a list of posts, projects or products (each card a link, or with its own photo) is content, not the feature-card template
    const listing = cards.filter((b) => b.k.tagName === 'A' || b.k.closest('a[href]') || b.k.querySelector('h2 a[href], h3 a[href], h4 a[href], h5 a[href]')
      || [...b.k.querySelectorAll('img, picture, video')].some((m) => m.getBoundingClientRect().width >= 120)).length;
    if (!styled || !titled || listing >= cards.length / 2) continue;
    if (groups.some((g) => g.el.contains(parent) || parent.contains(g.el))) continue;
    groups.push({ el: parent, n: cards.length, sample: label(cards[0].k).slice(0, 50), radius: cards[0].s.borderRadius });
  }

  // large gradients and gradient text
  const gradients = [];
  let gradientText = 0, bigRadius = 0, boxes = 0, glows = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (boxes > 4000) break;
    const s = getComputedStyle(el);
    if (s.display === 'none') continue;
    boxes++;
    if (/gradient\(/.test(s.backgroundImage)) {
      const r = el.getBoundingClientRect();
      const clip = (s.webkitBackgroundClip || s.backgroundClip) === 'text';
      if (clip) gradientText++;
      else if (r.width * r.height > vw * vh * 0.08) gradients.push({ css: s.backgroundImage.slice(0, 160), area: Math.round((r.width * r.height) / (vw * vh) * 100) / 100 });
    }
    if (parseFloat(s.borderTopLeftRadius) >= 12 && el.getBoundingClientRect().width > 40) bigRadius++;
    if (/(^|,)\s*rgba?\([^)]*\)\s+0px\s+0px\s+([89]|[1-9]\d)px/.test(s.boxShadow) || /0px 0px ([89]|[1-9]\d)px/.test(s.textShadow)) glows++;
  }

  return {
    v: 1,
    viewport: [vw, vh],
    background: { color: hex(rootBg), luminance: Math.round(lum(rootBg) * 1000) / 1000 },
    fonts,
    contrast: { checked, failed: fails.length, worst: fails.slice(0, 6) },
    centred: { blocks, centred },
    cards: { groups: groups.length, cards: groups.reduce((a, g) => a + g.n, 0), samples: groups.slice(0, 4).map((g) => ({ n: g.n, sample: g.sample, radius: g.radius })) },
    gradients: gradients.slice(0, 6),
    gradientText,
    radius: { big: bigRadius, boxes },
    glows,
    darkScheme: window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
  };
}
