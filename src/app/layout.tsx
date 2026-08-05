import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { site } from "@/content/site";
import { localBusinessSchema } from "@/lib/schema";

const display = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const body = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.positioning}`,
    template: `%s | ${site.name}`,
  },
  description: site.shortDescription,
  keywords: [
    "Funda 1959",
    "Ankara pastane",
    "Ankara pastanesi",
    "Ankara yaş pasta",
    "özel gün pastası Ankara",
    "hediye kutusu Ankara",
    "GOP pastane",
    "Panora pastane",
    "İncek pastane",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: site.name,
    title: `${site.name} | ${site.positioning}`,
    description: site.shortDescription,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.positioning}`,
    description: site.shortDescription,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable}`}
    >
      <body className="bg-cream font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
