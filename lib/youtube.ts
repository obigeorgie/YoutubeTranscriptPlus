import { fetchTranscript } from 'youtube-transcript-plus';

export type TranscriptSegment = {
  text: string;
  duration?: number;
  offset?: number;
  lang?: string;
};

export function extractYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host.endsWith('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      const short = parts.find((part) => /^[a-zA-Z0-9_-]{11}$/.test(part));
      return short ?? null;
    }
  } catch {
    // ignore URL parsing errors and fall through to fallback parsing
  }

  const fallback = value.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[?&/]|$)/);
  return fallback?.[1] ?? null;
}

export function summarizeTranscript(text: string) {
  const cleaned = text.replace(/\s+/g, ' ').replace(/\u0000/g, '').trim();

  if (!cleaned) {
    return {
      bullets: [] as string[],
      summary: 'No transcript text was returned.',
    };
  }

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);

  const keywords = new Map<string, number>();
  for (const word of cleaned.toLowerCase().split(/[^a-z0-9]+/)) {
    if (word.length < 4) continue;
    keywords.set(word, (keywords.get(word) ?? 0) + 1);
  }

  const scored = sentences
    .map((sentence, index) => {
      const words = sentence.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const score = words.reduce((total, word) => total + (keywords.get(word) ?? 0), 0) + Math.max(0, 12 - index);
      return { sentence, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.sentence);

  const bullets = scored.length ? scored : [cleaned.slice(0, 280) + (cleaned.length > 280 ? '…' : '')];

  return {
    bullets,
    summary: bullets.join(' '),
  };
}

export async function getTranscript(input: string) {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) {
    throw new Error('Please paste a valid YouTube URL or video ID.');
  }

  const segments = (await fetchTranscript(input, { retries: 2, retryDelay: 750 })) as TranscriptSegment[];
  const transcriptText = segments.map((segment) => segment.text).join(' ').trim();
  const summary = summarizeTranscript(transcriptText);

  return {
    videoId,
    transcriptText,
    segments,
    summary,
  };
}
