import type { ReactNode } from "react";
import { BRAND_LOGO_A_GLYPH, BrandLogo } from "@/components/shared/BrandLogo";

/**
 * Shared visual shell for /admin-giris and /merkez-giris. Deliberately
 * plain — no marketing hero, no big imagery: the Funda logo above a
 * black/gray card on off-white, matching the admin panel's own visual language.
 */
export function AdminAuthCard({
  title,
  subtitle,
  children,
  onTitleClick,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /**
   * When set, ONLY the last letter of "FUNDA" ("A") in the logo navigates on
   * click — the hit area is that glyph's own box inside the image
   * (`BRAND_LOGO_A_GLYPH`), nothing more (no wrapping the logo, no extra
   * padding). Deliberately a plain `<span onClick>`, not a `<button>` or a
   * real `<a href>`: a real anchor makes Chrome's link-hover-preview pop up
   * the destination URL on mere hover, outing the hidden route before anyone
   * even clicks it. No visual affordance (no underline/color/cursor/hover) —
   * the logo must look exactly the same with or without it.
   */
  onTitleClick?: () => void;
}) {
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (!onTitleClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTitleClick();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 py-12">
      <div className="w-full max-w-[420px] sm:max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <span className="relative inline-block">
            <BrandLogo height={48} priority className="h-12" />
            {onTitleClick && (
              <span
                role="button"
                tabIndex={0}
                onClick={onTitleClick}
                onKeyDown={handleTitleKeyDown}
                className="absolute"
                style={BRAND_LOGO_A_GLYPH}
              >
                <span className="sr-only">a</span>
              </span>
            )}
          </span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
          <h1 className="text-[19px] font-semibold text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export const authInputClass =
  "h-10 w-full rounded-md border border-neutral-300 px-3 text-[14px] text-neutral-900 focus:border-neutral-900 focus:outline-none";
export const authLabelClass =
  "mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.04em] text-neutral-500";
