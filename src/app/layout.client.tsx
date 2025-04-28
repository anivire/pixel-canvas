'use client';

import { CanvasContextProvider } from './(index)/components/canvas-context';
import { Inter } from 'next/font/google';
import { twJoin } from 'tailwind-merge';
import './globals.css';

export const inter = Inter({
  display: 'block',
  subsets: ['cyrillic', 'latin'],
  preload: true,
  weight: 'variable',
});

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CanvasContextProvider>
        <div className={twJoin(inter.className)}>{children}</div>
      </CanvasContextProvider>
    </html>
  );
}
