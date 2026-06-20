'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70">Loading…</button>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right text-xs text-white/60">
          <div className="font-medium text-white">{session.user.name ?? session.user.email}</div>
          <div>Signed in</div>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('github')}
      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
    >
      Sign in with GitHub
    </button>
  );
}
