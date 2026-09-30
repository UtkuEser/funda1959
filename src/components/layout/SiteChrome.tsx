"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * Renders the public site chrome (header + footer) everywhere except the admin
 * area, which ships its own shell in src/app/admin/layout.tsx.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // /admin (and /admin-giris) and /merkez-giris get their own minimal auth
  // chrome — never the public Header/Footer.
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/merkez-giris")) {
    return <>{children}</>;
  }
  return (
    <>
      <Header />
      {/* pages offset themselves for the header's top row; on desktop the
          fixed header also has a 48px menu row (+1px hairline), reserved here once */}
      <main className="lg:pt-[49px]">{children}</main>
      <Footer />
    </>
  );
}
