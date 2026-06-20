import { AuthButton } from '@/components/auth-button';
import { TranscriptForm } from '@/components/transcript-form';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">youtubetranscriptplus.com</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">YouTube transcript + summary</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            Paste a public YouTube URL, fetch the transcript with Next.js 15 API routes, and generate a quick extractive summary.
          </p>
        </div>
        <AuthButton />
      </header>

      {session?.user ? (
        <TranscriptForm />
      ) : (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <h2 className="text-2xl font-semibold">Sign in to continue</h2>
          <p className="mt-3 text-white/70">Use GitHub login to unlock the transcript tool.</p>
        </section>
      )}
    </main>
  );
}
