import { socialSignInHref, type SocialAuthProvider } from "@/lib/auth";
import { AppleIcon, FacebookIcon, GoogleIcon } from "./provider-icons";

const PROVIDERS: Record<
  SocialAuthProvider,
  { label: string; Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement }
> = {
  google: { label: "Google", Icon: GoogleIcon },
  apple: { label: "Apple", Icon: AppleIcon },
  facebook: { label: "Facebook", Icon: FacebookIcon },
};

/**
 * Social sign-in row for /giris and /uye-ol — only the providers the server
 * says are available (allowed in code AND enabled in Supabase, D22). Renders
 * nothing when none is: no button for a provider that isn't configured.
 * Each button is a plain link; the sign-in starts on the server.
 */
export function SocialAuthButtons({ providers, next }: { providers: SocialAuthProvider[]; next?: string }) {
  if (providers.length === 0) return null;
  return (
    <div className="grid gap-2 sm:gap-2.5" style={{ gridTemplateColumns: `repeat(${providers.length}, minmax(0, 1fr))` }}>
      {providers.map((id) => {
        const { label, Icon } = PROVIDERS[id];
        return (
          <a
            key={id}
            href={socialSignInHref(id, next)}
            aria-label={`${label} ile devam et`}
            className="flex h-[46px] items-center justify-center gap-2 rounded-md border border-sand bg-cream-light px-2 font-sans text-[12px] font-medium text-espresso transition-colors hover:border-taupe hover:bg-cream focus-visible:outline-none focus-visible:border-burgundy focus-visible:ring-2 focus-visible:ring-burgundy/35 sm:text-[13px]"
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </a>
        );
      })}
    </div>
  );
}
