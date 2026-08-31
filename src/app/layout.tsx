import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { generateLocalBusinessSchema } from "@/lib/schema";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Funda 1959 | Ankara'nın Köklü Cafe & Patisserie",
    template: "%s | Funda 1959",
  },
  description:
    "1959'dan beri Ankara'nın tatlı anlarında. Özel gün pastaları, yaş pastalar, el yapımı çikolatalar ve geleneksel lezzetler. GOP, Panora ve İncek TONA şubelerimizde.",
  keywords: [
    "Ankara pastane",
    "Ankara yaş pasta",
    "Ankara özel gün pastası",
    "GOP pastane",
    "Panora pastane",
    "İncek pastane",
    "Ankara cafe patisserie",
    "Ankara doğum günü pastası",
    "el yapımı çikolata Ankara",
    "Funda 1959",
  ],
  authors: [{ name: "Funda 1959" }],
  creator: "Funda 1959",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Funda 1959",
    title: "Funda 1959 | Ankara'nın Köklü Cafe & Patisserie",
    description:
      "1959'dan beri Ankara'nın tatlı anlarında. Özel gün pastaları, yaş pastalar ve daha fazlası.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Funda 1959 | Ankara'nın Köklü Cafe & Patisserie",
    description: "1959'dan beri Ankara'nın tatlı anlarında.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schema = generateLocalBusinessSchema();

  return (
    <html lang="tr" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </head>
      <body
        className={`${fraunces.variable} ${inter.variable} font-sans bg-cream-light text-espresso antialiased`}
      >
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
