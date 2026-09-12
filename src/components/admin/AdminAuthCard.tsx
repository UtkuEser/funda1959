import type { ReactNode } from "react";

/**
 * Shared visual shell for /admin-giris and /merkez-giris. Deliberately
 * plain — no marketing hero, no big imagery, no brand color: black/gray on
 * off-white, matching the admin panel's own visual language.
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
   * When set, ONLY the last letter of "Funda" ("a") navigates on click —
   * the hit area is that single glyph's own inline box, nothing more (no
   * wrapping the heading, no overlay, no extra padding). Deliberately a
   * plain `<span onClick>`, not a `<button>` or a real `<a href>`:
   * - a real anchor makes Chrome's link-hover-preview pop up the
   *   destination URL on mere hover, outing the hidden route before
   *   anyone even clicks it;
   * - a `<button>` needs UA-stylesheet resets (font/line-height/etc.) to
   *   inherit the surrounding typography exactly, whereas a plain span
   *   inherits it for free.
   * No visual affordance (no underline/color/cursor/hover) — it must look
   * exactly like the plain "Funda 1959" text.
   */
  onTitleClick?: () => void;
}) {
  const wordmarkClassName =
    "mb-8 block w-full select-text text-center font-serif text-[22px] font-semibold tracking-tight text-neutral-900";

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
        <p className={wordmarkClassName}>
          {onTitleClick ? (
            <>
              Fund
              <span role="button" tabIndex={0} onClick={onTitleClick} onKeyDown={handleTitleKeyDown}>
                a
              </span>
              {" 1959"}
            </>
          ) : (
            "Funda 1959"
          )}
        </p>
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
