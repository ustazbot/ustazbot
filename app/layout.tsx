import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UstazBot — Jawapan Agama Islam',
  description:
    'Jawapan ringkas dan tersusun untuk persoalan agama anda. Berdasarkan rujukan ASWJ dan mazhab Shafie.',
  keywords: ['Islam', 'fiqh', 'hukum agama', 'Malaysia', 'UstazBot', 'Shafie'],
  openGraph: {
    title: 'UstazBot — Jawapan Agama Islam',
    description: 'Jawapan ringkas dan tersusun untuk persoalan agama anda.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>{children}</body>
    </html>
  );
}
