import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const demoUsername = process.env.DEMO_USERNAME ?? 'demo';
const demoPassword = process.env.DEMO_PASSWORD;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Demo login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!demoPassword) return null;
        const username = credentials?.username?.trim();
        const password = credentials?.password;
        if (username === demoUsername && password === demoPassword) {
          return {
            id: 'demo-user',
            name: 'Demo User',
            email: `${demoUsername}@youtubetranscriptplus.com`,
          };
        }
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
};
