// README badge: an SVG file, or a shields.io endpoint JSON.
const COLORS = { clean: '#2a7653', trace: '#5b8a3c', noticeable: '#b07d12', heavy: '#c2410c', pure: '#ad2357' };

export function badgeJson(scan) {
  return { schemaVersion: 1, label: 'AI slop', message: `${scan.total}/100`, color: COLORS[scan.band] || '#555' };
}

export function badgeSvg(scan) {
  const label = 'AI slop';
  const value = `${scan.total}/100`;
  const w = (s) => Math.round(s.length * 6.6 + 12);
  const lw = w(label), vw = w(value), W = lw + vw;
  const color = COLORS[scan.band] || '#555';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="20" role="img" aria-label="${label}: ${value}"><title>${label}: ${value}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="r"><rect width="${W}" height="20" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#14232b"/><rect x="${lw}" width="${vw}" height="20" fill="${color}"/><rect width="${W}" height="20" fill="url(#s)"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="${lw / 2}" y="14">${label}</text><text x="${lw + vw / 2}" y="14">${value}</text></g></svg>
`;
}
