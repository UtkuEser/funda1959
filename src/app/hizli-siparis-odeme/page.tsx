import type { Metadata } from "next";
import { PaymentPage } from "@/components/payment/PaymentPage";

export const metadata: Metadata = {
  title: "Güvenli Ödeme",
  robots: { index: false, follow: false },
};

export default function OdemePage() {
  return <PaymentPage />;
}
