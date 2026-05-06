import type { Metadata, Viewport } from 'next';
import { Geist_Mono } from 'next/font/google';
import FontSizeEffect from '@/components/FontSizeEffect';
import FloatingControls from '@/components/FloatingControls';
import GestureControl from '@/components/GestureControl';
import PageTransition from '@/components/PageTransition';
import './globals.css';

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'Passage',
  description: 'Discover destinations calibrated to your passport.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} font-mono antialiased`}>
        <FontSizeEffect />
        <PageTransition>{children}</PageTransition>
        <FloatingControls />
        <GestureControl />
      </body>
    </html>
  );
}
