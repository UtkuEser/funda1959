import type { Metadata } from "next";
import { PaymentPage } from "@/components/payment/PaymentPage";
import { isOrderIntakeOpen } from "@/lib/orders/engine";

export const metadata: Metadata = {
  title: "Güvenli Ödeme",
  robots: { index: false, follow: false },
};

// decided per request from the deployment (VERCEL_ENV), not frozen at build time
export const dynamic = "force-dynamic";

export default function OdemePage() {
  // the demo order button exists only where demo orders may be created:
  // local development and Vercel Preview (test data) — never Production,
  // where POST /api/orders is closed as well
  return <PaymentPage demoOrdersEnabled={isOrderIntakeOpen()} />;
}
