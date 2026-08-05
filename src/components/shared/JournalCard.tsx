import { Figure } from "@/components/ui/Figure";
import type { JournalEntry } from "@/content/journal";

/** Funda Defteri kartı — blog listesi değil, editorial not. */
export function JournalCard({ entry }: { entry: JournalEntry }) {
  return (
    <article className="flex h-full flex-col">
      <Figure
        asset={entry.image}
        ratio="aspect-[3/2]"
        sizes="(max-width: 768px) 92vw, 28vw"
      />

      <div className="flex flex-1 flex-col pt-6">
        <p className="font-sans text-[11px] uppercase tracking-[0.26em] text-gold">
          {entry.label}
        </p>
        <h3 className="mt-3 font-serif text-[1.5rem] leading-snug text-ink">
          {entry.title}
        </h3>
        <div className="mt-4 h-px w-10 bg-stone/60" />
        <p className="mt-4 font-sans text-[15px] leading-[1.7] text-ink-soft">
          {entry.excerpt}
        </p>
      </div>
    </article>
  );
}
