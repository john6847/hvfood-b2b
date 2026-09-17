import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(
    'https://horizon-vert-wholesale.widzer-ridore-1.chatgpt.site',
  ),
  title: 'Horizon Vert Foods | Wholesale',
  description:
    'The Horizon Vert Foods wholesale design preview. Discover authentic ingredients, build a case order, and explore a better way to buy wholesale.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Horizon Vert Foods | Wholesale',
    description: 'Quality ingredients. Lasting partnerships.',
    type: 'website',
    images: [
      {
        url: 'https://horizon-vert-wholesale.widzer-ridore-1.chatgpt.site/og.png',
        width: 1731,
        height: 909,
        alt: 'Horizon Vert Foods — Wholesale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      'https://horizon-vert-wholesale.widzer-ridore-1.chatgpt.site/og.png',
    ],
    title: 'Horizon Vert Foods | Wholesale',
    description: 'Quality ingredients. Lasting partnerships.',
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
