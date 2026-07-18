export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function buildShareText(
  gameName: string,
  puzzleNo: number,
  elapsedMs: number,
  emojiGrid: string,
  url: string,
  hintsUsed = 0,
): string {
  const hints = hintsUsed > 0 ? ` · 💡${hintsUsed}` : '';
  const lines = [`${gameName} #${puzzleNo} — ${formatTime(elapsedMs)}${hints}`];
  if (emojiGrid) lines.push(emojiGrid);
  lines.push(url);
  return lines.join('\n');
}

/** Share via native sheet when available, else clipboard. Returns how it was delivered. */
export async function shareResult(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'failed';
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
