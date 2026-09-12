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
      <main>{children}</main>
      <Footer />
    </>
  );
}
