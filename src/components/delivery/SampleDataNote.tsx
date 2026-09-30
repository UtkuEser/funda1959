import { isSampleInventory } from "@/lib/inventory/source";

/**
 * One wording, wherever sample data is shown as if it were real.
 * `about` names what is sample; `show` overrides the default (inventory) source flag.
 */
export function SampleDataNote({
  className = "",
  about = "fiyat ve teslimat bilgileri",
  show = isSampleInventory,
}: {
  className?: string;
  about?: string;
  show?: boolean;
}) {
  if (!show) return null;
  return (
    <p className={`font-sans text-[11.5px] leading-snug text-taupe ${className}`}>
      Tasarım önizlemesi: {about} örnek veridir.
    </p>
  );
}
