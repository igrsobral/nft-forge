function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function nftImageUrl(name: string, collection: string, hue: number): string {
  const accent = (hue + 36) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 42% 28%)"/>
      <stop offset="1" stop-color="hsl(${accent} 38% 12%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="590" cy="190" r="120" fill="hsl(${hue} 70% 62%)" fill-opacity="0.35"/>
  <rect x="70" y="470" width="250" height="8" fill="white" fill-opacity="0.7"/>
  <text x="70" y="640" fill="white" font-family="ui-sans-serif,system-ui,sans-serif" font-size="42">${escapeXml(name)}</text>
  <text x="70" y="690" fill="white" fill-opacity="0.75" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24">${escapeXml(collection)}</text>
</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
