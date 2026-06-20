import { NextResponse } from 'next/server';
import { getTranscript } from '@/lib/youtube';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const url = typeof body?.url === 'string' ? body.url : '';
    if (!url.trim()) {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }

    const data = await getTranscript(url);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch transcript';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
