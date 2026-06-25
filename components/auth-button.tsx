'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

export function AuthButton() {
  const { data: session, status } = useSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      username: 'demo',
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid password.');
    }
    setLoading(false);
  }

  if (status === 'loading') {
    return (
      <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70">
        Loading…
      </button>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right text-xs text-white/60">
          <div className="font-medium text-white">
            {session.user.name ?? session.user.email}
          </div>
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
    <form onSubmit={handleLogin} className="flex flex-col gap-2 sm:min-w-72">
      <div className="flex gap-2">
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Demo password"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 py-2 px-3 text-sm text-white/80 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
        >
          {loading ? 'Signing…' : 'Sign in'}
        </button>
      </div>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
    </form>
  );
}
