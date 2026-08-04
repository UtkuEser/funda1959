import type { Branch } from "@/lib/data";

type BranchCardProps = {
  branch: Branch;
  variant?: "default" | "compact";
};

export function BranchCard({ branch, variant = "default" }: BranchCardProps) {
  return (
    <div className="group bg-cream-light rounded-2xl overflow-hidden border border-sand-light hover:border-gold/40 hover:shadow-lg hover:shadow-sand/20 transition-all duration-300">
      {/* Image placeholder */}
      <div
        className={`w-full ${variant === "compact" ? "h-32" : "h-44"} bg-gradient-to-br ${branch.gradient} relative overflow-hidden`}
      >
        {/* Decorative label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-sans text-xs tracking-[0.25em] uppercase text-espresso/40 mb-1">
            Funda 1959
          </p>
          <p className="font-serif text-3xl font-bold text-espresso/20">
            {branch.shortName}
          </p>
        </div>

        {/* Neighborhood badge */}
        <span className="absolute top-3 left-3 bg-cream-light/90 backdrop-blur-sm text-chocolate text-xs font-sans font-semibold px-3 py-1 rounded-full">
          {branch.neighborhood}
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-serif text-lg font-semibold text-chocolate mb-1 group-hover:text-warm-brown transition-colors">
          {branch.name}
        </h3>
        <p className="font-sans text-sm text-mocha leading-relaxed mb-4">
          {branch.description}
        </p>

        {/* Details */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-start gap-2.5">
            <svg
              className="w-4 h-4 text-gold mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="font-sans text-sm text-warm-brown leading-snug">
              {branch.address}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 text-gold shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <a
              href={`tel:${branch.phone.replace(/\s/g, "")}`}
              className="font-sans text-sm text-warm-brown hover:text-chocolate transition-colors"
            >
              {branch.phone}
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 text-gold shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-sans text-sm text-warm-brown">{branch.hours}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5">
          <a
            href={branch.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-chocolate text-chocolate text-sm font-sans font-semibold rounded-xl hover:bg-chocolate hover:text-cream-light transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Yol Tarifi
          </a>
          <a
            href={`tel:${branch.phone.replace(/\s/g, "")}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-chocolate text-cream-light text-sm font-sans font-semibold rounded-xl hover:bg-chocolate-light transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Ara
          </a>
        </div>
      </div>
    </div>
  );
}
