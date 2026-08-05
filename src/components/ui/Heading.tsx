type HeadingProps = {
  label?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
};

/** Bölüm başlığı — etiket, başlık ve kısa giriş. Dekorasyon yok. */
export function Heading({
  label,
  title,
  lead,
  align = "left",
  tone = "dark",
  className = "",
}: HeadingProps) {
  const light = tone === "light";

  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} ${className}`}>
      {label ? (
        <p
          className={`t-label font-sans ${light ? "text-cream/85" : "text-bordo/80"}`}
        >
          {label}
        </p>
      ) : null}

      <h2
        className={`t-h2 mt-5 font-serif ${light ? "text-cream" : "text-ink"} ${
          align === "center" ? "mx-auto" : ""
        } max-w-[18ch]`}
      >
        {title}
      </h2>

      {lead ? (
        <p
          className={`t-body measure mt-6 ${light ? "text-cream/80" : "text-ink-soft"} ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {lead}
        </p>
      ) : null}

    </div>
  );
}
