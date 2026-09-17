import type { Metadata } from "next";
import { PreviewBar } from "@/components/ui/preview-bar";
import { brand } from "@/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${brand.name} | Wholesale`,
    template: `%s | ${brand.shortName} Wholesale`,
  },
  description: "Wholesale ordering for approved business customers of Horizon Vert Foods.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <PreviewBar />
        {children}
      </body>
    </html>
  );
}
