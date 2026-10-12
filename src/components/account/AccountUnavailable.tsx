import { AccountShell } from "./AccountShell";
import type { AccountNavKey } from "./AccountNav";

/** Hesabım when the member's data can't be read right now — said plainly, nothing guessed. */
export function AccountUnavailable({ current, title }: { current: AccountNavKey; title: string }) {
  return (
    <AccountShell current={current} title={title}>
      <div className="rounded-lg border border-sand-light p-6 md:p-10">
        <p className="font-sans text-[14px] leading-relaxed text-warm-brown">
          Hesap bilgileriniz şu an yüklenemiyor. Lütfen biraz sonra tekrar deneyin. Siparişinizi bu
          sırada üye olmadan da verebilirsiniz.
        </p>
      </div>
    </AccountShell>
  );
}
