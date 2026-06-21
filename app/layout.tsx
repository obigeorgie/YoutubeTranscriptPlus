import type { Metadata } from 'next';
import './globals.css';
import { AppSessionProvider } from '@/components/session-provider';
import { BRAND_DESCRIPTION, BRAND_FULL_NAME, BRAND_URL } from '@/lib/brand';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  title: BRAND_FULL_NAME,
  description: BRAND_DESCRIPTION,
  openGraph: {
    title: BRAND_FULL_NAME,
    description: 'Fetch YouTube transcripts and generate quick summaries with YTTP.',
    url: BRAND_URL,
    siteName: BRAND_FULL_NAME,
    type: 'website',
  },
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
