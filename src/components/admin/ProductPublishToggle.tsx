"use client";

/**
 * "Yayında" of one product (D48, D56) — its general publish state on the site,
 * for every branch (branch stock is separate). Ticking only changes the
 * screen: the list collects the changes and "Yayın Durumlarını Kaydet" sends
 * them; nothing is saved from here.
 */
export function ProductPublishToggle({
  name,
  checked,
  pending,
  disabledReason,
  onChange,
}: {
  name: string;
  /** what the tick shows: the pending choice, else the saved state */
  checked: boolean;
  /** differs from the saved state (not saved yet) */
  pending: boolean;
  /** set when the tick can't be changed here (shown as its tooltip) */
  disabledReason: string | null;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-neutral-700" title={disabledReason ?? undefined}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabledReason !== null}
        aria-label={`${name} yayında${pending ? " (kaydedilmedi)" : ""}`}
        onChange={(e) => onChange(e.target.checked)}
        className={`h-4 w-4 cursor-pointer accent-neutral-900 disabled:cursor-not-allowed ${pending ? "rounded-sm ring-2 ring-neutral-900 ring-offset-1" : ""}`}
      />
      <span className="xl:sr-only">Yayında</span>
    </label>
  );
}
