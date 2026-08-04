import { FadeIn } from "@/components/shared/FadeIn";

// Placeholder Instagram post gradients to simulate a real feed
const instagramPosts = [
  { id: 1, gradient: "from-[#E8C5A8] to-[#D4A878]" },
  { id: 2, gradient: "from-[#D8B5A0] to-[#C4A090]" },
  { id: 3, gradient: "from-[#F0E0C8] to-[#E0C8A8]" },
  { id: 4, gradient: "from-[#E8D5C0] to-[#D4C0A8]" },
  { id: 5, gradient: "from-[#DCC8B0] to-[#C8B098]" },
  { id: 6, gradient: "from-[#F0D8C8] to-[#E0C0A8]" },
];

export function InstagramSection() {
  return (
    <section className="py-20 md:py-24 bg-cream-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <FadeIn>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-gold mb-3 font-semibold">
              Sosyal Medya
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-chocolate mb-3">
              Her an bir lezzet anı
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <a
              href="https://instagram.com/funda.1959"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-base text-warm-brown hover:text-chocolate transition-colors group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              @funda.1959
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </FadeIn>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {instagramPosts.map((post, index) => (
            <FadeIn
              key={post.id}
              delay={
                index < 4
                  ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300)
                  : 0
              }
            >
              <a
                href="https://instagram.com/funda.1959"
                target="_blank"
                rel="noopener noreferrer"
                className={`block aspect-square rounded-xl overflow-hidden bg-gradient-to-br ${post.gradient} relative group`}
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/25 transition-colors duration-300 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-cream-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </div>

                {/* Decorative content */}
                <div className="absolute inset-0 flex items-center justify-center opacity-15">
                  <p className="font-serif text-4xl font-bold text-espresso">F</p>
                </div>
              </a>
            </FadeIn>
          ))}
        </div>

        {/* CTA */}
        <FadeIn delay={400}>
          <div className="mt-8 text-center">
            <a
              href="https://instagram.com/funda.1959"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-sand text-warm-brown rounded-xl font-sans text-sm font-semibold hover:border-chocolate hover:text-chocolate transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Instagram&apos;da Takip Et
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
