import { Figure } from "@/components/ui/Figure";
import type { Branch } from "@/content/branches";

type BranchCardProps = {
  branch: Branch;
  detailed?: boolean;
};

export function BranchCard({ branch, detailed = false }: BranchCardProps) {
  return (
    <article className="group flex h-full flex-col">
      <Figure
        asset={branch.image}
        ratio={detailed ? "3 / 2" : "4 / 5"}
        sizes="(max-width: 768px) 100vw, 32vw"
        zoom
      />

      <div className="flex flex-1 flex-col pt-6">
        <h3 className="t-card font-serif text-ink">{branch.shortName}</h3>
        <p className="mt-2 font-sans text-[16px] text-bordo/80">{branch.atmosphere}</p>

        <p className="mt-4 font-sans text-[16px] leading-[1.65] text-ink-soft">
          {branch.description}
        </p>

        <p className="mt-4 font-sans text-[16px] text-ink-soft">{branch.address}</p>
        <p className="mt-1 font-sans text-[16px] text-ink-mute">{branch.hours}</p>

        {detailed ? (
          <p className="mt-4 font-sans text-[16px] text-ink-mute">
            {branch.features.join(" · ")}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-6 pt-7">
          <a
            href={branch.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-bordo/40 pb-1 font-sans text-[13px] uppercase tracking-[0.16em] text-bordo transition-colors hover:border-bordo"
          >
            Yol Tarifi
          </a>
          <a
            href={branch.phoneHref}
            className="font-sans text-[16px] text-ink-mute transition-colors hover:text-bordo"
          >
            {branch.phone}
          </a>
        </div>
      </div>
    </article>
  );
}
