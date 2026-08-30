"use client";

import { useState } from "react";
import { signInWithSocialProvider, type SocialAuthProvider } from "@/lib/auth";
import { AppleIcon, FacebookIcon, GoogleIcon } from "./provider-icons";

const PROVIDERS: {
  id: SocialAuthProvider;
  label: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}[] = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "apple", label: "Apple", Icon: AppleIcon },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon },
];

/**
 * Compact social sign-in row for /giris and /uye-ol — three equal buttons in a
 * single neutral system (no brand-colored blocks). Frontend preview only:
 * the stub starts no real OAuth and no notice is shown on screen.
 *
 * TODO: connect Supabase OAuth — signInWithOAuth({ provider }) + /auth/callback
 * redirect to /hesabim.
 */
export function SocialAuthButtons({ mode = "login" }: { mode?: "login" | "register" }) {
  const [pending, setPending] = useState<SocialAuthProvider | null>(null);

  const handle = async (provider: SocialAuthProvider) => {
    if (pending) return; // block spam / double-click across all provider buttons
    setPending(provider);
    // Result intentionally not surfaced — this is a visual preview.
    await signInWithSocialProvider(provider);
    setPending(null);
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5" data-auth-mode={mode}>
      {PROVIDERS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => handle(id)}
          disabled={pending !== null}
          aria-busy={pending === id}
          aria-label={`${label} ile devam et`}
          className="flex h-[46px] items-center justify-center gap-2 rounded-md border border-sand bg-cream-light px-2 font-sans text-[12px] font-medium text-espresso transition-colors hover:border-taupe hover:bg-cream disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:border-burgundy focus-visible:ring-2 focus-visible:ring-burgundy/35 sm:text-[13px]"
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}
