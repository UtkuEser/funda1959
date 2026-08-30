import type { Branch } from "@/lib/data";

type BranchCardProps = {
  branch: Branch;
  variant?: "default" | "compact";
};

export function BranchCard({ branch, variant = "default" }: BranchCardProps) {
  return (
    <div className="group flex flex-col">
      {/* Image */}
      <div
        className={`w-full ${
          variant === "compact" ? "aspect-[16/10]" : "aspect-[4/3]"
        } overflow-hidden rounded-lg bg-gradient-to-br ${branch.gradient} relative`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/28 to-transparent" />
        <p className="absolute left-4 bottom-3.5 font-serif text-[15px] text-cream-light/90">
          {branch.neighborhood}
        </p>
      </div>

      {/* Body */}
      <div className="pt-4">
        <h3 className="font-serif text-[22px] md:text-[24px] font-medium text-burgundy">
          {branch.shortName}
        </h3>
        <p className="mt-2 font-sans text-[14px] text-warm-brown leading-relaxed">
          {branch.address}
        </p>
        <p className="mt-1 font-sans text-[13px] text-taupe">{branch.hours}</p>

        <div className="mt-4 flex items-center gap-4">
          <a
            href={branch.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-center gap-1.5 font-sans text-[14px] font-semibold text-burgundy border-b border-burgundy/25 pb-0.5 hover:border-burgundy transition-colors"
          >
            Yol tarifi
            <span className="transition-transform group-hover/link:translate-x-0.5">→</span>
          </a>
          <a
            href={`tel:${branch.phone.replace(/\s/g, "")}`}
            className="font-sans text-[13px] text-taupe hover:text-burgundy transition-colors"
          >
            {branch.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
