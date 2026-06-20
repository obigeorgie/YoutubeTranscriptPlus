'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type Result = {
  videoId: string;
  transcriptText: string;
  segments: { text: string; offset?: number; duration?: number }[];
  summary: { bullets: string[]; summary: string };
};

export function TranscriptForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/10 backdrop-blur">
        <label className="block text-sm text-white/70">Paste a YouTube URL</label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-sky-400"
          />
          <button
            disabled={loading}
            className="rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Fetching…' : 'Get transcript'}
          </button>
        </div>
      </form>

      {error ? <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}

      {result ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 text-lg font-semibold">Summary</h2>
            <ul className="space-y-2 text-sm text-white/80">
              {result.summary.bullets.map((bullet, index) => (
                <li key={index} className="rounded-2xl bg-black/20 p-3">{bullet}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 text-lg font-semibold">Transcript</h2>
            <div className="max-h-[540px] space-y-3 overflow-auto pr-1 text-sm text-white/75">
              {result.segments.map((segment, index) => (
                <p key={index} className="rounded-2xl bg-black/20 p-3 leading-6">
                  {segment.text}
                </p>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
