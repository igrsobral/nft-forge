function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

// Hand-drawn ape artwork served from /public/nft — cycled across the catalog so
// neighboring cards show different pieces (editorial content keeps the SVG generator).
const STATIC_NFT_ART = [
  '/nft/ape-emerald.png',
  '/nft/ape-sage.png',
  '/nft/ape-neon.png',
  '/nft/ape-solar.png',
] as const

export function nftArtUrl(recordId: string): string {
  const index = Number.parseInt(recordId.replace(/^nft_/, ''), 10)
  const slot = index > 0 ? (index - 1) % STATIC_NFT_ART.length : 0
  return STATIC_NFT_ART[slot] ?? STATIC_NFT_ART[0]
}

export function nftImageUrl(name: string, _collection: string, hue: number, frame = 0): string {
  const accent = (hue + 28 + frame * 17) % 360
  const variant = (hue + frame) % 3
  const dx = frame * 28
  const dy = frame * 12
  const accessory =
    variant === 0
      ? `<circle cx="400" cy="300" r="78" fill="none" stroke="hsl(${accent} 30% 18%)" stroke-width="10"/><circle cx="362" cy="300" r="28" fill="hsl(${hue} 25% 22%)"/><circle cx="438" cy="300" r="28" fill="hsl(${hue} 25% 22%)"/>`
      : variant === 1
        ? `<path d="M300 250h200c18 0 28 16 22 32l-28 70H306l-28-70c-6-16 4-32 22-32z" fill="hsl(${accent} 28% 42%)"/>`
        : `<path d="M250 430c40-70 90-90 150-90s110 20 150 90" fill="none" stroke="hsl(${accent} 40% 32%)" stroke-width="18" stroke-linecap="round"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${escapeXml(name)}">
  <rect width="800" height="800" fill="#f3ecdf"/>
  <ellipse cx="${400 + dx}" cy="${690 - dy}" rx="210" ry="150" fill="hsl(${hue} 32% 38%)"/>
  <circle cx="${400 + dx}" cy="${340 - dy}" r="150" fill="hsl(${accent} 28% 46%)"/>
  <ellipse cx="${348 + dx}" cy="${332 - dy}" rx="16" ry="18" fill="#2a211c"/>
  <ellipse cx="${452 + dx}" cy="${332 - dy}" rx="16" ry="18" fill="#2a211c"/>
  <path d="M${360 + dx} ${400 - dy}c24 22 56 22 80 0" fill="none" stroke="#2a211c" stroke-width="8" stroke-linecap="round"/>
  ${accessory}
</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
