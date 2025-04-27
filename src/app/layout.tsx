'use client';

import { CanvasContextProvider } from './(index)/components/canvas-context';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CanvasContextProvider>
        <body>{children}</body>
      </CanvasContextProvider>
    </html>
  );
}
