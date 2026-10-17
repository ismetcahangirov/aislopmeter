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

  // ---- layout and typography: what makes text hard to read, or a layout look unfinished ----
  const px = (v) => parseFloat(v) || 0;
  const sample = (list, el, extra) => { if (list.length < 4) list.push({ text: label(el).slice(0, 60), ...extra }); };
  const paras = [...document.querySelectorAll('p, li, dd, blockquote')].filter((el) => {
    const s = getComputedStyle(el);
    return visible(el, s) && (el.textContent || '').trim().split(/\s+/).length >= 12 && !el.closest('nav, footer, header, aside, figcaption, small, table, pre, code');
  }).slice(0, 300);
  const longLines = [], tinyText = [], tightLeading = [], justified = [];
  const counts = { longLines: 0, tinyText: 0, tightLeading: 0, justified: 0 };
  let checkedParas = 0;
  for (const el of paras) {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const fs = px(s.fontSize) || 16;
    const lh = s.lineHeight === 'normal' ? fs * 1.2 : px(s.lineHeight);
    const chars = (el.textContent || '').replace(/\s+/g, ' ').trim().length;
    const lines = Math.max(1, Math.round(r.height / (lh || fs * 1.2)));
    checkedParas++;
    if (lines >= 2 && chars / lines > 95) { counts.longLines++; sample(longLines, el, { chars: Math.round(chars / lines) }); }
    if (fs < 14) { counts.tinyText++; sample(tinyText, el, { size: Math.round(fs * 10) / 10 }); }
    if (lines >= 2 && lh / fs < 1.15) { counts.tightLeading++; sample(tightLeading, el, { ratio: Math.round((lh / fs) * 100) / 100 }); }
    if (s.textAlign === 'justify') { counts.justified++; sample(justified, el, {}); }
  }

  // text that touches the edge of the window, boxes that spill out, text hidden under something else
  const edge = [], spill = [], covered = [], cramped = [], nested = [];
  let edgeN = 0, spillN = 0, coveredN = 0, crampedN = 0, nestedN = 0;
  const docW = document.documentElement.scrollWidth;
  const pageOverflow = docW > vw + 4;
  for (const { el } of texts.slice(0, 600)) {
    const r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 8 || r.top > vh * 4) continue;
    const words = (el.textContent || '').trim().split(/\s+/).length;
    // touching the edge, not clipped by it (slides of a carousel sit partly off screen on purpose)
    if (words >= 3 && ((r.left >= 0 && r.left < 4) || (r.right <= vw && r.right > vw - 4))) { edgeN++; sample(edge, el, { left: Math.round(r.left) }); }
    if (r.top >= 0 && r.top < vh && r.width > 40) {
      const x = Math.min(vw - 1, Math.max(0, r.left + Math.min(r.width / 2, 30))), y = r.top + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      // banners, sticky headers and chat bubbles float over content on purpose
      const floating = (n) => { for (let e = n; e && e.nodeType === 1; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
      if (hit && hit !== el && !el.contains(hit) && !hit.contains(el) && !floating(hit) && !floating(el)) {
        const hs = getComputedStyle(hit);
        const opaque = (parse(hs.backgroundColor)?.a || 0) > 0.9 || /url\(/.test(hs.backgroundImage) || hit.tagName === 'IMG';
        if (opaque && hs.pointerEvents !== 'none' && !/^(HTML|BODY)$/.test(hit.tagName)) { coveredN++; sample(covered, el, { by: hit.tagName.toLowerCase() }); }
      }
    }
  }
  const styledBox = (s) => (parse(s.backgroundColor)?.a || 0) > 0.05 || px(s.borderTopWidth) > 0 || s.boxShadow !== 'none';
  for (const el of document.querySelectorAll('div, section, article, li, a')) {
    if (crampedN + nestedN > 400) break;
    const s = getComputedStyle(el);
    if (!visible(el, s) || !styledBox(s)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 40) continue;
    if (el.scrollWidth > el.clientWidth + 4 && s.overflowX === 'visible' && (el.textContent || '').trim()) { spillN++; sample(spill, el, { by: el.scrollWidth - el.clientWidth }); }
    const words = (el.textContent || '').trim().split(/\s+/).length;
    const pad = Math.min(px(s.paddingLeft), px(s.paddingTop), px(s.paddingRight));
    if (words >= 4 && words <= 80 && pad < 8 && (parse(s.backgroundColor)?.a || 0) > 0.05 && el.children.length) { crampedN++; sample(cramped, el, { pad: Math.round(pad) }); }
    // a card inside a card: both styled, both card-sized
    const outer = el.parentElement && el.parentElement.closest('div, section, article, li');
    if (outer && r.width < outer.getBoundingClientRect().width - 16) {
      const os = getComputedStyle(outer);
      const cardish = (x) => px(x.borderTopLeftRadius) >= 8 && (px(x.borderTopWidth) > 0 || x.boxShadow !== 'none') && (parse(x.backgroundColor)?.a || 0) > 0.02;
      if (cardish(s) && cardish(os) && outer.getBoundingClientRect().height < vh * 1.5) { nestedN++; sample(nested, el, {}); }
    }
  }

  // type hierarchy: how much bigger the headings are than the body
  // the largest heading of each level against the typical (median) paragraph size
  const sizeOf = (sel) => { const v = [...document.querySelectorAll(sel)].filter((el) => visible(el, getComputedStyle(el))).map((el) => px(getComputedStyle(el).fontSize)); return v.length ? Math.max(...v) : null; };
  const pSizes = (paras.length ? paras : [...document.querySelectorAll('p')]).map((el) => px(getComputedStyle(el).fontSize)).filter(Boolean).sort((a, b) => a - b);
  const bodySize = pSizes.length ? pSizes[Math.floor(pSizes.length / 2)] : px(getComputedStyle(document.body).fontSize) || 16;
  const hierarchy = { body: bodySize, h1: sizeOf('h1'), h2: sizeOf('h2'), h3: sizeOf('h3') };

  // ---- template signs measured on screen ----
  let gridBg = 0, hairline = 0, eyebrows = 0, numbered = 0, pulsingDots = 0, marquees = 0;
  const eyebrowSamples = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
    const s = getComputedStyle(el);
    if (s.display === 'none') continue;
    const r = el.getBoundingClientRect();
    if (/(?:1px|0\.5px|2px),\s*transparent|transparent\s+(?:1px|0\.5px|2px)/.test(s.backgroundImage) && r.width * r.height > vw * vh * 0.15) gridBg++;
    if (px(s.borderTopWidth) === 1 && /(?:\s|^)(?:[3-9]\d|\d{3})px/.test((s.boxShadow.match(/\)\s*(?:-?\d+px\s+){2}(\d+px)/) || [])[0] || '') && r.width > 120) hairline++;
    if (s.animationName && s.animationName !== 'none' && r.width > 0 && r.width <= 16 && r.height <= 16 && px(s.borderTopLeftRadius) >= r.width / 2 - 1) pulsingDots++;
    if (s.animationName && s.animationName !== 'none' && s.animationIterationCount === 'infinite' && r.width > vw * 0.9 && el.children.length >= 4) marquees++;
  }
  for (const h of document.querySelectorAll('h1, h2')) {
    const prev = h.previousElementSibling;
    if (!prev) continue;
    const s = getComputedStyle(prev);
    const t = (prev.textContent || '').trim();
    if (!t || t.split(/\s+/).length > 6 || !visible(prev, s)) continue;
    if (/^(?:0?\d{1,2}|[IVX]+)(?:\s*[.\/—–-]|\s*$)/.test(t)) numbered++;
    if ((s.textTransform === 'uppercase' || px(s.letterSpacing) >= 1) && px(s.fontSize) <= 15) { eyebrows++; if (eyebrowSamples.length < 4) eyebrowSamples.push(t.slice(0, 40)); }
  }
  // only the site's own images: a blocked third-party host or a local file preview is not a broken page
  const ownImage = (src) => { try { const u = new URL(src, location.href); return /^https?:$/.test(location.protocol) && u.origin === location.origin; } catch { return false; } };
  const brokenImages = [...document.images].filter((im) => im.complete && im.naturalWidth === 0 && ownImage(im.currentSrc || im.src) && visible(im, getComputedStyle(im))).slice(0, 20).map((im) => (im.currentSrc || im.src).slice(0, 120));

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
    layout: {
      paragraphs: checkedParas,
      longLines: { n: counts.longLines, samples: longLines },
      tinyText: { n: counts.tinyText, samples: tinyText },
      tightLeading: { n: counts.tightLeading, samples: tightLeading },
      justified: { n: counts.justified, samples: justified },
      edge: { n: edgeN, samples: edge },
      spill: { n: spillN, samples: spill, page: pageOverflow, pageWidth: docW },
      covered: { n: coveredN, samples: covered },
      cramped: { n: crampedN, samples: cramped },
      nested: { n: nestedN, samples: nested },
      hierarchy,
    },
    signs: { gridBg, hairline, eyebrows, eyebrowSamples, numbered, pulsingDots, marquees },
    brokenImages,
  };
}
