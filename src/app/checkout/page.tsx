import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { getCheckoutMember } from "@/lib/customer-auth/next";

export const metadata: Metadata = {
  title: "Siparişinizi Tamamlayın",
  robots: { index: false, follow: false },
};

export default async function Checkout() {
  // a signed-in member's profile and saved addresses (D24); guests get null and checkout as before
  const member = await getCheckoutMember();
  return <CheckoutPage member={member} />;
}
