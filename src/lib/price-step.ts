export function stepByKey(current: number, key: string, min: number, max: number): number | null {
  if (key === 'Home') return min
  if (key === 'End') return max
  const jump = key === 'PageUp' || key === 'PageDown' ? 10 : 1
  if (key === 'ArrowRight' || key === 'ArrowUp' || key === 'PageUp') {
    return Math.min(max, current + jump)
  }
  if (key === 'ArrowLeft' || key === 'ArrowDown' || key === 'PageDown') {
    return Math.max(min, current - jump)
  }
  return null
}
