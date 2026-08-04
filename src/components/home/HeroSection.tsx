import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #2C1A17 0%, #3D2015 35%, #5C3420 65%, #4A2A18 100%)",
        }}
      />

      {/* Warm texture overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(ellipse at 30% 60%, rgba(196, 150, 42, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 30%, rgba(168, 123, 47, 0.2) 0%, transparent 50%)`,
        }}
      />

      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            rgba(245, 240, 232, 0.3) 40px,
            rgba(245, 240, 232, 0.3) 41px
          )`,
        }}
      />

      {/* Warm vignette */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(28, 16, 8, 0.7) 100%)",
        }}
      />

      {/* Decorative ornament */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-5">
        <div
          className="w-full h-full rounded-full border border-gold"
          style={{ boxShadow: "inset 0 0 0 2px rgba(196, 150, 42, 0.3)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <p className="animate-fade-in font-sans text-xs tracking-[0.35em] uppercase text-gold mb-6 opacity-0">
          Ankara · 1959&apos;dan Beri
        </p>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100 font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-cream-light leading-tight mb-6 opacity-0">
          1959&apos;dan beri<br />
          <span className="text-gold italic">Ankara&apos;nın</span>{" "}
          tatlı anlarında.
        </h1>

        {/* Sub */}
        <p className="animate-fade-up delay-300 font-sans text-base sm:text-lg md:text-xl text-cream/70 max-w-2xl mx-auto leading-relaxed mb-10 opacity-0">
          Pastalar, tatlılar, çikolatalar ve özel gün lezzetleriyle Funda, her anı daha unutulmaz kılar.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-500 flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0">
          <Link
            href="/lezzetlerimiz"
            className="group px-8 py-4 bg-gold text-espresso rounded-xl font-sans font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300 shadow-lg shadow-gold/20"
          >
            Lezzetleri Keşfet
            <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/subeler"
            className="px-8 py-4 bg-cream-light/10 text-cream-light border border-cream-light/25 rounded-xl font-sans font-semibold text-sm tracking-wide hover:bg-cream-light/20 transition-all duration-300"
          >
            Şubelerimizi Gör
          </Link>
        </div>

        {/* Est. badge */}
        <div className="animate-fade-in delay-600 mt-16 inline-flex items-center gap-3 opacity-0">
          <div className="w-10 h-px bg-gold/40" />
          <p className="font-sans text-xs text-cream/40 tracking-widest uppercase">
            Est. 1959 · Ankara
          </p>
          <div className="w-10 h-px bg-gold/40" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-5 h-5 text-cream/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
}
