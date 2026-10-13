import type { NextRequest } from "next/server";
import { refreshCustomerSession } from "@/lib/customer-auth/proxy";

/**
 * Next 16 Proxy (formerly Middleware). Refreshes the customer's Supabase
 * session on the routes that read it (SUPABASE_PLAN.md §8.2) — nothing else.
 * Admin pages and routes are not matched: the admin session is unrelated
 * (D6, D25). No redirects here; every page and route checks the session.
 */
export async function proxy(request: NextRequest) {
  return refreshCustomerSession(request);
}

export const config = {
  matcher: [
    "/hesabim/:path*",
    "/checkout",
    "/giris",
    "/uye-ol",
    "/uyelik-tamamla",
    "/sifre-yenile",
    "/api/account/:path*",
    "/api/orders",
    "/api/orders/quote",
  ],
};
