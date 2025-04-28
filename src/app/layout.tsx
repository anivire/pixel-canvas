import ClientLayout from './layout.client';
import { Inter } from 'next/font/google';
import { twJoin } from 'tailwind-merge';

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
        <body>
          <div className={twJoin(inter.className)}>{children}</div>
        </body>
      </ClientLayout>
    </html>
  );
}
