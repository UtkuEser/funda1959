import Link from "next/link";

export type AccountNavKey = "dashboard" | "orders" | "addresses" | "profile";

const ITEMS: { key: AccountNavKey; label: string; href: string }[] = [
  { key: "dashboard", label: "Hesabım", href: "/hesabim" },
  { key: "orders", label: "Siparişlerim", href: "/hesabim/siparislerim" },
  { key: "addresses", label: "Adreslerim", href: "/hesabim/adreslerim" },
  { key: "profile", label: "Profil Bilgilerim", href: "/hesabim/profil" },
];

export function AccountNav({ current }: { current: AccountNavKey }) {
  return (
    <nav aria-label="Hesap menüsü">
      {/* Mobile — horizontal scroll tabs */}
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((i) => {
          const active = current === i.key;
          return (
            <Link
              key={i.key}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 font-sans text-[13.5px] transition-colors ${
                active
                  ? "bg-burgundy/[0.07] font-semibold text-burgundy"
                  : "font-medium text-warm-brown hover:text-burgundy"
              }`}
            >
              {i.label}
            </Link>
          );
        })}
      </div>

      {/* Desktop — vertical text nav */}
      <ul className="hidden lg:block lg:space-y-0.5">
        {ITEMS.map((i) => {
          const active = current === i.key;
          return (
            <li key={i.key}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`block border-l-2 py-1.5 pl-3 font-sans text-[14px] transition-colors ${
                  active
                    ? "border-burgundy font-semibold text-burgundy"
                    : "border-transparent font-medium text-warm-brown hover:text-burgundy"
                }`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
        <li className="mt-3 border-t border-sand-light pt-3">
          {/* TODO: real signOut() + session clear when Supabase Auth is connected */}
          <Link
            href="/giris"
            className="block py-1.5 pl-3 font-sans text-[14px] font-medium text-warm-brown transition-colors hover:text-burgundy"
          >
            Çıkış Yap
          </Link>
        </li>
      </ul>
    </nav>
  );
}
