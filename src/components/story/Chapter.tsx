import type { ReactNode } from "react";

type ChapterProps = {
  label: string;
  title: string;
  paragraphs: string[];
  emphasis?: string;
  /** Yanında gösterilecek arşiv görseli. */
  media?: ReactNode;
  /** Görselin masaüstündeki tarafı. */
  mediaSide?: "left" | "right";
  id?: string;
};

/** Hikâye bölümü — kısa anlatı, tarih vurgusu ve isteğe bağlı arşiv görseli. */
export function Chapter({
  label,
  title,
  paragraphs,
  emphasis,
  media,
  mediaSide = "right",
  id,
}: ChapterProps) {
  const text = (
    <div className={media ? "lg:col-span-7" : "max-w-[75ch]"}>
      <p className="font-sans text-[13px] uppercase tracking-[0.18em] text-bordo/80">
        {label}
      </p>

      <h2 className="mt-5 max-w-[20ch] font-serif text-[clamp(1.85rem,3.2vw,3.5rem)] leading-[1.1] text-ink">
        {title}
      </h2>

      <div className="mt-8 space-y-6">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph.slice(0, 28)}
            className="max-w-[70ch] font-sans text-[clamp(1.0625rem,0.35vw+0.95rem,1.1875rem)] leading-[1.75] text-ink-soft"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {emphasis ? (
        <p className="mt-10 max-w-[34ch] border-l-2 border-bordo/50 pl-6 font-serif text-[clamp(1.375rem,1.9vw,2rem)] leading-[1.35] text-bordo">
          {emphasis}
        </p>
      ) : null}
    </div>
  );

  if (!media) {
    return <div id={id}>{text}</div>;
  }

  return (
    <div id={id} className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
      {mediaSide === "left" ? (
        <>
          <div className="order-2 lg:order-1 lg:col-span-5">{media}</div>
          <div className="order-1 lg:order-2 lg:col-span-7">{text}</div>
        </>
      ) : (
        <>
          {text}
          <div className="lg:col-span-5">{media}</div>
        </>
      )}
    </div>
  );
}
