function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function nftImageUrl(name: string, _collection: string, hue: number): string {
  const accent = (hue + 28) % 360
  const variant = hue % 3
  const accessory =
    variant === 0
      ? `<circle cx="400" cy="300" r="78" fill="none" stroke="hsl(${accent} 30% 18%)" stroke-width="10"/><circle cx="362" cy="300" r="28" fill="hsl(${hue} 25% 22%)"/><circle cx="438" cy="300" r="28" fill="hsl(${hue} 25% 22%)"/>`
      : variant === 1
        ? `<path d="M300 250h200c18 0 28 16 22 32l-28 70H306l-28-70c-6-16 4-32 22-32z" fill="hsl(${accent} 28% 42%)"/>`
        : `<path d="M250 430c40-70 90-90 150-90s110 20 150 90" fill="none" stroke="hsl(${accent} 40% 32%)" stroke-width="18" stroke-linecap="round"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${escapeXml(name)}">
  <rect width="800" height="800" fill="#f3ecdf"/>
  <ellipse cx="400" cy="690" rx="210" ry="150" fill="hsl(${hue} 32% 38%)"/>
  <circle cx="400" cy="340" r="150" fill="hsl(${accent} 28% 46%)"/>
  <ellipse cx="348" cy="332" rx="16" ry="18" fill="#2a211c"/>
  <ellipse cx="452" cy="332" rx="16" ry="18" fill="#2a211c"/>
  <path d="M360 400c24 22 56 22 80 0" fill="none" stroke="#2a211c" stroke-width="8" stroke-linecap="round"/>
  ${accessory}
</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
