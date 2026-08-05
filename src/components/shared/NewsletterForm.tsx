"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/content/site";

/**
 * Backend olmadan çalışır: girilen adresle birlikte hazır bir e-posta açar.
 * İleride bir bülten servisi bağlandığında yalnızca submit gövdesi değişir.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent("E-bülten aboneliği");
    const body = encodeURIComponent(
      `Funda 1959 e-bültenine kaydolmak istiyorum.\n\nE-posta: ${email}`,
    );
    window.location.href = `${site.emailHref}?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <label htmlFor="newsletter-email" className="sr-only">
        E-posta adresiniz
      </label>
      <div className="flex border-b border-cream/30 focus-within:border-cream/70">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-posta adresiniz"
          className="w-full bg-transparent py-3 font-sans text-[16px] text-cream placeholder:text-cream/75 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 px-3 font-sans text-[14px] uppercase tracking-[0.16em] text-cream transition-colors hover:text-cream"
        >
          Katıl
        </button>
      </div>
    </form>
  );
}
