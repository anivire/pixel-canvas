import ClientLayout from './layout.client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ClientLayout>
        <body>{children}</body>
      </ClientLayout>
    </html>
  );
}
