import type { Metadata } from 'next';
import './globals.css';
import { AppSessionProvider } from '@/components/session-provider';

export const metadata: Metadata = {
  title: 'YouTube Transcript Plus',
  description: 'Paste a YouTube URL and get the transcript plus a quick summary.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
