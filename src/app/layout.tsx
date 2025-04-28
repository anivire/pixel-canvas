import ClientLayout from './layout.client';
import { Inter } from 'next/font/google';

export const inter = Inter({
  display: 'block',
  subsets: ['cyrillic', 'latin'],
  preload: true,
  weight: 'variable',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ClientLayout>
        <body style={inter.style}>{children}</body>
      </ClientLayout>
    </html>
  );
}
