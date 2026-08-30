import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { AccountNav, type AccountNavKey } from "./AccountNav";

export function AccountShell({
  current,
  title,
  subtitle,
  children,
}: {
  current: AccountNavKey;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Container className="pt-24 pb-16 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-[1080px]">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <div className="lg:pt-1">
            <AccountNav current={current} />
          </div>

          <div className="mt-8 lg:mt-0">
            <h1 className="font-serif text-[26px] md:text-[30px] font-semibold leading-[1.14] text-burgundy">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 font-sans text-[14px] text-warm-brown">{subtitle}</p>
            )}

            <div className="mt-7">{children}</div>

            <div className="mt-12 border-t border-sand-light pt-5 lg:hidden">
              {/* TODO: real signOut() when Supabase Auth is connected */}
              <Link
                href="/giris"
                className="font-sans text-[13px] font-semibold text-warm-brown hover:text-burgundy"
              >
                Çıkış Yap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
