import { Figure } from "@/components/ui/Figure";
import type { Branch } from "@/content/branches";

type BranchCardProps = {
  branch: Branch;
  detailed?: boolean;
};

export function BranchCard({ branch, detailed = false }: BranchCardProps) {
  return (
    <article className="group flex h-full flex-col bg-cream">
      <Figure
        asset={branch.image}
        ratio={detailed ? "aspect-[3/2]" : "aspect-[4/5]"}
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw"
      />

      <div className="flex flex-1 flex-col border-x border-b border-stone/25 px-6 py-7">
        <h3 className="font-serif text-2xl text-ink">{branch.shortName}</h3>
        <p className="mt-2 font-sans text-[13px] uppercase tracking-[0.16em] text-bordo/70">
          {branch.atmosphere}
        </p>

        <p className="mt-4 font-sans text-[15px] leading-[1.7] text-ink-soft">
          {branch.description}
        </p>

        <dl className="mt-6 space-y-2 font-sans text-[14px] text-ink-soft">
          <div className="flex gap-2">
            <dt className="sr-only">Adres</dt>
            <dd>{branch.address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Çalışma saatleri</dt>
            <dd className="text-ink-mute">{branch.hours}</dd>
          </div>
        </dl>

        {detailed ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {branch.features.map((feature) => (
              <li
                key={feature}
                className="border border-stone/40 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.14em] text-ink-mute"
              >
                {feature}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-5 pt-7">
          <a
            href={branch.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-bordo/35 pb-1 font-sans text-[12px] uppercase tracking-[0.18em] text-bordo transition-colors hover:border-bordo"
          >
            Yol Tarifi
          </a>
          <a
            href={branch.phoneHref}
            className="pb-1 font-sans text-[12px] uppercase tracking-[0.18em] text-ink-mute transition-colors hover:text-bordo"
          >
            {branch.phone}
          </a>
        </div>
      </div>
    </article>
  );
}
