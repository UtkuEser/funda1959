import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "Siparişinizi Tamamlayın",
  robots: { index: false, follow: false },
};

export default function Checkout() {
  return <CheckoutPage />;
}
